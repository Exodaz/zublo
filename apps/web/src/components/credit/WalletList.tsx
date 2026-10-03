import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { WalletCard } from "@/components/credit/WalletCard";
import { Button } from "@/components/ui/button";
import { type WalletForecast, walletUrgency } from "@/lib/creditForecast";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { CreditEntry, CreditWallet, Currency, Subscription } from "@/types";

export interface WalletRow {
  wallet: CreditWallet;
  forecast: WalletForecast;
  currency?: Currency;
  linked: Subscription[];
  entries: CreditEntry[];
}

const URGENCY_TEXT = {
  danger: "text-destructive",
  warning: "text-amber-600 dark:text-amber-400",
  ok: "text-emerald-600 dark:text-emerald-400",
  empty: "text-muted-foreground",
};

const COLUMNS = "sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto]";

/** One row per wallet; a row expands into the full wallet card. */
export function WalletList({
  rows,
  onTopUp,
  onSetBalance,
  onEdit,
  onDelete,
  onDeleteEntry,
}: {
  rows: WalletRow[];
  onTopUp: (wallet: CreditWallet) => void;
  onSetBalance: (wallet: CreditWallet) => void;
  onEdit: (wallet: CreditWallet) => void;
  onDelete: (wallet: CreditWallet) => void;
  onDeleteEntry: (entry: CreditEntry) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const runOutText = ({ forecast }: WalletRow) => {
    if (!forecast.hasEntries) return t("no_topup_yet");
    if (forecast.runOutDate === null) return t("lasts_2_years");
    const days = forecast.daysLeft as number;
    const when = days === 0 ? t("today") : days < 0 ? t("credit_days_ago", { count: -days }) : t("in_days", { count: days });
    return `${formatDate(forecast.runOutDate)} (${when})`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        aria-hidden
        className={cn(
          "hidden gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid",
          COLUMNS,
        )}
      >
        <span>{t("wallet_account")}</span>
        <span className="text-right">{t("estimated_balance")}</span>
        <span>{t("runs_out")}</span>
        <span className="text-right">{t("monthly_burn")}</span>
        <span className="w-24" />
      </div>
      <ul className="divide-y">
        {rows.map((row) => {
          const { wallet, forecast, currency } = row;
          const open = expanded === wallet.id;
          const urgency = walletUrgency(forecast);
          const money = (value: number) => formatPrice(value, currency?.symbol ?? "", { currencyCode: currency?.code });
          return (
            <li key={wallet.id}>
              <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3", COLUMNS)}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={`${t("wallet_details")}: ${wallet.name}`}
                  onClick={() => setExpanded(open ? null : wallet.id)}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{wallet.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{wallet.account}</span>
                  </span>
                </button>
                <span className={cn("text-right font-semibold tabular-nums", URGENCY_TEXT[urgency])}>
                  {money(forecast.balance)}
                </span>
                <span
                  className={cn(
                    "col-span-2 pl-6 text-sm tabular-nums sm:col-span-1 sm:pl-0",
                    urgency === "danger" || urgency === "warning" ? URGENCY_TEXT[urgency] : "text-muted-foreground",
                  )}
                >
                  {runOutText(row)}
                </span>
                <span className="hidden text-right text-sm tabular-nums sm:block">{money(forecast.monthlyBurn)}</span>
                <Button size="sm" variant="outline" className="hidden w-24 sm:inline-flex" onClick={() => onTopUp(wallet)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("top_up")}
                </Button>
              </div>
              {open && (
                <div className="border-t bg-muted/20 p-3">
                  <WalletCard
                    {...row}
                    onTopUp={() => onTopUp(wallet)}
                    onSetBalance={() => onSetBalance(wallet)}
                    onEdit={() => onEdit(wallet)}
                    onDelete={() => onDelete(wallet)}
                    onDeleteEntry={onDeleteEntry}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
