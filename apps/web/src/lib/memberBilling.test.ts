import type { TFunction } from "i18next";

import type { Currency, Subscription } from "@/types";

import { MEMBER_PERIODS, memberCurrencyOf, memberPeriodSuffix } from "./memberBilling";

const thb = { id: "thb", code: "THB", symbol: "฿" } as Currency;
const try_ = { id: "try", code: "TRY", symbol: "₺" } as Currency;
const t = ((key: string, options?: { count?: number }) =>
  options ? `${key}:${options.count}` : key) as unknown as TFunction;

describe("memberBilling", () => {
  it("uses the group's member currency, else the main currency", () => {
    expect(memberCurrencyOf({ expand: { member_currency: try_ } } as Subscription, thb)).toBe(try_);
    expect(memberCurrencyOf({ expand: {} } as Subscription, thb)).toBe(thb);
    expect(memberCurrencyOf(undefined, thb)).toBe(thb);
    expect(memberCurrencyOf(undefined, undefined)).toBeUndefined();
  });

  it("describes the billing period", () => {
    expect(MEMBER_PERIODS).toEqual([1, 6, 12]);
    expect(memberPeriodSuffix(t, 1)).toBe("per_month_suffix");
    expect(memberPeriodSuffix(t, 12)).toBe("per_year_suffix");
    expect(memberPeriodSuffix(t, 6)).toBe("per_months_suffix:6");
    expect(memberPeriodSuffix(t, 0)).toBe("");
    expect(memberPeriodSuffix(t, undefined)).toBe("");
  });
});
