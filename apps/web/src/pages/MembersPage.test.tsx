import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { createQueryClientWrapper } from "@/test/query-client";

const mocks = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  listSubs: vi.fn(),
  listMembers: vi.fn(),
  listPayments: vi.fn(),
  listCurrencies: vi.fn(),
  slipUrl: vi.fn(),
  toastError: vi.fn(),
  jsonToSheet: vi.fn((rows: unknown[]) => ({ rows })),
  bookNew: vi.fn(() => ({ sheets: [] as unknown[] })),
  appendSheet: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/services/subscriptions", () => ({
  subscriptionsService: { list: mocks.listSubs, logoUrl: () => null },
}));
vi.mock("@/services/subscriptionMembers", () => ({
  subscriptionMembersService: { list: mocks.listMembers },
}));
vi.mock("@/services/memberPayments", () => ({
  memberPaymentsService: { listForUser: mocks.listPayments, slipUrl: mocks.slipUrl },
}));
vi.mock("@/services/currencies", () => ({ currenciesService: { list: mocks.listCurrencies } }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: mocks.toastError } }));
vi.mock("xlsx", () => ({
  utils: { json_to_sheet: mocks.jsonToSheet, book_new: mocks.bookNew, book_append_sheet: mocks.appendSheet },
  writeFile: mocks.writeFile,
}));
vi.mock("@/components/subscriptions/MemberPaymentDialog", () => ({
  MemberPaymentDialog: ({
    sub,
    member,
    payments,
    onClose,
  }: {
    sub: { name: string };
    member: { name: string };
    payments: unknown[];
    onClose: () => void;
  }) => (
    <div>
      <span>
        paying:{member.name}:{sub.name}:{payments.length}
      </span>
      <button type="button" onClick={onClose}>
        close-paying
      </button>
    </div>
  ),
}));

import { MembersPage } from "./MembersPage";

const baht = { id: "thb", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "user-1" };
const usd = { id: "usd", name: "Dollar", symbol: "$", code: "USD", rate: 0.03, is_main: false, user: "user-1" };

function renderPage() {
  const { Wrapper } = createQueryClientWrapper();
  render(<MembersPage />, { wrapper: Wrapper });
}

const ledgerItems = () => screen.getAllByRole("listitem");

describe("MembersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
    mocks.user = { id: "user-1" };
    mocks.listSubs.mockResolvedValue([
      { id: "x1", name: "X1", brand_domain: "microsoft.com", expand: { currency: baht } },
      { id: "us", name: "US Group", expand: { currency: usd, member_currency: usd } },
      { id: "empty", name: "No members" },
    ]);
    mocks.listMembers.mockResolvedValue([
      { id: "a1", subscription: "x1", user: "user-1", name: "A1", email: "test1@email.com", expires_at: "2026-09-20" },
      { id: "b1", subscription: "us", user: "user-1", name: "B1", expires_at: "2026-10-05" },
      { id: "c1", subscription: "x1", user: "user-1", name: "C1", expires_at: "2027-06-01" },
      { id: "d1", subscription: "x1", user: "user-1", name: "D1" },
    ]);
    mocks.listPayments.mockResolvedValue([
      { id: "p1", member: "a1", subscription: "x1", user: "user-1", paid_at: "2026-10-05", amount: 400, period_months: 12, expires_after: "2027-10-05", slip: "s.pdf" },
      { id: "p2", member: "b1", subscription: "us", user: "user-1", paid_at: "2026-10-02", amount: 3, period_months: 1, expires_after: "2026-11-05" },
      { id: "p3", member: "a1", subscription: "x1", user: "user-1", paid_at: "2026-08-01", amount: 400, period_months: 12, expires_after: "2026-09-20" },
      { id: "p4", member: "gone", subscription: "nope", user: "user-1", paid_at: "2026-10-03", amount: 50, expires_after: "2027-01-01" },
    ]);
    mocks.listCurrencies.mockResolvedValue([baht, usd]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows this month's ledger, income and member counts", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("ledger_count:3")).toBeInTheDocument());

    expect(screen.getByText("october 2026")).toBeInTheDocument();
    expect(ledgerItems().map((li) => li.textContent?.slice(0, 8))).toEqual(["05-10-26", "02-10-26", "03-10-26"]);
    // 400 THB + 3 USD (100 THB) + 50 THB
    expect(screen.getAllByText(/550/).length).toBeGreaterThan(0);
    expect(screen.getByText("active_members").parentElement).toHaveTextContent("3");
    expect(screen.getByText("member_status_expired").parentElement).toHaveTextContent("1");
    // Only groups with members are offered as filters.
    expect(within(screen.getByLabelText("group")).getAllByRole("option")).toHaveLength(3);
  });

  it("steps through months and years and shows all time", async () => {
    renderPage();
    await waitFor(() => screen.getByText("ledger_count:3"));

    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    expect(screen.getByText("september 2026")).toBeInTheDocument();
    expect(screen.getByText("ledger_empty")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "period_mode_year" }));
    expect(screen.getByText("ledger_count:4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "period_mode_all" }));
    expect(screen.getByText("ledger_count:4")).toBeInTheDocument();
  });

  it("filters the ledger by group and search", async () => {
    renderPage();
    await waitFor(() => screen.getByText("ledger_count:3"));

    fireEvent.change(screen.getByLabelText("group"), { target: { value: "us" } });
    expect(screen.getByText("ledger_count:1")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("group"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("search"), { target: { value: "test1" } });
    expect(screen.getByText("ledger_count:1")).toBeInTheDocument();
  });

  it("opens the payment dialog from a ledger row, but not for a deleted member", async () => {
    renderPage();
    await waitFor(() => screen.getByText("ledger_count:3"));

    fireEvent.click(within(ledgerItems()[0]).getByTitle("record_payment"));
    expect(screen.getByText("paying:A1:X1:2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close-paying" }));
    expect(screen.queryByText(/paying:/)).not.toBeInTheDocument();

    fireEvent.click(within(ledgerItems()[2]).getByTitle("record_payment"));
    expect(screen.queryByText(/paying:/)).not.toBeInTheDocument();
  });

  it("opens slips in a new tab and reports failures", async () => {
    const tab = { location: { href: "" }, close: vi.fn() };
    const open = vi.spyOn(window, "open").mockReturnValue(tab as never);
    renderPage();
    await waitFor(() => screen.getByText("ledger_count:3"));
    const slipButton = () => within(ledgerItems()[0]).getByRole("button", { name: /view_slip/ });

    mocks.slipUrl.mockResolvedValueOnce("/files/s.pdf?token=t");
    fireEvent.click(slipButton());
    await waitFor(() => expect(tab.location.href).toBe("/files/s.pdf?token=t"));

    mocks.slipUrl.mockRejectedValueOnce(new Error("nope"));
    fireEvent.click(slipButton());
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("slip_open_failed"));
    expect(tab.close).toHaveBeenCalled();

    open.mockReturnValueOnce(null);
    mocks.slipUrl.mockResolvedValueOnce("/files/s.pdf?token=t2");
    fireEvent.click(slipButton());
    await waitFor(() => expect(mocks.slipUrl).toHaveBeenCalledTimes(3));
    open.mockRestore();
  });

  it("shows the member register with status filters and record payment", async () => {
    renderPage();
    await waitFor(() => screen.getByText("ledger_count:3"));

    fireEvent.click(screen.getByRole("tab", { name: /member_register/ }));
    const names = () => ledgerItems().map((li) => li.querySelector("span span")?.textContent);
    expect(names()).toEqual(["A1", "B1", "C1", "D1"]);

    fireEvent.click(screen.getByRole("button", { name: /member_status_expiring/ }));
    expect(names()).toEqual(["B1"]);

    fireEvent.click(screen.getByRole("button", { name: "record_payment: B1" }));
    expect(screen.getByText("paying:B1:US Group:1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /ledger/ }));
    expect(screen.getByText("ledger_count:3")).toBeInTheDocument();
  });

  it("exports the filtered ledger and members to Excel", async () => {
    renderPage();
    await waitFor(() => screen.getByText("ledger_count:3"));
    fireEvent.change(screen.getByLabelText("group"), { target: { value: "us" } });

    fireEvent.click(screen.getByRole("button", { name: /export_excel/ }));
    await waitFor(() => expect(mocks.writeFile).toHaveBeenCalled());
    expect(mocks.appendSheet).toHaveBeenCalledTimes(2);
    expect(mocks.appendSheet.mock.calls.map((call) => call[2])).toEqual(["Ledger", "Members"]);
    const [ledgerRows, memberRows] = mocks.jsonToSheet.mock.calls.map((call) => call[0] as Array<Record<string, unknown>>);
    expect(ledgerRows.map((row) => row.member)).toEqual(["B1"]);
    expect(memberRows.map((row) => row.member)).toEqual(["B1"]);
    expect(mocks.writeFile.mock.calls[0][1]).toBe("zublo-income-2026-10.xlsx");

    mocks.writeFile.mockImplementationOnce(() => {
      throw new Error("disk full");
    });
    fireEvent.click(screen.getByRole("button", { name: /export_excel/ }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("unknown_error"));
  });

  it("works without a main currency or a signed-in user", async () => {
    mocks.listCurrencies.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText("ledger_count:3"));
    expect(screen.getAllByText(/\$/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /export_excel/ }));
    await waitFor(() => expect(mocks.writeFile).toHaveBeenCalled());
    expect(Object.keys((mocks.jsonToSheet.mock.calls[0][0] as Array<Record<string, unknown>>)[0])).toContain("amount_main");

    mocks.user = null;
    renderPage();
    expect(mocks.listSubs).toHaveBeenCalledTimes(1);
  });
});
