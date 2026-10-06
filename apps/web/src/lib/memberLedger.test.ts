import type { MemberPayment, Subscription, SubscriptionMember } from "@/types";

import {
  buildLedgerRows,
  buildMemberRows,
  currentPeriod,
  filterLedger,
  filterMembers,
  inPeriod,
  periodRange,
  periodSlug,
  stepPeriod,
  summarize,
  toLedgerSheet,
  toMembersSheet,
} from "./memberLedger";

const baht = { id: "thb", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "u" };
const usd = { id: "usd", name: "Dollar", symbol: "$", code: "USD", rate: 0.03, is_main: false, user: "u" };
const sub = (id: string, name: string, currency = baht) =>
  ({ id, name, expand: { currency, member_currency: currency } }) as Subscription;
const member = (o: Partial<SubscriptionMember>): SubscriptionMember => ({
  id: "m",
  subscription: "x1",
  user: "u",
  name: "A1",
  ...o,
});
const pay = (o: Partial<MemberPayment>): MemberPayment => ({
  id: "p",
  member: "a1",
  subscription: "x1",
  user: "u",
  paid_at: "2026-10-05 00:00:00.000Z",
  amount: 400,
  period_months: 12,
  expires_after: "2027-10-05 00:00:00.000Z",
  ...o,
});

const subsById = new Map([
  ["x1", sub("x1", "X1")],
  ["us", sub("us", "US Group", usd)],
]);
const membersById = new Map([
  ["a1", member({ id: "a1", name: "A1", email: "test1@email.com", expires_at: "2026-09-20" })],
  ["b1", member({ id: "b1", name: "B1", subscription: "us", expires_at: "2026-10-05" })],
  ["c1", member({ id: "c1", name: "C1", expires_at: "2027-06-01" })],
  ["d1", member({ id: "d1", name: "D1" })],
]);

describe("period", () => {
  it("starts on the current month and steps across year boundaries", () => {
    expect(currentPeriod(new Date(2026, 9, 15))).toEqual({ mode: "month", year: 2026, month: 10 });
    expect(stepPeriod({ mode: "month", year: 2026, month: 12 }, 1)).toEqual({ mode: "month", year: 2027, month: 1 });
    expect(stepPeriod({ mode: "month", year: 2026, month: 1 }, -1)).toEqual({ mode: "month", year: 2025, month: 12 });
    expect(stepPeriod({ mode: "year", year: 2026, month: 3 }, -1)).toEqual({ mode: "year", year: 2025, month: 3 });
    const all = { mode: "all" as const, year: 2026, month: 3 };
    expect(stepPeriod(all, 1)).toBe(all);
  });

  it("gives inclusive day bounds and file slugs", () => {
    expect(periodRange({ mode: "month", year: 2028, month: 2 })).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(periodRange({ mode: "year", year: 2026, month: 1 })).toEqual({ from: "2026-01-01", to: "2026-12-31" });
    expect(periodRange({ mode: "all", year: 2026, month: 1 })).toBeNull();
    expect(periodSlug({ mode: "month", year: 2026, month: 3 })).toBe("2026-03");
    expect(periodSlug({ mode: "year", year: 2026, month: 3 })).toBe("2026");
    expect(periodSlug({ mode: "all", year: 2026, month: 3 })).toBe("all");
  });

  it("checks whether a date falls in the period", () => {
    const october = periodRange({ mode: "month", year: 2026, month: 10 });
    expect(inPeriod("2026-10-01 00:00:00.000Z", october)).toBe(true);
    expect(inPeriod("2026-10-31", october)).toBe(true);
    expect(inPeriod("2026-11-01", october)).toBe(false);
    expect(inPeriod("garbage", october)).toBe(false);
    expect(inPeriod("garbage", null)).toBe(true);
  });
});

describe("ledger and register", () => {
  const payments = [
    pay({ id: "p1", member: "a1", amount: 400 }),
    pay({ id: "p2", member: "b1", subscription: "us", amount: 3, paid_at: "2026-10-02" }),
    pay({ id: "p3", member: "a1", amount: undefined, paid_at: "2026-08-01" }),
    pay({ id: "p4", member: "gone", subscription: "nope", amount: 10 }),
  ];

  it("builds ledger rows with amounts in the main currency", () => {
    const rows = buildLedgerRows(payments, subsById, membersById);
    expect(rows.map((r) => [r.payment.id, r.member?.name, r.sub?.name, Math.round(r.amountMain)])).toEqual([
      ["p1", "A1", "X1", 400],
      ["p2", "B1", "US Group", 100],
      ["p3", "A1", "X1", 0],
      ["p4", undefined, undefined, 10],
    ]);
  });

  it("builds the register most urgent first with payment totals", () => {
    const rows = buildMemberRows([...membersById.values()], payments, subsById, "2026-10-01");
    expect(rows.map((r) => [r.member.name, r.status, r.lastPaid, Math.round(r.totalPaidMain), r.paymentCount])).toEqual([
      ["A1", "expired", "2026-10-05", 400, 2],
      ["B1", "expiring", "2026-10-02", 100, 1],
      ["C1", "active", "", 0, 0],
      ["D1", "none", "", 0, 0],
    ]);
  });

  it("breaks urgency ties by days left, then name", () => {
    const rows = buildMemberRows(
      [
        member({ id: "z", name: "Zed", expires_at: "2027-01-01" }),
        member({ id: "y", name: "Amy", expires_at: "2027-01-01", subscription: "nope" }),
        member({ id: "x", name: "Bob", expires_at: "2026-12-01" }),
      ],
      [],
      subsById,
      "2026-10-01",
    );
    expect(rows.map((r) => r.member.name)).toEqual(["Bob", "Amy", "Zed"]);
    expect(rows[1].sub).toBeUndefined();
  });

  it("summarises income and member states", () => {
    const ledger = buildLedgerRows(payments.slice(0, 2), subsById, membersById);
    const register = buildMemberRows([...membersById.values()], payments, subsById, "2026-10-01");
    const summary = summarize(ledger, register);
    expect(Math.round(summary.income)).toBe(500);
    expect(summary).toMatchObject({ payments: 2, active: 3, expiring: 1, expired: 1 });
  });

  it("filters by group, search and status", () => {
    const ledger = buildLedgerRows(payments, subsById, membersById);
    expect(filterLedger(ledger, { subscriptionId: "us", search: "" }).map((r) => r.payment.id)).toEqual(["p2"]);
    expect(filterLedger(ledger, { subscriptionId: "", search: "TEST1@" }).map((r) => r.payment.id)).toEqual(["p1", "p3"]);
    expect(filterLedger(ledger, { subscriptionId: "", search: "us group" }).map((r) => r.payment.id)).toEqual(["p2"]);
    expect(filterLedger(ledger, { subscriptionId: "", search: "  " })).toHaveLength(4);

    const register = buildMemberRows([...membersById.values()], payments, subsById, "2026-10-01");
    expect(filterMembers(register, { subscriptionId: "", search: "", status: "expired" }).map((r) => r.member.name)).toEqual(["A1"]);
    expect(filterMembers(register, { subscriptionId: "us", search: "", status: "all" }).map((r) => r.member.name)).toEqual(["B1"]);
    expect(filterMembers(register, { subscriptionId: "", search: "c1", status: "all" }).map((r) => r.member.name)).toEqual(["C1"]);
  });

  it("produces export rows with display dates and main-currency amounts", () => {
    const ledger = buildLedgerRows(
      [pay({ id: "p1", slip: "s.pdf", notes: "kbank", expires_before: "2026-10-05" }), pay({ id: "p9", member: "x", subscription: "y", amount: undefined, period_months: undefined })],
      subsById,
      membersById,
    );
    expect(toLedgerSheet(ledger, "THB")).toEqual([
      {
        paid_at: "05/10/2026",
        member: "A1",
        email: "test1@email.com",
        group: "X1",
        period_months: 12,
        amount: 400,
        currency: "THB",
        amount_THB: 400,
        expires_before: "05/10/2026",
        expires_after: "05/10/2027",
        notes: "kbank",
        slip: "yes",
      },
      {
        paid_at: "05/10/2026",
        member: "",
        email: "",
        group: "",
        period_months: 0,
        amount: 0,
        // No group: the amount is in the main currency.
        currency: "THB",
        amount_THB: 0,
        expires_before: "",
        expires_after: "05/10/2027",
        notes: "",
        slip: "no",
      },
    ]);

    const register = buildMemberRows(
      [member({ id: "a1", name: "A1", email: "a@x", expires_at: "2027-01-01" }), member({ id: "q", subscription: "nope" })],
      [pay({ id: "p1", member: "a1", amount: 400.456 })],
      subsById,
      "2026-10-01",
    );
    expect(toMembersSheet(register, "")).toEqual([
      { member: "A1", email: "a@x", group: "X1", expires_at: "01/01/2027", status: "active", last_paid: "05/10/2026", payments: 1, total_paid_main: 400.46 },
      { member: "A1", email: "", group: "", expires_at: "", status: "none", last_paid: "", payments: 0, total_paid_main: 0 },
    ]);
    expect(Object.keys(toLedgerSheet(ledger, "")[0])).toContain("amount_main");
  });
});
