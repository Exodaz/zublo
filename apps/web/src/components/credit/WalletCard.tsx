import { Bell, BellOff, History, Pencil, PiggyBank, Plus, Scale, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ServiceIcon } from "@/components/subscriptions/SubscriptionsServiceTabs";
import { Button } from "@/components/ui/button";
import { type WalletForecast, walletUrgency } from "@/lib/creditForecast";
import { serviceKeyOf } from "@/lib/serviceGroups";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { CreditEntry, CreditWallet, Currency, Subscription } from "@/types";

const BALANCE_COLOR = {
  danger: "text-destructive",
  warning: "text-amber-600 dark:text-amber-400",
  ok: "text-emerald-600 dark:text-emerald-400",
  empty: "text-muted-foreground",
};

/** One wallet: estimated balance, when it runs out, upcoming charges and history. */
export function WalletCard({
  wallet,
  forecast,
  currency,
  linked,
  entries,
  onTopUp,
  onSetBalance,
  onEdit,
  onDelete,
  onDeleteEntry,
}: {
  wallet: CreditWallet;
  forecast: WalletForecast;
  currency?: Currency;
  /** Subscriptions billed to the wallet's account. */
  linked: Subscription[];
  /** This wallet's entries, newest first. */
  entries: CreditEntry[];
  onTopUp: () => void;
  onSetBalance: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteEntry: (entry: CreditEntry) => void;
}) {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const money = (value: number) =>
    formatPrice(value, currency?.symbol ?? "", { currencyCode: currency?.code });
  const urgency = walletUrgency(forecast);

  let status: string;
  if (!forecast.hasEntries) status = t("credit_needs_entry");
  else if (forecast.runOutDate === null) status = t("enough_for_horizon");
  else {
    const date = formatDate(forecast.runOutDate);
    // Always set alongside runOutDate.
    const days = forecast.daysLeft as number;
    status = [
      days < 0 ? t("ran_out_on", { date }) : t("runs_out_on", { date }),
      days === 0 ? t("today") : days < 0 ? t("credit_days_ago", { count: -days }) : t("in_days", { count: days }),
      t("short_by", { amount: money(forecast.shortfall) }),
    ].join(" · ");
  }

  return (
    <section
      aria-label={wallet.name}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm",
        urgency === "danger" && "border-destructive/50",
        urgency === "warning" && "border-amber-500/50",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <PiggyBank className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{wallet.name}</span>
            {wallet.alerts ? (
              <Bell className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label={t("credit_alerts")} />
            ) : (
              <BellOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
            )}
          </h2>
          <p className="truncate text-xs text-muted-foreground">{wallet.account}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("edit_wallet")} title={t("edit_wallet")} onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label={t("delete_wallet")}
            title={t("delete_wallet")}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("estimated_balance")}</p>
        <p className={cn("text-3xl font-bold tabular-nums", BALANCE_COLOR[urgency])}>{money(forecast.balance)}</p>
        <p className={cn("mt-1 text-sm", urgency === "danger" || urgency === "warning" ? BALANCE_COLOR[urgency] : "text-muted-foreground")}>
          {status}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{t("monthly_burn")}</dt>
          <dd className="font-medium tabular-nums">{money(forecast.monthlyBurn)}</dd>
        </div>
        <div className="rounded-xl bg-muted/40 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{t("last_topup")}</dt>
          <dd className="font-medium tabular-nums">
            {forecast.lastTopup ? `${money(forecast.lastTopup.amount)} · ${formatDate(forecast.lastTopup.date)}` : "—"}
          </dd>
        </div>
      </dl>

      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("next_charges")}</h3>
        {forecast.nextCharges.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_upcoming_charges")}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {forecast.nextCharges.slice(0, 3).map((charge) => (
              <li
                key={`${charge.date}-${charge.subscriptionId}`}
                className={cn("flex items-baseline justify-between gap-2", charge.balanceAfter < 0 && "text-destructive")}
              >
                <span className="min-w-0 truncate">
                  <span className="tabular-nums">{formatDate(charge.date)}</span> · {charge.name}
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  {money(charge.amount)}
                  <span className="block text-xs text-muted-foreground">
                    {t("balance_after", { amount: money(charge.balanceAfter) })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("linked_subscriptions")}</h3>
        {linked.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("no_linked_subscriptions")}</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {linked.map((sub) => (
              <li
                key={sub.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs",
                  sub.inactive && "opacity-50",
                )}
              >
                <ServiceIcon serviceKey={serviceKeyOf(sub)} className="h-4 w-4" />
                {sub.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" onClick={onTopUp}>
          <Plus className="mr-1 h-4 w-4" />
          {t("top_up")}
        </Button>
        <Button size="sm" variant="outline" onClick={onSetBalance}>
          <Scale className="mr-1 h-4 w-4" />
          {t("set_balance")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-expanded={showHistory}
          onClick={() => setShowHistory((open) => !open)}
        >
          <History className="mr-1 h-4 w-4" />
          {t("credit_history")} <span className="ml-1 text-xs opacity-70">{entries.length}</span>
        </Button>
      </div>

      {showHistory && (
        <div className="border-t pt-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("no_credit_entries")}</p>
          ) : (
            <ul className="space-y-1.5" aria-label={t("credit_history")}>
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p>
                      <span className="tabular-nums">{formatDate(entry.date)}</span> ·{" "}
                      {entry.type === "topup" ? t("entry_topup") : t("entry_balance")} ·{" "}
                      <span className="font-medium tabular-nums">
                        {entry.type === "topup" ? "+" : "="}
                        {money(entry.amount)}
                      </span>
                    </p>
                    {entry.notes && <p className="truncate text-xs text-muted-foreground">{entry.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={t("delete_entry")}
                    title={t("delete_entry")}
                    onClick={() => onDeleteEntry(entry)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
