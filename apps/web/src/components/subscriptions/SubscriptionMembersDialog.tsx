import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Edit, Mail, Plus, Trash2, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemberCurrency } from "@/hooks/useMemberCurrency";
import { MEMBER_PERIODS, memberPeriodSuffix } from "@/lib/memberBilling";
import { memberExpiryStatus } from "@/lib/memberExpiry";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { formatDate, formatPrice } from "@/lib/utils";
import { memberPaymentsService } from "@/services/memberPayments";
import {
  type SubscriptionMemberInput,
  subscriptionMembersService,
} from "@/services/subscriptionMembers";
import { subscriptionsService } from "@/services/subscriptions";
import type { MemberPayment, Subscription, SubscriptionMember } from "@/types";

import { MemberExpiryBadge } from "./MemberExpiryBadge";
import { MemberPaymentDialog } from "./MemberPaymentDialog";

export { MemberExpiryBadge };

/** "" (not set), one of MEMBER_PERIODS, or "custom" with customMonths. */
type PeriodChoice = "" | "1" | "6" | "12" | "custom";

interface MemberFormState {
  name: string;
  email: string;
  amount: string;
  period: PeriodChoice;
  customMonths: string;
  expires_at: string;
  notes: string;
}

const EMPTY_FORM: MemberFormState = {
  name: "",
  email: "",
  amount: "",
  period: "",
  customMonths: "",
  expires_at: "",
  notes: "",
};

function toFormState(member: SubscriptionMember): MemberFormState {
  const months = member.renewal_months ?? 0;
  const preset = (MEMBER_PERIODS as readonly number[]).includes(months);
  return {
    name: member.name,
    email: member.email ?? "",
    amount: member.amount ? String(member.amount) : "",
    period: months <= 0 ? "" : preset ? (String(months) as PeriodChoice) : "custom",
    customMonths: months > 0 && !preset ? String(months) : "",
    expires_at: (member.expires_at ?? "").slice(0, 10),
    notes: member.notes ?? "",
  };
}

function toInput(form: MemberFormState): SubscriptionMemberInput {
  const months =
    form.period === "custom" ? Math.max(0, Math.floor(Number(form.customMonths) || 0)) : Number(form.period);
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    amount: form.amount === "" ? 0 : Number(form.amount),
    renewal_months: months,
    expires_at: form.expires_at,
    notes: form.notes.trim(),
  };
}

/** Members with an expiry date first (soonest on top), undated ones last. */
function sortMembers(members: SubscriptionMember[]): SubscriptionMember[] {
  // Undated members get a date past any real one, so they sort last.
  const key = (member: SubscriptionMember) =>
    (member.expires_at ?? "").slice(0, 10) || "9999-12-31";
  return [...members].sort(
    (a, b) => key(a).localeCompare(key(b)) || a.name.localeCompare(b.name),
  );
}

function MemberForm({
  initial,
  symbol,
  saving,
  onSubmit,
  onCancel,
}: {
  initial: MemberFormState;
  /** Symbol of the member currency, shown next to the amount. */
  symbol: string;
  saving: boolean;
  onSubmit: (form: MemberFormState) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initial);

  const set = (field: keyof MemberFormState) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      aria-label={t("member_form")}
      className="space-y-3 rounded-2xl border bg-muted/30 p-4"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="member-name">{t("name")} *</Label>
          <Input
            id="member-name"
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-email">{t("email")}</Label>
          <Input
            id="member-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-period">{t("member_billing_period")}</Label>
          <div className="flex gap-2">
            <select
              id="member-period"
              value={form.period}
              onChange={(e) => set("period")(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">—</option>
              <option value="1">{t("period_1_month")}</option>
              <option value="6">{t("period_6_months")}</option>
              <option value="12">{t("period_1_year")}</option>
              <option value="custom">{t("period_custom")}</option>
            </select>
            {form.period === "custom" && (
              <Input
                aria-label={t("months")}
                type="number"
                min="1"
                step="1"
                className="w-20"
                value={form.customMonths}
                onChange={(e) => set("customMonths")(e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-amount">
            {t("amount_per_period")} ({symbol})
          </Label>
          <Input
            id="member-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="member-expires">{t("member_expires_at")}</Label>
          <DateInput id="member-expires" value={form.expires_at} onChange={set("expires_at")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="member-notes">{t("notes")}</Label>
        <Textarea
          id="member-notes"
          rows={2}
          maxLength={1000}
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  );
}

export function SubscriptionMembersDialog({
  sub,
  userId,
  members,
  onClose,
}: {
  sub: Subscription;
  userId: string;
  members: SubscriptionMember[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // null: form hidden, "new": adding, otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { data: payments = [] } = useQuery({
    queryKey: queryKeys.subscriptions.memberPayments(userId, sub.id),
    queryFn: () => memberPaymentsService.listForSubscription(sub.id),
    enabled: !!userId,
  });
  // Newest first from the service, so the first match is the latest payment.
  const paymentsOf = (memberId: string): MemberPayment[] =>
    payments.filter((payment) => payment.member === memberId);
  const payingMember = members.find((member) => member.id === payingId);

  // Members pay in the group's member currency, which can differ from the price's.
  const [memberCurrencyId, setMemberCurrencyId] = useState<string | undefined>(undefined);
  const { currencies, memberCurrency: currency } = useMemberCurrency(sub, userId, memberCurrencyId);
  const symbol = currency?.symbol ?? "$";
  const sorted = sortMembers(members);
  const total = members.reduce((sum, member) => sum + (member.amount ?? 0), 0);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.members(userId) });

  const currencyMutation = useMutation({
    mutationFn: (id: string) => subscriptionsService.update(sub.id, { member_currency: id }),
    onSuccess: (_, id) => {
      setMemberCurrencyId(id);
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all(userId) });
    },
    onError: () => toast.error(t("unknown_error")),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, form }: { id: string | null; form: MemberFormState }) =>
      id
        ? subscriptionMembersService.update(id, toInput(form))
        : subscriptionMembersService.create(userId, sub.id, toInput(form)),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success(t("member_saved"));
    },
    onError: () => toast.error(t("member_save_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionMembersService.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success(t("member_deleted"));
    },
    onError: () => toast.error(t("member_delete_failed")),
  });

  const editingMember = sorted.find((member) => member.id === editing);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden />
            {sub.name}
          </DialogTitle>
          <DialogDescription>{t("members_desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/30 px-3 py-2">
            <div>
              <Label htmlFor="members-currency">{t("members_pay_in")}</Label>
              <p className="text-xs text-muted-foreground">{t("members_pay_in_hint")}</p>
            </div>
            <select
              id="members-currency"
              value={currency?.id ?? ""}
              disabled={currencyMutation.isPending}
              onChange={(e) => currencyMutation.mutate(e.target.value)}
              className="h-9 rounded-lg border bg-background px-2 text-sm"
            >
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>

          {members.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("members_summary", {
                count: members.length,
                total: formatPrice(total, symbol, { currencyCode: currency?.code }),
              })}
            </p>
          )}

          {sorted.length === 0 && editing === null ? (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("no_members")}
            </p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((member) =>
                member.id === editing ? (
                  <li key={member.id}>
                    <MemberForm
                      initial={toFormState(member)}
                      symbol={symbol}
                      saving={saveMutation.isPending}
                      onSubmit={(form) => saveMutation.mutate({ id: member.id, form })}
                      onCancel={() => setEditing(null)}
                    />
                  </li>
                ) : (
                  <li
                    key={member.id}
                    className="flex flex-col gap-2 rounded-xl border bg-background/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{member.name}</p>
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"
                        >
                          <Mail className="h-3 w-3 shrink-0" aria-hidden />
                          {member.email}
                        </a>
                      )}
                      {member.notes && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {member.notes}
                        </p>
                      )}
                      {paymentsOf(member.id)[0] && (
                        <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                          {t("member_paid_on", { date: formatDate(paymentsOf(member.id)[0].paid_at) })}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      {(member.amount ?? 0) > 0 && (
                        <span className="font-mono text-sm font-bold">
                          {formatPrice(member.amount!, symbol, {
                            currencyCode: currency?.code,
                          })}
                          {memberPeriodSuffix(t, member.renewal_months) && (
                            <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">
                              {memberPeriodSuffix(t, member.renewal_months)}
                            </span>
                          )}
                        </span>
                      )}
                      {member.expires_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(member.expires_at.slice(0, 10))}
                        </span>
                      )}
                      <MemberExpiryBadge expiry={memberExpiryStatus(member.expires_at)} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
                        onClick={() => setPayingId(member.id)}
                        title={t("record_payment")}
                        aria-label={t("record_payment")}
                      >
                        <Banknote className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => setEditing(member.id)}
                        title={t("edit")}
                        aria-label={t("edit")}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteId(member.id)}
                        title={t("delete")}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}

          {editing === "new" ? (
            <MemberForm
              initial={EMPTY_FORM}
              symbol={symbol}
              saving={saveMutation.isPending}
              onSubmit={(form) => saveMutation.mutate({ id: null, form })}
              onCancel={() => setEditing(null)}
            />
          ) : (
            !editingMember && (
              <Button variant="outline" className="w-full" onClick={() => setEditing("new")}>
                <Plus className="mr-1.5 h-4 w-4" />
                {t("add_member")}
              </Button>
            )
          )}
        </div>

        {payingMember && (
          <MemberPaymentDialog
            sub={sub}
            member={payingMember}
            userId={userId}
            payments={paymentsOf(payingMember.id)}
            currency={currency}
            onClose={() => setPayingId(null)}
          />
        )}

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(nextOpen) => !nextOpen && setDeleteId(null)}
          title={t("delete_member")}
          description={t("confirm_delete_member")}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        />
      </DialogContent>
    </Dialog>
  );
}
