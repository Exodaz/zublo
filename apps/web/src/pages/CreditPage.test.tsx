import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createQueryClientWrapper } from "@/test/query-client";

const mocks = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  listWallets: vi.fn(),
  createWallet: vi.fn(),
  deleteWallet: vi.fn(),
  listEntries: vi.fn(),
  deleteEntry: vi.fn(),
  listSubs: vi.fn(),
  listCurrencies: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/services/creditWallets", () => ({
  creditWalletsService: { list: mocks.listWallets, create: mocks.createWallet, delete: mocks.deleteWallet },
  creditEntriesService: { listForUser: mocks.listEntries, delete: mocks.deleteEntry },
}));
vi.mock("@/services/subscriptions", () => ({ subscriptionsService: { list: mocks.listSubs } }));
vi.mock("@/services/currencies", () => ({ currenciesService: { list: mocks.listCurrencies } }));
vi.mock("@/lib/toast", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));
vi.mock("@/components/credit/WalletList", () => ({
  WalletList: (props: {
    rows: {
      wallet: { id: string; name: string };
      forecast: { balance: number; runOutDate: string | null };
      currency?: { code: string };
      linked: { name: string }[];
      entries: { id: string }[];
    }[];
    onTopUp: (wallet: unknown) => void;
    onSetBalance: (wallet: unknown) => void;
    onEdit: (wallet: unknown) => void;
    onDelete: (wallet: unknown) => void;
    onDeleteEntry: (entry: { id: string }) => void;
  }) => (
    <div>
      {props.rows.map((row) => (
        <section key={row.wallet.id} aria-label={row.wallet.name}>
          <span>
            card:{row.wallet.name}:{row.forecast.balance}:{String(row.forecast.runOutDate)}:{row.currency?.code}:
            {row.linked.map((s) => s.name).join("+")}:{row.entries.length}
          </span>
          <button type="button" onClick={() => props.onTopUp(row.wallet)}>topup-{row.wallet.id}</button>
          <button type="button" onClick={() => props.onSetBalance(row.wallet)}>balance-{row.wallet.id}</button>
          <button type="button" onClick={() => props.onEdit(row.wallet)}>edit-{row.wallet.id}</button>
          <button type="button" onClick={() => props.onDelete(row.wallet)}>delete-{row.wallet.id}</button>
          <button type="button" onClick={() => props.onDeleteEntry(row.entries[0])}>delete-entry-{row.wallet.id}</button>
        </section>
      ))}
    </div>
  ),
}));
vi.mock("@/components/credit/WalletDialog", () => ({
  WalletDialog: ({ wallet, accountOptions, onClose }: { wallet?: { name: string }; accountOptions: string[]; onClose: () => void }) => (
    <div>
      wallet-dialog:{wallet?.name ?? "new"}:{accountOptions.join("+")}
      <button type="button" onClick={onClose}>close-wallet</button>
    </div>
  ),
}));
vi.mock("@/components/credit/CreditEntryDialog", () => ({
  CreditEntryDialog: ({ wallet, type, symbol, onClose }: { wallet: { name: string }; type: string; symbol: string; onClose: () => void }) => (
    <div>
      entry-dialog:{wallet.name}:{type}:{symbol}
      <button type="button" onClick={onClose}>close-entry</button>
    </div>
  ),
}));
vi.mock("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    onConfirm,
    onOpenChange,
  }: {
    open: boolean;
    title: string;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div>
        confirm:{title}
        <button type="button" onClick={onConfirm}>confirm</button>
        <button type="button" onClick={() => onOpenChange(true)}>keep-open</button>
        <button type="button" onClick={() => onOpenChange(false)}>dismiss</button>
      </div>
    ) : null,
}));

import { CreditPage } from "./CreditPage";

const thb = { id: "thb", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "user-1" };
const usd = { id: "usd", name: "Dollar", symbol: "$", code: "USD", rate: 0.03, is_main: false, user: "user-1" };
const appStore = { id: "pm", name: "App Store Credit" };
const monthly = { id: "m", name: "Monthly" };

function renderPage() {
  const { Wrapper } = createQueryClientWrapper();
  render(<CreditPage />, { wrapper: Wrapper });
}

describe("CreditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 3, 12));
    mocks.user = { id: "user-1" };
    mocks.listWallets.mockResolvedValue([
      { id: "w1", name: "Family", account: "me@apple", user: "user-1", alerts: true, expand: { currency: thb } },
      { id: "w2", name: "Dollars", account: "us@apple", user: "user-1", alerts: true },
    ]);
    mocks.listEntries.mockResolvedValue([
      { id: "e1", wallet: "w1", user: "user-1", type: "topup", amount: 1000, date: "2026-10-01" },
    ]);
    mocks.listSubs.mockResolvedValue([
      { id: "s1", name: "Spotify", price: 279, frequency: 1, next_payment: "2026-10-05", payment_account: "Me@Apple", expand: { currency: thb, cycle: monthly, payment_method: appStore } },
      { id: "s2", name: "Kid", price: 99, frequency: 1, next_payment: "2026-10-05", payment_account: "kid@apple", expand: { cycle: monthly, payment_method: appStore } },
    ]);
    mocks.listCurrencies.mockResolvedValue([thb, usd]);
  });
  afterEach(() => vi.useRealTimers());

  it("forecasts each wallet from its entries and linked subscriptions", async () => {
    renderPage();
    expect(await screen.findByText(/card:Family:1000:2027-01-05:THB:Spotify:1/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/card:Dollars:0:null:THB::0/)).toBeInTheDocument());
    // Family runs out first, so it is listed before Dollars (no top-up yet).
    expect(screen.getAllByRole("region").map((el) => el.getAttribute("aria-label"))).toEqual(["Family", "Dollars"]);
  });

  it("opens the wallet and entry dialogs", async () => {
    renderPage();
    await screen.findByText(/card:Family/);

    fireEvent.click(screen.getByRole("button", { name: "add_wallet" }));
    expect(screen.getByText(/wallet-dialog:new:kid@apple\+Me@Apple/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close-wallet" }));
    fireEvent.click(screen.getByRole("button", { name: "edit-w1" }));
    expect(screen.getByText(/wallet-dialog:Family/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close-wallet" }));
    expect(screen.queryByText(/wallet-dialog/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "topup-w1" }));
    expect(screen.getByText("entry-dialog:Family:topup:฿")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close-entry" }));
    fireEvent.click(screen.getByRole("button", { name: "balance-w2" }));
    expect(screen.getByText("entry-dialog:Dollars:balance:฿")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "close-entry" }));
    expect(screen.queryByText(/entry-dialog/)).not.toBeInTheDocument();
  });

  it("records entries without any known currency", async () => {
    mocks.listCurrencies.mockResolvedValue([]);
    renderPage();
    await screen.findByText(/card:Dollars/);
    fireEvent.click(screen.getByRole("button", { name: "topup-w2" }));
    expect(screen.getByText("entry-dialog:Dollars:topup:")).toBeInTheDocument();
  });

  it("deletes wallets and entries after confirmation", async () => {
    mocks.deleteWallet.mockResolvedValue(true);
    mocks.deleteEntry.mockRejectedValue(new Error("nope"));
    renderPage();
    await screen.findByText(/card:Family/);

    fireEvent.click(screen.getByRole("button", { name: "delete-w1" }));
    fireEvent.click(screen.getByRole("button", { name: "keep-open" }));
    expect(screen.getByText("confirm:delete_wallet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("wallet_deleted"));
    expect(mocks.deleteWallet).toHaveBeenCalledWith("w1");
    fireEvent.click(screen.getByRole("button", { name: "dismiss" }));

    fireEvent.click(screen.getByRole("button", { name: "delete-entry-w1" }));
    expect(screen.getByText("confirm:delete_entry")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("unknown_error"));
    expect(mocks.deleteEntry).toHaveBeenCalledWith("e1");

    mocks.deleteEntry.mockResolvedValue(true);
    fireEvent.click(screen.getByRole("button", { name: "confirm" }));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("entry_deleted"));
  });

  it("creates the missing wallets from payment accounts", async () => {
    mocks.createWallet.mockResolvedValue({});
    renderPage();
    await screen.findByText(/card:Family/);
    fireEvent.click(screen.getByRole("button", { name: "create_wallets_from_accounts" }));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("wallets_created:1"));
    expect(mocks.createWallet).toHaveBeenCalledWith({
      user: "user-1",
      name: "kid@apple",
      account: "kid@apple",
      currency: "thb",
      alerts: true,
    });
  });

  it("offers wallets from payment accounts when there are none, and reports failures", async () => {
    mocks.listWallets.mockResolvedValue([]);
    mocks.listCurrencies.mockResolvedValue([]);
    mocks.createWallet.mockRejectedValue(new Error("nope"));
    renderPage();
    expect(await screen.findByText("no_wallets")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "create_wallets_from_accounts (2)" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("unknown_error"));
    expect(mocks.createWallet.mock.calls[0][0]).toMatchObject({ account: "kid@apple", currency: "" });
  });

  it("shows the empty state without suggestions or a user", async () => {
    mocks.listWallets.mockResolvedValue([]);
    mocks.listSubs.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText("no_wallets")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create_wallets_from_accounts/ })).not.toBeInTheDocument();

    mocks.user = null;
    renderPage();
    expect(mocks.listWallets).toHaveBeenCalledTimes(1);
  });
});
