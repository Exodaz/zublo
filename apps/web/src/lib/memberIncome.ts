/**
 * Income from family-sharing members for the dashboard: what active members
 * are expected to pay per month, and what was actually received this month.
 * Amounts are converted from each group's member currency to the main one.
 */
import { memberExpiryStatus } from "@/lib/memberExpiry";
import { toDay } from "@/lib/memberRenewal";
import { toMainCurrency } from "@/lib/utils";
import type { MemberPayment, Subscription, SubscriptionMember } from "@/types";

const CYCLE_MONTHS: Record<string, number> = { Monthly: 1, Quarterly: 3, "Half-Yearly": 6, Yearly: 12 };

/** Months a member's amount covers: their own period, else the group's billing cycle, else a year. */
export function memberPeriodMonths(member: SubscriptionMember, sub: Subscription): number {
  if ((member.renewal_months ?? 0) > 0) return member.renewal_months!;
  const months = CYCLE_MONTHS[sub.expand?.cycle?.name ?? ""];
  return months ? months * Math.max(1, sub.frequency || 1) : 12;
}

export interface MemberIncomeSummary {
  /** Monthly equivalent of what active (not expired) members pay. */
  expectedMonthly: number;
  /** Members counted in expectedMonthly. */
  payingMembers: number;
  /** Payments recorded with a paid date in the current month. */
  receivedThisMonth: number;
  receivedCount: number;
}

export function memberIncomeSummary({
  members,
  payments,
  subscriptions,
  today,
}: {
  members: SubscriptionMember[];
  payments: MemberPayment[];
  subscriptions: Subscription[];
  /** YYYY-MM-DD */
  today: string;
}): MemberIncomeSummary {
  const subsById = new Map(subscriptions.map((sub) => [sub.id, sub]));
  let expectedMonthly = 0;
  let payingMembers = 0;
  for (const member of members) {
    const sub = subsById.get(member.subscription);
    if (!sub || sub.inactive || !((member.amount ?? 0) > 0)) continue;
    if (memberExpiryStatus(member.expires_at, today).status === "expired") continue;
    const monthly = member.amount! / memberPeriodMonths(member, sub);
    expectedMonthly += toMainCurrency(monthly, sub.expand?.member_currency);
    payingMembers += 1;
  }

  const month = today.slice(0, 7);
  let receivedThisMonth = 0;
  let receivedCount = 0;
  for (const payment of payments) {
    if (toDay(payment.paid_at).slice(0, 7) !== month) continue;
    const sub = subsById.get(payment.subscription);
    receivedThisMonth += toMainCurrency(payment.amount ?? 0, sub?.expand?.member_currency);
    receivedCount += 1;
  }

  return { expectedMonthly, payingMembers, receivedThisMonth, receivedCount };
}
