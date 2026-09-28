import { AlertTriangle, Banknote, Clock, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatCard } from "@/components/calendar/StatCard";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface CalendarOverviewProps {
  count: number;
  total: number;
  due: number;
  loading: boolean;
  budget: number;
  overBudget: boolean;
  mainCurrency?: Currency;
  /** Family-sharing expiries this month; the row is hidden when absent. */
  memberStats?: {
    count: number;
    total: number;
    upcomingCount: number;
    upcomingTotal: number;
  };
}

export function CalendarOverview({
  count,
  total,
  due,
  loading,
  budget,
  overBudget,
  mainCurrency,
  memberStats,
}: CalendarOverviewProps) {
  const { t } = useTranslation();
  const currencySymbol = mainCurrency?.symbol ?? "$";
  const priceOptions = { currencyCode: mainCurrency?.code };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<RefreshCw className="h-5 w-5" />}
          iconClass="bg-primary/20 text-primary"
          label={t("subscriptions")}
          value={String(count)}
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          iconClass="bg-blue-500/20 text-blue-500"
          label={t("total")}
          value={formatPrice(total, currencySymbol, priceOptions)}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          iconClass="bg-amber-500/20 text-amber-500"
          label={t("due")}
          value={formatPrice(due, currencySymbol, priceOptions)}
          loading={loading}
        />
      </div>

      {memberStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            iconClass="bg-sky-500/20 text-sky-600 dark:text-sky-400"
            label={t("members_expiring_month")}
            value={t("members_count", { count: memberStats.count })}
            hint={t("members_upcoming_hint", { count: memberStats.upcomingCount })}
            loading={loading}
          />
          <StatCard
            icon={<Banknote className="h-5 w-5" />}
            iconClass="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            label={t("renewal_amount_month")}
            value={formatPrice(memberStats.total, currencySymbol, priceOptions)}
            hint={t("renewal_upcoming_hint", {
              amount: formatPrice(memberStats.upcomingTotal, currencySymbol, priceOptions),
            })}
            loading={loading}
          />
        </div>
      ) : null}

      {overBudget ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {t("over_budget_warning")}{" "}
            <strong>{formatPrice(total - budget, currencySymbol, priceOptions)}</strong>
          </span>
        </div>
      ) : null}
    </>
  );
}
