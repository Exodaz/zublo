import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { forecastWallet } from "@/lib/creditForecast";
import { createQueryClientWrapper } from "@/test/query-client";
import type { CreditEntry, CreditWallet, Currency, Subscription } from "@/types";

const mocks = vi.hoisted(() => ({
  createWallet: vi.fn(),
  updateWallet: vi.fn(),
  createEntry: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));
vi.mock("@/services/creditWallets", () => ({
  creditWalletsService: { create: mocks.createWallet, update: mocks.updateWallet },
  creditEntriesService: { create: mocks.createEntry },
}));
vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <input
      type="checkbox"
      role="switch"
      aria-checked={checked}
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));
vi.mock("@/lib/toast", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));

import { CreditEntryDialog } from "./CreditEntryDialog";
import { WalletCard } from "./WalletCard";
import { WalletDialog } from "./WalletDialog";

const thb: Currency = { id: "thb", name: "Baht", code: "THB", symbol: "฿", rate: 1, is_main: true, user: "u1" };
const usd: Currency = { id: "usd", name: "Dollar", code: "USD", symbol: "$", rate: 0.03, is_main: false, user: "u1" };
const wallet: CreditWallet = { id: "w1", name: "Family", account: "me@apple", currency: "thb", alerts: true, user: "u1", notes: "n" };

function renderWith(ui: React.ReactElement) {
  const { Wrapper } = createQueryClientWrapper();
  return render(ui, { wrapper: Wrapper });
}

describe("WalletDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a wallet in the main currency with alerts on", async () => {
    const onClose = vi.fn();
    mocks.createWallet.mockResolvedValue({});
    renderWith(
      <WalletDialog userId="u1" currencies={[usd, thb]} accountOptions={["me@apple", "kid@apple"]} onClose={onClose} />,
    );
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
    expect(document.querySelectorAll("#wallet-account-options option")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("wallet_account"), { target: { value: " kid@apple " } });
    fireEvent.change(screen.getByLabelText("wallet_name"), { target: { value: "Kid" } });
    fireEvent.change(screen.getByLabelText("notes"), { target: { value: " hi " } });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.createWallet).toHaveBeenCalledWith({
      user: "u1",
      name: "Kid",
      account: "kid@apple",
      currency: "thb",
      alerts: true,
      notes: "hi",
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("wallet_saved");
  });

  it("edits an existing wallet and reports failures", async () => {
    mocks.updateWallet.mockRejectedValue(new Error("nope"));
    const onClose = vi.fn();
    renderWith(<WalletDialog wallet={wallet} userId="u1" currencies={[thb, usd]} accountOptions={[]} onClose={onClose} />);
    expect(screen.getByText("edit_wallet", { selector: "h2" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("wallet_currency"), { target: { value: "usd" } });
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("unknown_error"));
    expect(mocks.updateWallet).toHaveBeenCalledWith("w1", {
      name: "Family",
      account: "me@apple",
      currency: "usd",
      alerts: false,
      notes: "n",
    });
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows progress while saving", async () => {
    mocks.updateWallet.mockReturnValue(new Promise(() => {}));
    renderWith(<WalletDialog wallet={wallet} userId="u1" currencies={[thb]} accountOptions={[]} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(await screen.findByRole("button", { name: "saving" })).toBeDisabled();
  });

  it("works without any currency or wallet extras", () => {
    renderWith(
      <WalletDialog
        wallet={{ id: "w2", name: "X", account: "x", user: "u1" } as CreditWallet}
        userId="u1"
        currencies={[]}
        accountOptions={[]}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("wallet_currency").children).toHaveLength(0);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });
});

describe("CreditEntryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 3, 12));
  });
  afterEach(() => vi.useRealTimers());

  it("records a top-up dated today", async () => {
    const onClose = vi.fn();
    mocks.createEntry.mockResolvedValue({});
    renderWith(<CreditEntryDialog wallet={wallet} type="topup" userId="u1" symbol="฿" onClose={onClose} />);
    expect(screen.getByText(/top_up_hint/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/amount/), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText("notes"), { target: { value: " gift card " } });
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.createEntry).toHaveBeenCalledWith({
      wallet: "w1",
      user: "u1",
      type: "topup",
      amount: 1000,
      date: "2026-10-03",
      notes: "gift card",
    });
  });

  it("shows progress while saving", async () => {
    mocks.createEntry.mockReturnValue(new Promise(() => {}));
    renderWith(<CreditEntryDialog wallet={wallet} type="topup" userId="u1" symbol="฿" onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/amount/), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(await screen.findByRole("button", { name: "saving" })).toBeDisabled();
  });

  it("records a balance reading and reports failures", async () => {
    mocks.createEntry.mockRejectedValue(new Error("nope"));
    const onClose = vi.fn();
    renderWith(<CreditEntryDialog wallet={wallet} type="balance" userId="u1" symbol="฿" onClose={onClose} />);
    expect(screen.getByText(/set_balance_hint/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("date"), { target: { value: "01/10/2026" } });
    fireEvent.change(screen.getByLabelText(/amount/), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("unknown_error"));
    expect(mocks.createEntry.mock.calls[0][0]).toMatchObject({ type: "balance", amount: 500, date: "2026-10-01" });
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("WalletCard", () => {
  const spotify = { id: "s1", name: "Spotify", amount: 279, cycle: "Monthly", next_payment: "2026-10-05" };
  const linked = [
    { id: "s1", name: "Spotify", brand_domain: "spotify.com" },
    { id: "s2", name: "Old", inactive: true },
  ] as Subscription[];
  const entries: CreditEntry[] = [
    { id: "e2", wallet: "w1", user: "u1", type: "balance", amount: 500, date: "2026-10-02", notes: "checked" },
    { id: "e1", wallet: "w1", user: "u1", type: "topup", amount: 1000, date: "2026-10-01" },
  ];
  const handlers = () => ({
    onTopUp: vi.fn(),
    onSetBalance: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDeleteEntry: vi.fn(),
  });

  it("shows balance, run-out, charges, linked subscriptions and history", () => {
    const h = handlers();
    const forecast = forecastWallet({
      entries: [{ type: "topup", amount: 1000, date: "2026-10-01" }],
      subscriptions: [spotify],
      today: "2026-10-03",
    });
    render(<WalletCard wallet={wallet} forecast={forecast} currency={thb} linked={linked} entries={entries} {...h} />);
    expect(screen.getByText("1,000.00 ฿")).toBeInTheDocument();
    expect(screen.getByText("runs_out_on:05-01-27 · in_days:94 · short_by:116.00 ฿")).toBeInTheDocument();
    expect(screen.getByText("1,000.00 ฿ · 01-10-26")).toBeInTheDocument();
    expect(screen.getAllByText("279.00 ฿").length).toBeGreaterThan(0);
    const charges = within(screen.getByText("next_charges").parentElement as HTMLElement).getAllByRole("listitem");
    expect(charges).toHaveLength(3);
    expect(charges[0]).toHaveTextContent("05-10-26 · Spotify");
    expect(screen.getByText("Old").closest("li")).toHaveClass("opacity-50");
    expect(screen.getByLabelText("credit_alerts")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "top_up" }));
    fireEvent.click(screen.getByRole("button", { name: "set_balance" }));
    fireEvent.click(screen.getByRole("button", { name: "edit_wallet" }));
    fireEvent.click(screen.getByRole("button", { name: "delete_wallet" }));
    expect(h.onTopUp).toHaveBeenCalled();
    expect(h.onSetBalance).toHaveBeenCalled();
    expect(h.onEdit).toHaveBeenCalled();
    expect(h.onDelete).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /credit_history/ }));
    const history = within(screen.getByRole("list", { name: "credit_history" })).getAllByRole("listitem");
    expect(history[0]).toHaveTextContent("02-10-26 · entry_balance · =500.00 ฿");
    expect(history[0]).toHaveTextContent("checked");
    expect(history[1]).toHaveTextContent("+1,000.00 ฿");
    fireEvent.click(within(history[1]).getByRole("button", { name: "delete_entry" }));
    expect(h.onDeleteEntry).toHaveBeenCalledWith(entries[1]);
  });

  it("colours urgent and failing wallets and words past and same-day run-outs", () => {
    const forecast = forecastWallet({
      entries: [{ type: "topup", amount: 300, date: "2026-10-01" }],
      subscriptions: [spotify],
      today: "2026-10-03",
    });
    const { rerender } = render(
      <WalletCard wallet={{ ...wallet, alerts: false }} forecast={forecast} linked={[]} entries={[]} {...handlers()} />,
    );
    expect(screen.getByText("runs_out_on:05-11-26 · in_days:33 · short_by:258.00")).toHaveClass("text-muted-foreground");
    expect(screen.queryByLabelText("credit_alerts")).not.toBeInTheDocument();
    expect(screen.getByText("no_linked_subscriptions")).toBeInTheDocument();
    // The charge that fails is shown in red.
    expect(screen.getAllByRole("listitem")[1]).toHaveClass("text-destructive");

    rerender(
      <WalletCard wallet={wallet} forecast={{ ...forecast, daysLeft: 20 }} linked={[]} entries={[]} {...handlers()} />,
    );
    expect(screen.getByText(/in_days:20/)).toHaveClass("text-amber-600");
    rerender(<WalletCard wallet={wallet} forecast={{ ...forecast, daysLeft: 0 }} linked={[]} entries={[]} {...handlers()} />);
    expect(screen.getByText(/· today ·/)).toHaveClass("text-destructive");
    rerender(<WalletCard wallet={wallet} forecast={{ ...forecast, daysLeft: -3 }} linked={[]} entries={[]} {...handlers()} />);
    expect(screen.getByText(/ran_out_on:05-11-26 · credit_days_ago:3/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /credit_history/ }));
    expect(screen.getByText("no_credit_entries")).toBeInTheDocument();
  });

  it("explains empty and long-lasting wallets", () => {
    const empty = forecastWallet({ today: "2026-10-03" });
    const { rerender } = render(
      <WalletCard wallet={wallet} forecast={empty} currency={thb} linked={[]} entries={[]} {...handlers()} />,
    );
    expect(screen.getByText("credit_needs_entry")).toBeInTheDocument();
    expect(screen.getByText("no_upcoming_charges")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(1);

    const plenty = forecastWallet({
      entries: [{ type: "topup", amount: 99999, date: "2026-10-01" }],
      subscriptions: [spotify],
      today: "2026-10-03",
    });
    rerender(<WalletCard wallet={wallet} forecast={plenty} currency={thb} linked={[]} entries={[]} {...handlers()} />);
    expect(screen.getByText("enough_for_horizon")).toBeInTheDocument();
  });
});
