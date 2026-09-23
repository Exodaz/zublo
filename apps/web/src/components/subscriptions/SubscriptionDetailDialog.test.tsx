import { fireEvent, render, screen, within } from "@testing-library/react";

import { createQueryClientWrapper } from "@/test/query-client";
import type { Subscription, SubscriptionMember } from "@/types";

const mocks = vi.hoisted(() => ({ getHistory: vi.fn() }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));

vi.mock("@/services/subscriptionHistory", () => ({
  subscriptionHistoryService: { get: mocks.getHistory },
}));

vi.mock("@/services/subscriptions", () => ({
  subscriptionsService: { logoUrl: () => null },
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    formatPrice: (value: number, symbol: string) => `${value.toFixed(2)} ${symbol}`,
    formatDate: (value: string) => `date(${value.slice(0, 10)})`,
    daysUntil: () => 5,
  };
});

import { SubscriptionDetailDialog } from "./SubscriptionDetailDialog";

function getSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "Microsoft 365",
    price: 2400,
    currency: "cur-1",
    frequency: 1,
    cycle: "yearly",
    next_payment: "2027-01-22",
    auto_renew: true,
    start_date: "2026-04-22",
    notify: true,
    notify_days_before: 3,
    inactive: false,
    user: "user-1",
    payment_account: "family@icloud.com",
    url: "https://www.microsoft365.com",
    notes: "Status: ok\nApple ID credit: 236 THB",
    expand: {
      currency: { id: "cur-1", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "user-1" },
      cycle: { id: "yearly", name: "Yearly" },
      category: { id: "cat-1", name: "Productivity", user: "user-1" },
      payment_method: { id: "pm-1", name: "Apple Pay", user: "user-1" } as never,
      payer: { id: "hh-1", name: "Naruthep", user: "user-1" },
    },
    ...overrides,
  };
}

const MEMBERS: SubscriptionMember[] = [
  { id: "m-1", subscription: "sub-1", user: "user-1", name: "alice@x.com", amount: 400 },
  { id: "m-2", subscription: "sub-1", user: "user-1", name: "bob@x.com", amount: 400, expires_at: "2000-01-01" },
  { id: "m-3", subscription: "sub-1", user: "user-1", name: "carol@x.com" },
];

function renderDialog(sub = getSubscription(), members = MEMBERS) {
  const handlers = { onClose: vi.fn(), onEdit: vi.fn(), onMembers: vi.fn(), onHistory: vi.fn() };
  const { Wrapper } = createQueryClientWrapper();
  render(
    <SubscriptionDetailDialog sub={sub} userId="user-1" members={members} {...handlers} />,
    { wrapper: Wrapper },
  );
  return handlers;
}

describe("SubscriptionDetailDialog", () => {
  beforeEach(() => {
    mocks.getHistory.mockReset();
    mocks.getHistory.mockResolvedValue({ totals: { estimated_total: 1200 } });
  });

  it("summarises cost, billing, payment, members and notes", async () => {
    renderDialog();

    expect(screen.getByText("Microsoft 365")).toBeInTheDocument();
    expect(screen.getByText("Productivity")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    // Yearly price and its per-year equivalent are the same amount.
    expect(screen.getAllByText("2400.00 ฿")).toHaveLength(2);
    expect(screen.getByText("200.00 ฿")).toBeInTheDocument();
    expect(await screen.findByText("total_spent")).toBeInTheDocument();
    expect(screen.getByText("1200.00 ฿")).toBeInTheDocument();
    expect(mocks.getHistory).toHaveBeenCalledWith("sub-1");

    expect(screen.getByText("date(2027-01-22)")).toBeInTheDocument();
    expect(screen.getByText("(in_days:5)")).toBeInTheDocument();
    expect(screen.getByText("notify_days_before_value:3")).toBeInTheDocument();
    expect(screen.getByText("yes")).toBeInTheDocument();

    expect(screen.getByText("฿ THB")).toBeInTheDocument();
    expect(screen.getByText("Apple Pay")).toBeInTheDocument();
    expect(screen.getByText("family@icloud.com")).toBeInTheDocument();
    expect(screen.getByText("Naruthep")).toBeInTheDocument();

    expect(screen.getByText("members_summary:3,800.00 ฿")).toBeInTheDocument();
    expect(screen.getByText("member_expired")).toBeInTheDocument();
    expect(screen.getAllByText("member_no_expiry")).toHaveLength(2);

    expect(screen.getByRole("link")).toHaveAttribute("href", "https://www.microsoft365.com");
    expect(screen.getByText(/Apple ID credit: 236 THB/)).toBeInTheDocument();
  });

  it("forwards the edit, members and history actions and closes on escape", () => {
    const handlers = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /edit/ }));
    fireEvent.click(screen.getByRole("button", { name: /manage_members/ }));
    fireEvent.click(screen.getByRole("button", { name: /history/ }));
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
    expect(handlers.onMembers).toHaveBeenCalledTimes(1);
    expect(handlers.onHistory).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("shows a sparse, inactive, finite subscription with fallbacks", () => {
    renderDialog(
      getSubscription({
        inactive: true,
        notify: false,
        auto_renew: false,
        frequency: 0,
        payment_account: "",
        url: "javascript:alert(1)",
        notes: "",
        payment_limit: 12,
        end_date: "2027-06-01",
        cancellation_date: "2027-05-01",
        start_date: "",
        next_payment: "",
        expand: undefined,
      }),
      [],
    );

    expect(screen.getByText("inactive_label")).toBeInTheDocument();
    expect(screen.getByText("payments_progress:0,12")).toBeInTheDocument();
    expect(screen.getByText("date(2027-06-01)")).toBeInTheDocument();
    expect(screen.getByText("date(2027-05-01)")).toBeInTheDocument();
    expect(screen.queryByText("next_payment")).not.toBeInTheDocument();
    expect(screen.queryByText("start_date")).not.toBeInTheDocument();
    expect(screen.getAllByText("no")).toHaveLength(2);
    expect(screen.getAllByText("—")).toHaveLength(4);
    expect(screen.getByText("no_members")).toBeInTheDocument();
    // An unsafe URL and empty notes leave the notes section out entirely.
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("notes")).not.toBeInTheDocument();
    // Without an expanded cycle the monthly default applies: 2400 / month.
    expect(screen.getAllByText("2400.00 $").length).toBeGreaterThan(0);
  });

  it("treats credits as one-time income and hides past countdowns", async () => {
    renderDialog(
      getSubscription({ record_type: "credit", notes: "bonus", url: "" }),
      [],
    );

    expect(screen.getByText("credit_income")).toBeInTheDocument();
    expect(screen.getByText("one_time")).toBeInTheDocument();
    expect(screen.getByText("+2400.00 ฿")).toBeInTheDocument();
    expect(screen.queryByText("per_month")).not.toBeInTheDocument();
    expect(screen.queryByText("auto_renew")).not.toBeInTheDocument();
    expect(screen.queryByText("notifications")).not.toBeInTheDocument();
    expect(screen.getByText("received_on")).toBeInTheDocument();
    expect(await screen.findByText("total_received")).toBeInTheDocument();
    const notes = screen.getByText("bonus");
    expect(within(notes.closest("section") as HTMLElement).queryByRole("link")).toBeNull();
  });
});
