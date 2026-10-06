import type { Currency, MemberPayment, Subscription, SubscriptionMember } from "@/types";

import { memberIncomeSummary, memberPeriodMonths } from "./memberIncome";

const usd = { id: "usd", code: "USD", symbol: "$", rate: 0.03, is_main: false } as Currency;
const sub = (o: Partial<Subscription> & { id: string }) =>
  ({ name: o.id, price: 0, frequency: 1, inactive: false, ...o }) as Subscription;
const member = (o: Partial<SubscriptionMember> & { id: string }) =>
  ({ subscription: "ms", user: "u", name: o.id, ...o }) as SubscriptionMember;
const pay = (o: Partial<MemberPayment> & { id: string }) =>
  ({ member: "a", subscription: "ms", user: "u", expires_after: "2027-01-01", ...o }) as MemberPayment;

describe("memberIncome", () => {
  it("uses the member's period, else the group's cycle, else a year", () => {
    const yearly = sub({ id: "y", expand: { cycle: { id: "c", name: "Yearly" } } });
    const twoMonths = sub({ id: "m", frequency: 2, expand: { cycle: { id: "c", name: "Monthly" } } });
    expect(memberPeriodMonths(member({ id: "a", renewal_months: 6 }), yearly)).toBe(6);
    expect(memberPeriodMonths(member({ id: "a" }), yearly)).toBe(12);
    expect(memberPeriodMonths(member({ id: "a" }), twoMonths)).toBe(2);
    expect(memberPeriodMonths(member({ id: "a" }), sub({ id: "x", frequency: 0, expand: { cycle: { id: "c", name: "Monthly" } } }))).toBe(1);
    expect(memberPeriodMonths(member({ id: "a" }), sub({ id: "x" }))).toBe(12);
  });

  it("sums expected monthly income of active members and this month's payments", () => {
    const subscriptions = [
      // Billed in TRY, members pay in the main currency (THB).
      sub({ id: "ms", expand: { cycle: { id: "c", name: "Yearly" } } }),
      sub({ id: "us", expand: { member_currency: usd } }),
      sub({ id: "off", inactive: true }),
    ];
    const members = [
      member({ id: "a", amount: 400 }), // 400 / 12
      member({ id: "b", amount: 80, renewal_months: 1 }),
      member({ id: "c", amount: 450, renewal_months: 6, expires_at: "2026-12-01" }),
      member({ id: "d", amount: 400, expires_at: "2026-09-01" }), // expired
      member({ id: "e" }), // no amount
      member({ id: "f", amount: 3, renewal_months: 1, subscription: "us" }), // $3 → ฿100
      member({ id: "g", amount: 100, subscription: "off" }),
      member({ id: "h", amount: 100, subscription: "gone" }),
    ];
    const payments = [
      pay({ id: "p1", paid_at: "2026-10-02 00:00:00.000Z", amount: 400 }),
      pay({ id: "p2", paid_at: "2026-10-05", amount: 3, subscription: "us" }),
      pay({ id: "p3", paid_at: "2026-10-06", subscription: "gone" }),
      pay({ id: "p4", paid_at: "2026-09-30", amount: 999 }),
    ];
    const result = memberIncomeSummary({ members, payments, subscriptions, today: "2026-10-06" });
    expect(result.expectedMonthly).toBeCloseTo(400 / 12 + 80 + 75 + 100);
    expect(result.payingMembers).toBe(4);
    expect(result.receivedThisMonth).toBeCloseTo(500);
    expect(result.receivedCount).toBe(3);
  });
});
