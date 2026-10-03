import { fireEvent, render, screen, within } from "@testing-library/react";

import { forecastWallet } from "@/lib/creditForecast";
import type { CreditEntry, CreditWallet, Currency } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));
vi.mock("@/components/credit/WalletCard", () => ({
  WalletCard: (props: {
    wallet: { name: string };
    onTopUp: () => void;
    onSetBalance: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onDeleteEntry: (entry: unknown) => void;
  }) => (
    <div>
      details:{props.wallet.name}
      <button type="button" onClick={props.onTopUp}>card-topup</button>
      <button type="button" onClick={props.onSetBalance}>card-balance</button>
      <button type="button" onClick={props.onEdit}>card-edit</button>
      <button type="button" onClick={props.onDelete}>card-delete</button>
      <button type="button" onClick={() => props.onDeleteEntry("e")}>card-delete-entry</button>
    </div>
  ),
}));

import { WalletList, type WalletRow } from "./WalletList";

const thb: Currency = { id: "thb", name: "Baht", code: "THB", symbol: "฿", rate: 1, is_main: true, user: "u" };
const spotify = { id: "s1", name: "Spotify", amount: 279, cycle: "Monthly", next_payment: "2026-10-05" };
const wallet = (id: string): CreditWallet => ({ id, name: `W-${id}`, account: `${id}@apple`, alerts: true, user: "u" });

function row(id: string, topup: number | null, currency: Currency | null = thb): WalletRow {
  return {
    wallet: wallet(id),
    currency: currency ?? undefined,
    linked: [],
    entries: [] as CreditEntry[],
    forecast: forecastWallet({
      entries: topup === null ? [] : [{ type: "topup", amount: topup, date: "2026-10-01" }],
      subscriptions: [spotify],
      today: "2026-10-03",
    }),
  };
}

function handlers() {
  return { onTopUp: vi.fn(), onSetBalance: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onDeleteEntry: vi.fn() };
}

describe("WalletList", () => {
  it("shows one row per wallet with balance, run-out and monthly cost", () => {
    const h = handlers();
    render(
      <WalletList
        rows={[row("a", 1000), row("b", 300), row("c", 100), row("d", null, null), row("e", 99999)]}
        {...h}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("W-a");
    expect(items[0]).toHaveTextContent("a@apple");
    expect(items[0]).toHaveTextContent("1,000.00 ฿");
    expect(items[0]).toHaveTextContent("05-01-27 (in_days:94)");
    expect(items[0]).toHaveTextContent("279.00 ฿");
    expect(within(items[1]).getByText("05-11-26 (in_days:33)")).toHaveClass("text-muted-foreground");
    expect(within(items[2]).getByText("05-10-26 (in_days:2)")).toHaveClass("text-destructive");
    expect(items[3]).toHaveTextContent("no_topup_yet");
    expect(items[4]).toHaveTextContent("lasts_2_years");

    fireEvent.click(within(items[1]).getByRole("button", { name: /top_up/ }));
    expect(h.onTopUp).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });

  it("words today, past and near run-outs", () => {
    const base = row("a", 300);
    render(
      <WalletList
        rows={[
          { ...base, forecast: { ...base.forecast, daysLeft: 0 } },
          { ...row("b", 300), forecast: { ...base.forecast, daysLeft: -4 } },
          { ...row("c", 300), forecast: { ...base.forecast, daysLeft: 20 } },
        ]}
        {...handlers()}
      />,
    );
    expect(screen.getByText("05-11-26 (today)")).toBeInTheDocument();
    expect(screen.getByText("05-11-26 (credit_days_ago:4)")).toBeInTheDocument();
    expect(screen.getByText("05-11-26 (in_days:20)")).toHaveClass("text-amber-600");
  });

  it("expands a row into its details and passes actions through", () => {
    const h = handlers();
    render(<WalletList rows={[row("a", 1000), row("b", 300)]} {...h} />);
    const toggle = screen.getByRole("button", { name: "wallet_details: W-a" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("details:W-a")).toBeInTheDocument();

    for (const name of ["card-topup", "card-balance", "card-edit", "card-delete", "card-delete-entry"]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    expect(h.onTopUp).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(h.onSetBalance).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(h.onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(h.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(h.onDeleteEntry).toHaveBeenCalledWith("e");

    // Opening another row closes the first; clicking again collapses it.
    fireEvent.click(screen.getByRole("button", { name: "wallet_details: W-b" }));
    expect(screen.queryByText("details:W-a")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "wallet_details: W-b" }));
    expect(screen.queryByText(/details:/)).not.toBeInTheDocument();
  });
});
