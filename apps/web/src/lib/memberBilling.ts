/**
 * How family-sharing members are billed: the currency they pay in (set per
 * group, falling back to the main currency) and their billing period.
 */
import type { TFunction } from "i18next";

import type { Currency, Subscription } from "@/types";

/** Currency members of `sub` pay in; the main currency when the group sets none. */
export function memberCurrencyOf(
  sub: Pick<Subscription, "expand"> | undefined,
  mainCurrency: Currency | undefined,
): Currency | undefined {
  return sub?.expand?.member_currency ?? mainCurrency;
}

/** Period choices offered for members, in months. */
export const MEMBER_PERIODS = [1, 6, 12] as const;

/** "/ month", "/ 6 months", "/ year", or "" when no period is set. */
export function memberPeriodSuffix(t: TFunction, months: number | undefined): string {
  if (!months || months <= 0) return "";
  if (months === 1) return t("per_month_suffix");
  if (months === 12) return t("per_year_suffix");
  return t("per_months_suffix", { count: months });
}
