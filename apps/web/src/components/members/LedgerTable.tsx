import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ServiceIcon } from "@/components/subscriptions/SubscriptionsServiceTabs";
import { memberCurrencyOf } from "@/lib/memberBilling";
import type { LedgerRow } from "@/lib/memberLedger";
import { serviceKeyOf } from "@/lib/serviceGroups";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Currency, MemberPayment } from "@/types";

function periodText(t: (key: string, options?: Record<string, unknown>) => string, months: number) {
  if (months === 12) return t("period_1_year");
  if (months === 1) return t("period_1_month");
  if (months > 0) return t("months_count", { count: months });
  return t("custom_date");
}

/** Member payments of the period: one line each, with a total in the main currency. */
export function LedgerTable({
  rows,
  mainCurrency,
  onOpenMember,
  onOpenSlip,
}: {
  rows: LedgerRow[];
  mainCurrency?: Currency;
  onOpenMember: (row: LedgerRow) => void;
  onOpenSlip: (payment: MemberPayment) => void;
}) {
  const { t } = useTranslation();
  const mainSymbol = mainCurrency?.symbol ?? "$";
  const total = rows.reduce((sum, row) => sum + row.amountMain, 0);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t("ledger_empty")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card/40">
      <div className="hidden grid-cols-[6rem_1.6fr_1.2fr_7rem_7rem_6rem_4rem] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        <span>{t("payment_date")}</span>
        <span>{t("member")}</span>
        <span>{t("group")}</span>
        <span>{t("renewal_period")}</span>
        <span className="text-right">{t("amount")}</span>
        <span>{t("new_expiry_date")}</span>
        <span>{t("slip")}</span>
      </div>
      <ul className="divide-y">
        {rows.map((row) => {
          const { payment, member, sub } = row;
          const currency = memberCurrencyOf(sub, mainCurrency);
          return (
            <li
              key={payment.id}
              className="grid grid-cols-2 gap-x-3 gap-y-1 px-4 py-3 text-sm md:grid-cols-[6rem_1.6fr_1.2fr_7rem_7rem_6rem_4rem] md:items-center"
            >
              <span className="text-muted-foreground md:text-foreground">{formatDate(payment.paid_at)}</span>
              <button
                type="button"
                onClick={() => onOpenMember(row)}
                className="col-span-2 min-w-0 text-left md:col-span-1"
                title={t("record_payment")}
              >
                <span className="block truncate font-medium hover:text-primary hover:underline">
                  {member?.name ?? t("deleted_member")}
                </span>
                {member?.email && member.email !== member.name && (
                  <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                )}
              </button>
              <span className="flex min-w-0 items-center gap-1.5">
                {sub && <ServiceIcon serviceKey={serviceKeyOf(sub)} className="h-4 w-4" />}
                <span className="truncate">{sub?.name ?? "—"}</span>
              </span>
              <span className="text-muted-foreground">{periodText(t, payment.period_months ?? 0)}</span>
              <span className="font-mono font-semibold md:text-right">
                {formatPrice(payment.amount ?? 0, currency?.symbol ?? "$", {
                  currencyCode: currency?.code,
                })}
              </span>
              <span>{formatDate(payment.expires_after)}</span>
              <span>
                {payment.slip ? (
                  <button
                    type="button"
                    onClick={() => onOpenSlip(payment)}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" aria-hidden />
                    {t("view_slip")}
                  </button>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-sm font-semibold">
        <span>{t("ledger_count", { count: rows.length })}</span>
        <span className="font-mono">
          {formatPrice(total, mainSymbol, { currencyCode: mainCurrency?.code })}
        </span>
      </div>
    </div>
  );
}
