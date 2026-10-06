import { Banknote } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MemberExpiryBadge } from "@/components/subscriptions/MemberExpiryBadge";
import { ServiceIcon } from "@/components/subscriptions/SubscriptionsServiceTabs";
import { Button } from "@/components/ui/button";
import { memberCurrencyOf, memberPeriodSuffix } from "@/lib/memberBilling";
import type { MemberRow, StatusFilter } from "@/lib/memberLedger";
import { serviceKeyOf } from "@/lib/serviceGroups";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

const STATUS_FILTERS: StatusFilter[] = ["all", "expired", "expiring", "active", "none"];

/** Every member of every group, most urgent first, with a record-payment shortcut. */
export function MemberRegister({
  rows,
  status,
  counts,
  mainCurrency,
  onStatusChange,
  onRecordPayment,
}: {
  rows: MemberRow[];
  status: StatusFilter;
  /** Number of members per status filter, before filtering by status. */
  counts: Record<StatusFilter, number>;
  mainCurrency?: Currency;
  onStatusChange: (status: StatusFilter) => void;
  onRecordPayment: (row: MemberRow) => void;
}) {
  const { t } = useTranslation();
  const mainSymbol = mainCurrency?.symbol ?? "$";
  // Only called for members with an amount.
  const memberPlan = (row: MemberRow) => {
    const currency = memberCurrencyOf(row.sub, mainCurrency);
    const price = formatPrice(row.member.amount!, currency?.symbol ?? "$", { currencyCode: currency?.code });
    return [price, memberPeriodSuffix(t, row.member.renewal_months)].filter(Boolean).join(" ");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("status")}>
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => onStatusChange(value)}
            className={cn(
              "rounded-xl border px-3 py-1 text-sm font-medium transition-colors",
              status === value
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background/50 text-muted-foreground hover:bg-accent",
            )}
          >
            {t(`member_status_${value}`)} <span className="text-xs opacity-70">{counts[value]}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("register_empty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card/40">
          <div className="hidden grid-cols-[1.6fr_1.2fr_6rem_8rem_6rem_7rem_2.5rem] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>{t("member")}</span>
            <span>{t("group")}</span>
            <span>{t("expires_on_short")}</span>
            <span>{t("status")}</span>
            <span>{t("last_paid")}</span>
            <span className="text-right">{t("total_paid")}</span>
            <span />
          </div>
          <ul className="divide-y">
            {rows.map((row) => (
              <li
                key={row.member.id}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 text-sm md:grid-cols-[1.6fr_1.2fr_6rem_8rem_6rem_7rem_2.5rem] md:items-center"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.member.name}</span>
                  {row.member.email && row.member.email !== row.member.name && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {row.member.email}
                    </span>
                  )}
                  {(row.member.amount ?? 0) > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {memberPlan(row)}
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 md:order-none">
                  {row.sub && <ServiceIcon serviceKey={serviceKeyOf(row.sub)} className="h-4 w-4" />}
                  <span className="truncate">{row.sub?.name ?? "—"}</span>
                </span>
                <span>{row.member.expires_at ? formatDate(row.member.expires_at) : "—"}</span>
                <span>
                  <MemberExpiryBadge expiry={{ status: row.status, daysLeft: row.daysLeft }} />
                </span>
                <span className="text-muted-foreground">
                  {row.lastPaid ? formatDate(row.lastPaid) : "—"}
                </span>
                <span className="font-mono md:text-right">
                  {formatPrice(row.totalPaidMain, mainSymbol, { currencyCode: mainCurrency?.code })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
                  title={t("record_payment")}
                  aria-label={`${t("record_payment")}: ${row.member.name}`}
                  onClick={() => onRecordPayment(row)}
                >
                  <Banknote className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
