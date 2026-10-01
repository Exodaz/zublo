/**
 * Pure logic behind the Members & Income page: the reporting period, the
 * income ledger built from member payments, the register of every member,
 * the summary cards and the Excel export rows.
 */
import { isoToDisplay } from "@/lib/dateInput";
import { type MemberExpiryStatus, memberExpiryStatus } from "@/lib/memberExpiry";
import { toDay } from "@/lib/memberRenewal";
import { toMainCurrency } from "@/lib/utils";
import type { MemberPayment, Subscription, SubscriptionMember } from "@/types";

// ── Period ────────────────────────────────────────────────────────────────────

export type PeriodMode = "month" | "year" | "all";

export interface Period {
  mode: PeriodMode;
  year: number;
  /** 1–12; only meaningful in month mode. */
  month: number;
}

export function currentPeriod(today = new Date()): Period {
  return { mode: "month", year: today.getFullYear(), month: today.getMonth() + 1 };
}

/** Moves a month or year period forward/back; "all" has nowhere to go. */
export function stepPeriod(period: Period, delta: number): Period {
  if (period.mode === "year") return { ...period, year: period.year + delta };
  if (period.mode === "month") {
    const index = period.year * 12 + (period.month - 1) + delta;
    return { ...period, year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
  }
  return period;
}

/** Inclusive YYYY-MM-DD bounds, or null for all time. */
export function periodRange(period: Period): { from: string; to: string } | null {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (period.mode === "year") return { from: `${period.year}-01-01`, to: `${period.year}-12-31` };
  if (period.mode === "month") {
    const last = new Date(period.year, period.month, 0).getDate();
    return {
      from: `${period.year}-${pad(period.month)}-01`,
      to: `${period.year}-${pad(period.month)}-${pad(last)}`,
    };
  }
  return null;
}

export function inPeriod(date: string, range: { from: string; to: string } | null): boolean {
  if (!range) return true;
  const day = toDay(date);
  return !!day && day >= range.from && day <= range.to;
}

/** Short file-name friendly label: 2026-10, 2026 or all. */
export function periodSlug(period: Period): string {
  if (period.mode === "month") return `${period.year}-${String(period.month).padStart(2, "0")}`;
  if (period.mode === "year") return String(period.year);
  return "all";
}

// ── Ledger ────────────────────────────────────────────────────────────────────

export interface LedgerRow {
  payment: MemberPayment;
  member?: SubscriptionMember;
  sub?: Subscription;
  /** Payment amount converted to the main currency. */
  amountMain: number;
}

export function buildLedgerRows(
  payments: MemberPayment[],
  subsById: Map<string, Subscription>,
  membersById: Map<string, SubscriptionMember>,
): LedgerRow[] {
  return payments.map((payment) => {
    const sub = subsById.get(payment.subscription);
    return {
      payment,
      member: membersById.get(payment.member),
      sub,
      amountMain: toMainCurrency(payment.amount ?? 0, sub?.expand?.currency),
    };
  });
}

// ── Member register ───────────────────────────────────────────────────────────

export interface MemberRow {
  member: SubscriptionMember;
  sub?: Subscription;
  status: MemberExpiryStatus;
  daysLeft: number | null;
  /** Date of the latest payment, YYYY-MM-DD, or "". */
  lastPaid: string;
  /** All payments ever, in the main currency. */
  totalPaidMain: number;
  paymentCount: number;
}

const URGENCY: Record<MemberExpiryStatus, number> = { expired: 0, expiring: 1, active: 2, none: 3 };

/** Every member with payment totals, most urgent first. */
export function buildMemberRows(
  members: SubscriptionMember[],
  payments: MemberPayment[],
  subsById: Map<string, Subscription>,
  today?: string,
): MemberRow[] {
  const rows = members.map((member): MemberRow => {
    const sub = subsById.get(member.subscription);
    const own = payments.filter((payment) => payment.member === member.id);
    const expiry = memberExpiryStatus(member.expires_at, today);
    return {
      member,
      sub,
      status: expiry.status,
      daysLeft: expiry.daysLeft,
      lastPaid: own.reduce((latest, p) => (toDay(p.paid_at) > latest ? toDay(p.paid_at) : latest), ""),
      totalPaidMain: own.reduce(
        (sum, p) => sum + toMainCurrency(p.amount ?? 0, sub?.expand?.currency),
        0,
      ),
      paymentCount: own.length,
    };
  });
  return rows.sort(
    (a, b) =>
      URGENCY[a.status] - URGENCY[b.status] ||
      (a.daysLeft ?? 0) - (b.daysLeft ?? 0) ||
      a.member.name.localeCompare(b.member.name),
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

export interface LedgerSummary {
  income: number;
  payments: number;
  /** Members who are not expired (including those without an expiry). */
  active: number;
  expiring: number;
  expired: number;
}

export function summarize(ledger: LedgerRow[], members: MemberRow[]): LedgerSummary {
  return {
    income: ledger.reduce((sum, row) => sum + row.amountMain, 0),
    payments: ledger.length,
    active: members.filter((row) => row.status !== "expired").length,
    expiring: members.filter((row) => row.status === "expiring").length,
    expired: members.filter((row) => row.status === "expired").length,
  };
}

// ── Filters ───────────────────────────────────────────────────────────────────

export type StatusFilter = "all" | MemberExpiryStatus;

function matchesSearch(search: string, ...values: Array<string | undefined>): boolean {
  const q = search.trim().toLowerCase();
  return !q || values.some((value) => (value ?? "").toLowerCase().includes(q));
}

export function filterLedger(
  rows: LedgerRow[],
  { subscriptionId, search }: { subscriptionId: string; search: string },
): LedgerRow[] {
  return rows.filter(
    (row) =>
      (!subscriptionId || row.payment.subscription === subscriptionId) &&
      matchesSearch(search, row.member?.name, row.member?.email, row.sub?.name),
  );
}

export function filterMembers(
  rows: MemberRow[],
  { subscriptionId, search, status }: { subscriptionId: string; search: string; status: StatusFilter },
): MemberRow[] {
  return rows.filter(
    (row) =>
      (!subscriptionId || row.member.subscription === subscriptionId) &&
      (status === "all" || row.status === status) &&
      matchesSearch(search, row.member.name, row.member.email, row.sub?.name),
  );
}

// ── Excel export ──────────────────────────────────────────────────────────────

export function toLedgerSheet(rows: LedgerRow[], mainCode: string): Record<string, unknown>[] {
  return rows.map(({ payment, member, sub, amountMain }) => ({
    paid_at: isoToDisplay(payment.paid_at),
    member: member?.name ?? "",
    email: member?.email ?? "",
    group: sub?.name ?? "",
    period_months: payment.period_months ?? 0,
    amount: payment.amount ?? 0,
    currency: sub?.expand?.currency?.code ?? "",
    [`amount_${mainCode || "main"}`]: Math.round(amountMain * 100) / 100,
    expires_before: isoToDisplay(payment.expires_before),
    expires_after: isoToDisplay(payment.expires_after),
    notes: payment.notes ?? "",
    slip: payment.slip ? "yes" : "no",
  }));
}

export function toMembersSheet(rows: MemberRow[], mainCode: string): Record<string, unknown>[] {
  return rows.map((row) => ({
    member: row.member.name,
    email: row.member.email ?? "",
    group: row.sub?.name ?? "",
    expires_at: isoToDisplay(row.member.expires_at),
    status: row.status,
    last_paid: isoToDisplay(row.lastPaid),
    payments: row.paymentCount,
    [`total_paid_${mainCode || "main"}`]: Math.round(row.totalPaidMain * 100) / 100,
  }));
}
