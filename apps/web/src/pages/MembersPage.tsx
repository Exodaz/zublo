import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, Download, Receipt, Search, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { StatCard } from "@/components/calendar/StatCard";
import { GroupFilter } from "@/components/members/GroupFilter";
import { LedgerTable } from "@/components/members/LedgerTable";
import { MemberRegister } from "@/components/members/MemberRegister";
import { PeriodPicker } from "@/components/members/PeriodPicker";
import { MemberPaymentDialog } from "@/components/subscriptions/MemberPaymentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildLedgerRows,
  buildMemberRows,
  currentPeriod,
  filterLedger,
  filterMembers,
  inPeriod,
  type Period,
  periodRange,
  periodSlug,
  type StatusFilter,
  summarize,
  toLedgerSheet,
  toMembersSheet,
} from "@/lib/memberLedger";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { cn, formatPrice } from "@/lib/utils";
import { currenciesService } from "@/services/currencies";
import { memberPaymentsService } from "@/services/memberPayments";
import { subscriptionMembersService } from "@/services/subscriptionMembers";
import { subscriptionsService } from "@/services/subscriptions";
import type { MemberPayment } from "@/types";

type Tab = "ledger" | "members";

/** Income from family-sharing members (ledger) and every member's status (register). */
export function MembersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [period, setPeriod] = useState<Period>(() => currentPeriod());
  const [tab, setTab] = useState<Tab>("ledger");
  const [group, setGroup] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [paying, setPaying] = useState<{ memberId: string; subscriptionId: string } | null>(null);

  const { data: subscriptions = [] } = useQuery({
    queryKey: queryKeys.subscriptions.all(userId),
    queryFn: () => subscriptionsService.list(userId),
    enabled: !!userId,
  });
  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.subscriptions.members(userId),
    queryFn: () => subscriptionMembersService.list(userId),
    enabled: !!userId,
  });
  const { data: payments = [] } = useQuery({
    queryKey: queryKeys.subscriptions.allMemberPayments(userId),
    queryFn: () => memberPaymentsService.listForUser(userId),
    enabled: !!userId,
  });
  const { data: currencies = [] } = useQuery({
    queryKey: queryKeys.currencies.all(userId),
    queryFn: () => currenciesService.list(userId),
    enabled: !!userId,
  });

  const mainCurrency = currencies.find((currency) => currency.is_main);
  const subsById = useMemo(() => new Map(subscriptions.map((sub) => [sub.id, sub])), [subscriptions]);
  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  // Only groups that have members are worth filtering by.
  const groups = subscriptions.filter((sub) => members.some((m) => m.subscription === sub.id));

  const periodLedger = useMemo(() => {
    const range = periodRange(period);
    return buildLedgerRows(
      payments.filter((payment) => inPeriod(payment.paid_at, range)),
      subsById,
      membersById,
    );
  }, [payments, period, subsById, membersById]);
  const memberRows = useMemo(
    () => buildMemberRows(members, payments, subsById),
    [members, payments, subsById],
  );

  const summary = summarize(periodLedger, memberRows);
  const ledgerRows = filterLedger(periodLedger, { subscriptionId: group, search });
  const beforeStatus = filterMembers(memberRows, { subscriptionId: group, search, status: "all" });
  const registerRows = filterMembers(beforeStatus, { subscriptionId: "", search: "", status });
  const statusCounts = {
    all: beforeStatus.length,
    expired: beforeStatus.filter((row) => row.status === "expired").length,
    expiring: beforeStatus.filter((row) => row.status === "expiring").length,
    active: beforeStatus.filter((row) => row.status === "active").length,
    none: beforeStatus.filter((row) => row.status === "none").length,
  };

  const mainSymbol = mainCurrency?.symbol ?? "$";
  const money = (value: number) => formatPrice(value, mainSymbol, { currencyCode: mainCurrency?.code });

  const payingSub = paying ? subsById.get(paying.subscriptionId) : undefined;
  const payingMember = paying ? membersById.get(paying.memberId) : undefined;

  const openSlip = async (payment: MemberPayment) => {
    // Open synchronously so popup blockers allow it, then load the signed URL.
    const tab = window.open("", "_blank");
    try {
      const url = await memberPaymentsService.slipUrl(payment);
      if (tab && url) tab.location.href = url;
    } catch {
      tab?.close();
      toast.error(t("slip_open_failed"));
    }
  };

  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx");
      const code = mainCurrency?.code ?? "";
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(toLedgerSheet(ledgerRows, code)), "Ledger");
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(toMembersSheet(registerRows, code)), "Members");
      XLSX.writeFile(workbook, `zublo-income-${periodSlug(period)}.xlsx`);
    } catch {
      toast.error(t("unknown_error"));
    }
  };

  const tabButton = (value: Tab, label: string, count: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => setTab(value)}
      className={cn(
        "rounded-xl px-4 py-1.5 text-sm font-medium transition-colors",
        tab === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent",
      )}
    >
      {label} <span className="text-xs opacity-70">{count}</span>
    </button>
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-6 fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Wallet className="h-7 w-7 text-primary" aria-hidden />
            {t("members_income")}
          </h1>
          <p className="text-muted-foreground">{t("members_income_desc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker period={period} onChange={setPeriod} />
          <Button variant="outline" onClick={() => void handleExport()}>
            <Download className="mr-1.5 h-4 w-4" />
            {t("export_excel")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            iconClass="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            label={t("income_in_period")}
            value={money(summary.income)}
            loading={isLoading}
          />
        </div>
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          iconClass="bg-primary/20 text-primary"
          label={t("payments")}
          value={String(summary.payments)}
          loading={isLoading}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-sky-500/20 text-sky-600 dark:text-sky-400"
          label={t("active_members")}
          value={String(summary.active)}
          loading={isLoading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          iconClass="bg-amber-500/20 text-amber-600"
          label={t("member_status_expiring")}
          value={String(summary.expiring)}
          loading={isLoading}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClass="bg-destructive/15 text-destructive"
          label={t("member_status_expired")}
          value={String(summary.expired)}
          loading={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card/40 p-2 shadow-sm">
        <div role="tablist" aria-label={t("members_income")} className="flex gap-1">
          {tabButton("ledger", t("ledger"), ledgerRows.length)}
          {tabButton("members", t("member_register"), beforeStatus.length)}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <GroupFilter subscriptions={groups} value={group} onChange={setGroup} />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("search")}
              placeholder={t("search_member_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-8"
            />
          </div>
        </div>
      </div>

      {tab === "ledger" ? (
        <LedgerTable
          rows={ledgerRows}
          mainCurrency={mainCurrency}
          onOpenMember={(row) =>
            setPaying({ memberId: row.payment.member, subscriptionId: row.payment.subscription })
          }
          onOpenSlip={(payment) => void openSlip(payment)}
        />
      ) : (
        <MemberRegister
          rows={registerRows}
          status={status}
          counts={statusCounts}
          mainCurrency={mainCurrency}
          onStatusChange={setStatus}
          onRecordPayment={(row) =>
            setPaying({ memberId: row.member.id, subscriptionId: row.member.subscription })
          }
        />
      )}

      {payingSub && payingMember ? (
        <MemberPaymentDialog
          sub={payingSub}
          member={payingMember}
          userId={userId}
          payments={payments.filter((payment) => payment.member === payingMember.id)}
          onClose={() => setPaying(null)}
        />
      ) : null}
    </div>
  );
}
