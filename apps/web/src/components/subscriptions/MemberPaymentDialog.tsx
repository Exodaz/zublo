import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Banknote, FileText, Paperclip, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { MemberExpiryBadge } from "@/components/subscriptions/MemberExpiryBadge";
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
import { toIsoDate } from "@/lib/dateInput";
import { MEMBER_PERIODS } from "@/lib/memberBilling";
import { memberExpiryStatus } from "@/lib/memberExpiry";
import { computeExpiry } from "@/lib/memberRenewal";
import { hasSlip, isValidSlipLink } from "@/lib/memberSlip";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { memberPaymentsService } from "@/services/memberPayments";
import type { Currency, MemberPayment, Subscription, SubscriptionMember } from "@/types";

type PeriodChoice = "1" | "6" | "12" | "custom";

function initialPeriod(member: SubscriptionMember): { choice: PeriodChoice; custom: string } {
  const months = member.renewal_months ?? 0;
  if ((MEMBER_PERIODS as readonly number[]).includes(months)) {
    return { choice: String(months) as PeriodChoice, custom: "" };
  }
  if (months > 0) return { choice: "custom", custom: String(months) };
  return { choice: "12", custom: "" };
}

function PeriodLabel({ months }: { months: number }) {
  const { t } = useTranslation();
  if (months === 12) return <>{t("period_1_year")}</>;
  if (months === 1) return <>{t("period_1_month")}</>;
  if (months > 0) return <>{t("months_count", { count: months })}</>;
  return <>{t("custom_date")}</>;
}

/**
 * Records a member's payment (amount, date, period, optional slip) and the
 * expiry it extends them to, and lists their payment history.
 */
export function MemberPaymentDialog({
  sub,
  member,
  userId,
  payments,
  currency: currencyOverride,
  onClose,
}: {
  sub: Subscription;
  member: SubscriptionMember;
  userId: string;
  /** This member's payments, newest first. */
  payments: MemberPayment[];
  /** Member currency when the caller already knows it (e.g. just changed). */
  currency?: Currency;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { memberCurrency } = useMemberCurrency(sub, userId);
  const currency = currencyOverride ?? memberCurrency;
  const symbol = currency?.symbol ?? "$";

  const defaults = initialPeriod(member);
  const [paidAt, setPaidAt] = useState(() => toIsoDate(new Date()));
  const [amount, setAmount] = useState(() => {
    const fallback = member.amount || payments[0]?.amount;
    return fallback ? String(fallback) : "";
  });
  const [period, setPeriod] = useState<PeriodChoice>(defaults.choice);
  const [customMonths, setCustomMonths] = useState(defaults.custom);
  // null: follow the computed date; otherwise the date the user picked.
  const [manualExpiry, setManualExpiry] = useState<string | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [slipLink, setSlipLink] = useState("");
  const slipLinkValid = isValidSlipLink(slipLink);
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const months = period === "custom" ? Math.max(0, Math.floor(Number(customMonths) || 0)) : Number(period);
  const computed = computeExpiry(member.expires_at, paidAt, months);
  const expiresAfter = manualExpiry ?? computed;
  const isManual = manualExpiry !== null && manualExpiry !== computed;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.members(userId) });
    // The user-wide key is a prefix of the per-subscription one, so this
    // refreshes both the members dialog and the Members & Income page.
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.allMemberPayments(userId) });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = new FormData();
      data.append("member", member.id);
      data.append("subscription", sub.id);
      data.append("user", userId);
      data.append("paid_at", paidAt);
      if (amount !== "") data.append("amount", String(Number(amount)));
      data.append("period_months", String(isManual ? 0 : months));
      data.append("expires_after", expiresAfter);
      if (slip) data.append("slip", slip);
      if (slipLink.trim()) data.append("slip_url", slipLink.trim());
      if (notes.trim()) data.append("notes", notes.trim());
      return memberPaymentsService.create(data);
    },
    onSuccess: (payment) => {
      invalidate();
      toast.success(t("renewed_until", { date: formatDate(payment.expires_after) }));
      setManualExpiry(null);
      setSlip(null);
      setSlipLink("");
      setNotes("");
    },
    onError: () => toast.error(t("payment_save_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberPaymentsService.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success(t("payment_deleted"));
    },
    onError: () => toast.error(t("payment_delete_failed")),
  });

  const openSlip = async (payment: MemberPayment) => {
    // Open the tab synchronously so popup blockers allow it, then point it at
    // the token-signed URL once that is ready.
    const tab = window.open("", "_blank");
    try {
      const url = await memberPaymentsService.slipUrl(payment);
      if (tab && url) tab.location.href = url;
    } catch {
      tab?.close();
      toast.error(t("slip_open_failed"));
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const periodButton = (value: PeriodChoice, label: string) => (
    <button
      type="button"
      aria-pressed={period === value}
      onClick={() => setPeriod(value)}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
        period === value
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background hover:bg-accent",
      )}
    >
      {label}
    </button>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" aria-hidden />
            {t("record_payment")}
          </DialogTitle>
          <DialogDescription>
            {member.name}
            {member.email && member.email !== member.name ? ` · ${member.email}` : ""} · {sub.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t("current_expiry")}</span>
          <span className="font-medium">
            {member.expires_at ? formatDate(member.expires_at) : "—"}
          </span>
          <MemberExpiryBadge expiry={memberExpiryStatus(member.expires_at)} />
        </div>

        <form aria-label={t("record_payment")} className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">{t("payment_date")}</Label>
              <DateInput
                id="payment-date"
                value={paidAt}
                onChange={(value) => {
                  setPaidAt(value);
                  setManualExpiry(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">
                {t("amount")} ({symbol})
              </Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("renewal_period")}</Label>
            <div className="flex flex-wrap items-center gap-2">
              {periodButton("1", t("period_1_month"))}
              {periodButton("6", t("period_6_months"))}
              {periodButton("12", t("period_1_year"))}
              {periodButton("custom", t("period_custom"))}
              {period === "custom" && (
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={t("months")}
                    type="number"
                    min="1"
                    step="1"
                    className="w-20"
                    value={customMonths}
                    onChange={(e) => {
                      setCustomMonths(e.target.value);
                      setManualExpiry(null);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">{t("months")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="payment-expiry">{t("new_expiry_date")}</Label>
              {isManual && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setManualExpiry(null)}
                >
                  {t("recalculate")}
                </button>
              )}
            </div>
            <DateInput
              id="payment-expiry"
              value={expiresAfter}
              onChange={(value) => setManualExpiry(value)}
            />
            <p className="text-xs text-muted-foreground">
              {isManual ? t("expiry_set_manually") : t("expiry_from_hint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-slip">{t("slip")}</Label>
            <Input
              id="payment-slip"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              onChange={(e) => setSlip(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">{t("slip_hint")}</p>
            <Input
              aria-label={t("slip_link")}
              type="url"
              inputMode="url"
              placeholder={t("slip_link_placeholder")}
              value={slipLink}
              onChange={(e) => setSlipLink(e.target.value)}
              aria-invalid={!slipLinkValid}
            />
            {!slipLinkValid && <p className="text-xs text-destructive">{t("slip_link_invalid")}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-notes">{t("notes")}</Label>
            <Textarea
              id="payment-notes"
              rows={2}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("close")}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || !paidAt || !expiresAfter || !slipLinkValid}>
              {saveMutation.isPending ? t("saving") : t("save_payment")}
            </Button>
          </div>
        </form>

        <section className="space-y-2 border-t pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("payment_history")}
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("no_payments")}</p>
          ) : (
            <ul className="space-y-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-col gap-1 rounded-xl border bg-background/50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatDate(payment.paid_at)}
                      {(payment.amount ?? 0) > 0 &&
                        ` · ${formatPrice(payment.amount!, symbol, { currencyCode: currency?.code })}`}
                      {" · "}
                      <PeriodLabel months={payment.period_months ?? 0} />
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {payment.expires_before ? formatDate(payment.expires_before) : "—"}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                      {formatDate(payment.expires_after)}
                    </p>
                    {payment.notes && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 shrink-0" aria-hidden />
                        {payment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {hasSlip(payment) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void openSlip(payment)}
                      >
                        <Paperclip className="mr-1 h-3.5 w-3.5" />
                        {t("view_slip")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title={t("delete_payment")}
                      aria-label={t("delete_payment")}
                      onClick={() => setDeleteId(payment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(nextOpen) => !nextOpen && setDeleteId(null)}
          title={t("delete_payment")}
          description={t("confirm_delete_payment")}
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        />
      </DialogContent>
    </Dialog>
  );
}
