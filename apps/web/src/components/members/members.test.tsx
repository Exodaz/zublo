import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));

import type { LedgerRow, MemberRow, Period } from "@/lib/memberLedger";
import type { Subscription } from "@/types";

import { GroupFilter } from "./GroupFilter";
import { LedgerTable } from "./LedgerTable";
import { MemberRegister } from "./MemberRegister";
import { PeriodPicker } from "./PeriodPicker";

const baht = { id: "thb", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "u" };
const SUB = { id: "x1", name: "X1", brand_domain: "microsoft.com", expand: { currency: baht } } as Subscription;

describe("PeriodPicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 15));
  });
  afterEach(() => vi.useRealTimers());

  it("labels and steps months", () => {
    const onChange = vi.fn();
    render(<PeriodPicker period={{ mode: "month", year: 2026, month: 10 }} onChange={onChange} />);
    expect(screen.getByText("october 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "period_mode_month" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    expect(onChange).toHaveBeenLastCalledWith({ mode: "month", year: 2026, month: 9 });
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(onChange).toHaveBeenLastCalledWith({ mode: "month", year: 2026, month: 11 });
  });

  it("switches modes, keeping the viewed year for years", () => {
    const onChange = vi.fn();
    const period: Period = { mode: "month", year: 2024, month: 3 };
    render(<PeriodPicker period={period} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "period_mode_year" }));
    expect(onChange).toHaveBeenLastCalledWith({ mode: "year", year: 2024, month: 10 });
    fireEvent.click(screen.getByRole("button", { name: "period_mode_all" }));
    expect(onChange).toHaveBeenLastCalledWith({ mode: "all", year: 2026, month: 10 });
    fireEvent.click(screen.getByRole("button", { name: "period_mode_month" }));
    expect(onChange).toHaveBeenLastCalledWith({ mode: "month", year: 2024, month: 10 });
  });

  it("shows the year, and hides stepping for all time", () => {
    const { rerender } = render(<PeriodPicker period={{ mode: "year", year: 2025, month: 1 }} onChange={vi.fn()} />);
    expect(screen.getByText("2025")).toBeInTheDocument();
    rerender(<PeriodPicker period={{ mode: "all", year: 2025, month: 1 }} onChange={vi.fn()} />);
    expect(screen.getByText("period_all_time")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "previous" })).not.toBeInTheDocument();
  });
});

describe("GroupFilter", () => {
  it("lists groups with an all option", () => {
    const onChange = vi.fn();
    render(<GroupFilter subscriptions={[SUB]} value="" onChange={onChange} />);
    const select = screen.getByLabelText("group");
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["all_groups", "X1"]);
    fireEvent.change(select, { target: { value: "x1" } });
    expect(onChange).toHaveBeenCalledWith("x1");
  });
});

describe("LedgerTable", () => {
  const row = (o: Partial<LedgerRow> & { id: string }): LedgerRow => ({
    payment: {
      id: o.id,
      member: "a1",
      subscription: "x1",
      user: "u",
      paid_at: "2026-10-05",
      amount: 400,
      period_months: 12,
      expires_after: "2027-10-05",
      ...o.payment,
    },
    member: "member" in o ? o.member : { id: "a1", subscription: "x1", user: "u", name: "A1", email: "test1@email.com" },
    sub: "sub" in o ? o.sub : SUB,
    amountMain: o.amountMain ?? 400,
  });

  it("lists payments with periods, slips and a main-currency total", () => {
    const onOpenMember = vi.fn();
    const onOpenSlip = vi.fn();
    const rows = [
      row({ id: "p1", payment: { slip: "s.pdf" } as never }),
      row({ id: "p2", payment: { period_months: 1 } as never, amountMain: 100 }),
      row({ id: "p3", payment: { period_months: 3, amount: undefined } as never, amountMain: 0 }),
      row({ id: "p4", payment: { period_months: undefined } as never, member: undefined, sub: undefined, amountMain: 0 }),
      row({ id: "p5", member: { id: "a2", subscription: "x1", user: "u", name: "same@x.com", email: "same@x.com" } }),
    ];
    render(
      <LedgerTable rows={rows} mainCurrency={baht} onOpenMember={onOpenMember} onOpenSlip={onOpenSlip} />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("05-10-26");
    expect(items[0]).toHaveTextContent("test1@email.com");
    expect(items[0]).toHaveTextContent("period_1_year");
    expect(items[1]).toHaveTextContent("period_1_month");
    expect(items[2]).toHaveTextContent("months_count:3");
    expect(items[3]).toHaveTextContent("deleted_member");
    expect(items[3]).toHaveTextContent("custom_date");
    expect(within(items[4]).getAllByText("same@x.com")).toHaveLength(1);
    expect(screen.getByText("ledger_count:5")).toBeInTheDocument();
    expect(screen.getByText(/900/)).toBeInTheDocument();

    fireEvent.click(within(items[0]).getByRole("button", { name: /view_slip/ }));
    expect(onOpenSlip).toHaveBeenCalledWith(rows[0].payment);
    fireEvent.click(within(items[1]).getByTitle("record_payment"));
    expect(onOpenMember).toHaveBeenCalledWith(rows[1]);
  });

  it("falls back to the dollar sign and shows an empty state", () => {
    const { rerender } = render(
      <LedgerTable
        rows={[row({ id: "p1", sub: { id: "x1", name: "X1" } as Subscription })]}
        onOpenMember={vi.fn()}
        onOpenSlip={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0);
    rerender(<LedgerTable rows={[]} onOpenMember={vi.fn()} onOpenSlip={vi.fn()} />);
    expect(screen.getByText("ledger_empty")).toBeInTheDocument();
  });
});

describe("MemberRegister", () => {
  const mrow = (o: Partial<MemberRow> & { id: string; name: string }): MemberRow => ({
    member: { id: o.id, subscription: "x1", user: "u", name: o.name, email: `${o.name}@x.com`, expires_at: "2026-09-01", ...o.member },
    sub: "sub" in o ? o.sub : SUB,
    status: o.status ?? "expired",
    daysLeft: o.daysLeft ?? -10,
    lastPaid: o.lastPaid ?? "2026-08-01",
    totalPaidMain: o.totalPaidMain ?? 800,
    paymentCount: 2,
  });
  const counts = { all: 3, expired: 1, expiring: 0, active: 1, none: 1 };

  it("shows members with status, last paid, totals and a record-payment button", () => {
    const onRecordPayment = vi.fn();
    const onStatusChange = vi.fn();
    const rows = [
      mrow({ id: "a", name: "A1" }),
      mrow({ id: "b", name: "b@x.com", member: { email: "b@x.com", expires_at: "" } as never, sub: undefined, status: "none", daysLeft: null, lastPaid: "" }),
    ];
    render(
      <MemberRegister
        rows={rows}
        status="all"
        counts={counts}
        mainCurrency={baht}
        onStatusChange={onStatusChange}
        onRecordPayment={onRecordPayment}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("A1@x.com");
    expect(items[0]).toHaveTextContent("01-09-26");
    expect(items[0]).toHaveTextContent("member_expired");
    expect(items[0]).toHaveTextContent("01-08-26");
    expect(items[1]).toHaveTextContent("member_no_expiry");
    expect(within(items[1]).getAllByText("b@x.com")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "record_payment: A1" }));
    expect(onRecordPayment).toHaveBeenCalledWith(rows[0]);

    expect(screen.getByRole("button", { name: /member_status_all/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /member_status_expired/ }));
    expect(onStatusChange).toHaveBeenCalledWith("expired");
  });

  it("shows an empty state and the dollar fallback", () => {
    const { rerender } = render(
      <MemberRegister rows={[]} status="expiring" counts={counts} onStatusChange={vi.fn()} onRecordPayment={vi.fn()} />,
    );
    expect(screen.getByText("register_empty")).toBeInTheDocument();
    rerender(
      <MemberRegister rows={[mrow({ id: "a", name: "A1" })]} status="all" counts={counts} onStatusChange={vi.fn()} onRecordPayment={vi.fn()} />,
    );
    expect(screen.getByText(/\$/)).toBeInTheDocument();
  });
});
