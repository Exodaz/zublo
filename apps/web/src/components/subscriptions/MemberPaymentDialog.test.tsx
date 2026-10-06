import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { queryKeys } from "@/lib/queryKeys";
import { createQueryClientWrapper } from "@/test/query-client";
import type { Currency, MemberPayment, Subscription, SubscriptionMember } from "@/types";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  remove: vi.fn(),
  slipUrl: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  listCurrencies: vi.fn(),
}));

vi.mock("@/services/currencies", () => ({ currenciesService: { list: mocks.listCurrencies } }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));

vi.mock("@/services/memberPayments", () => ({
  memberPaymentsService: { create: mocks.create, delete: mocks.remove, slipUrl: mocks.slipUrl },
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    onConfirm,
    onOpenChange,
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="confirm" data-open={String(open)}>
      <button type="button" onClick={onConfirm}>
        confirm-delete
      </button>
      <button type="button" onClick={() => onOpenChange(false)}>
        close-delete
      </button>
      <button type="button" onClick={() => onOpenChange(true)}>
        keep-open
      </button>
    </div>
  ),
}));

import { MemberPaymentDialog } from "./MemberPaymentDialog";

const SUB = {
  id: "sub-1",
  name: "X1",
  expand: {
    currency: { id: "c", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "u" },
  },
} as Subscription;

function member(overrides: Partial<SubscriptionMember> = {}): SubscriptionMember {
  return {
    id: "m-1",
    subscription: "sub-1",
    user: "user-1",
    name: "A1",
    email: "test1@email.com",
    amount: 400,
    expires_at: "2027-03-14 00:00:00.000Z",
    ...overrides,
  };
}

function payment(overrides: Partial<MemberPayment> = {}): MemberPayment {
  return {
    id: "p-1",
    member: "m-1",
    subscription: "sub-1",
    user: "user-1",
    paid_at: "2026-09-01 00:00:00.000Z",
    amount: 400,
    period_months: 12,
    expires_before: "2026-03-14 00:00:00.000Z",
    expires_after: "2027-03-14 00:00:00.000Z",
    ...overrides,
  };
}

function renderDialog(
  props: { member?: SubscriptionMember; payments?: MemberPayment[]; sub?: Subscription; currency?: Currency } = {},
) {
  const onClose = vi.fn();
  const { client, Wrapper } = createQueryClientWrapper();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <MemberPaymentDialog
      sub={props.sub ?? SUB}
      member={props.member ?? member()}
      userId="user-1"
      payments={props.payments ?? []}
      currency={props.currency}
      onClose={onClose}
    />,
    { wrapper: Wrapper },
  );
  return { onClose, invalidate };
}

const expiryInput = () => screen.getByLabelText("new_expiry_date");
const lastForm = () => mocks.create.mock.calls.at(-1)![0] as FormData;

describe("MemberPaymentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
    mocks.create.mockImplementation(async (data: FormData) => ({
      expires_after: `${data.get("expires_after")} 00:00:00.000Z`,
    }));
    mocks.remove.mockResolvedValue(undefined);
    mocks.listCurrencies.mockResolvedValue([
      { id: "c", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "u" },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the member, group and current expiry, and defaults to one year from it", () => {
    renderDialog();

    expect(screen.getByText(/A1 · test1@email.com · X1/)).toBeInTheDocument();
    expect(screen.getByText("14-03-27")).toBeInTheDocument();
    expect(screen.getByLabelText("payment_date")).toHaveValue("01/10/2026");
    expect(screen.getByLabelText(/^amount \(/)).toHaveValue(400);
    expect(screen.getByRole("button", { name: "period_1_year" })).toHaveAttribute("aria-pressed", "true");
    expect(expiryInput()).toHaveValue("14/03/2028");
    expect(screen.getByText("expiry_from_hint")).toBeInTheDocument();
    expect(screen.getByText("no_payments")).toBeInTheDocument();
  });

  it("saves a yearly payment with slip and notes", async () => {
    const { invalidate } = renderDialog();
    const slip = new File(["%PDF"], "slip.pdf", { type: "application/pdf" });
    // Picking then clearing a file leaves no slip; picking again keeps it.
    fireEvent.change(screen.getByLabelText("slip"), { target: { files: [slip] } });
    fireEvent.change(screen.getByLabelText("slip"), { target: { files: [] } });
    fireEvent.change(screen.getByLabelText("slip"), { target: { files: [slip] } });
    fireEvent.change(screen.getByLabelText(/^amount \(/), { target: { value: "450" } });
    fireEvent.change(screen.getByLabelText("notes"), { target: { value: " transfer KBank " } });
    fireEvent.click(screen.getByRole("button", { name: "save_payment" }));

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("renewed_until:14-03-28"));
    const data = lastForm();
    expect(Object.fromEntries(["member", "subscription", "user", "paid_at", "amount", "period_months", "expires_after", "notes"].map((k) => [k, data.get(k)]))).toEqual({
      member: "m-1",
      subscription: "sub-1",
      user: "user-1",
      paid_at: "2026-10-01",
      amount: "450",
      period_months: "12",
      expires_after: "2028-03-14",
      notes: "transfer KBank",
    });
    expect(data.get("slip")).toBe(slip);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.subscriptions.members("user-1") });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.subscriptions.allMemberPayments("user-1"),
    });
  });

  it("recomputes the expiry for monthly and custom periods", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "period_1_month" }));
    expect(expiryInput()).toHaveValue("14/04/2027");

    fireEvent.click(screen.getByRole("button", { name: "period_custom" }));
    fireEvent.change(screen.getByLabelText("months"), { target: { value: "3" } });
    expect(expiryInput()).toHaveValue("14/06/2027");
  });

  it("keeps an expiry set by hand until recalculated or the payment date changes", async () => {
    renderDialog();

    fireEvent.change(expiryInput(), { target: { value: "31122027" } });
    expect(screen.getByText("expiry_set_manually")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "recalculate" }));
    expect(expiryInput()).toHaveValue("14/03/2028");
    expect(screen.queryByRole("button", { name: "recalculate" })).not.toBeInTheDocument();

    fireEvent.change(expiryInput(), { target: { value: "31122027" } });
    fireEvent.click(screen.getByRole("button", { name: "save_payment" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(lastForm().get("period_months")).toBe("0");
    expect(lastForm().get("expires_after")).toBe("2027-12-31");

    fireEvent.change(expiryInput(), { target: { value: "31122027" } });
    fireEvent.change(screen.getByLabelText("payment_date"), { target: { value: "02102026" } });
    expect(expiryInput()).toHaveValue("14/03/2028");
  });

  it("counts from the payment date without an expiry and remembers the custom period", async () => {
    renderDialog({
      member: member({ expires_at: "", amount: 0, renewal_months: 3 }),
      payments: [payment({ amount: 350 })],
    });

    expect(screen.getByRole("button", { name: "period_custom" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("months")).toHaveValue(3);
    expect(screen.getByLabelText(/^amount \(/)).toHaveValue(350);
    expect(expiryInput()).toHaveValue("01/01/2027");
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("starts on monthly when that was the last period, and omits an empty amount", async () => {
    renderDialog({ member: member({ amount: undefined, renewal_months: 1 }), sub: { id: "sub-1", name: "X1" } as Subscription });

    expect(screen.getByRole("button", { name: "period_1_month" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/^amount \(/)).toHaveValue(null);
    fireEvent.click(screen.getByRole("button", { name: "save_payment" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(lastForm().has("amount")).toBe(false);
    expect(lastForm().has("slip")).toBe(false);
    expect(lastForm().has("notes")).toBe(false);
  });

  it("cannot save without a period or expiry, and reports save errors", async () => {
    mocks.create.mockRejectedValue(new Error("nope"));
    renderDialog({ member: member({ expires_at: "", email: "" }) });

    fireEvent.click(screen.getByRole("button", { name: "period_custom" }));
    expect(screen.getByRole("button", { name: "save_payment" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("months"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "save_payment" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("payment_save_failed"));
  });

  it("shows the saving state", async () => {
    mocks.create.mockReturnValue(new Promise(() => {}));
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "save_payment" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "saving" })).toBeDisabled());
  });

  it("lists payment history with periods, slips and notes", async () => {
    const tab = { location: { href: "" }, close: vi.fn() };
    const open = vi.spyOn(window, "open").mockReturnValue(tab as never);
    mocks.slipUrl.mockResolvedValueOnce("/files/slip.pdf?token=t");
    renderDialog({
      payments: [
        payment({ id: "p-3", period_months: 3, slip: "slip.pdf", notes: "cash" }),
        payment({ id: "p-1", period_months: 1, amount: 0 }),
        payment({ id: "p-0", period_months: 0, expires_before: "" }),
        payment({ id: "p-12" }),
        payment({ id: "p-x", amount: undefined, period_months: undefined }),
      ],
    });

    const rows = within(screen.getByText("payment_history").closest("section") as HTMLElement).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("months_count:3");
    expect(rows[0]).toHaveTextContent("cash");
    expect(rows[1]).toHaveTextContent("period_1_month");
    expect(rows[1]).not.toHaveTextContent("฿");
    expect(rows[2]).toHaveTextContent("custom_date");
    expect(rows[3]).toHaveTextContent("period_1_year");
    expect(rows[3]).toHaveTextContent("14-03-26");
    expect(rows[4]).toHaveTextContent("custom_date");
    expect(rows[4]).not.toHaveTextContent("฿");

    fireEvent.click(within(rows[0]).getByRole("button", { name: /view_slip/ }));
    await waitFor(() => expect(tab.location.href).toBe("/files/slip.pdf?token=t"));
    expect(open).toHaveBeenCalledWith("", "_blank");

    // A failing token request closes the blank tab again.
    mocks.slipUrl.mockRejectedValueOnce(new Error("no token"));
    fireEvent.click(within(rows[0]).getByRole("button", { name: /view_slip/ }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("slip_open_failed"));
    expect(tab.close).toHaveBeenCalled();

    // A blocked popup does nothing.
    open.mockReturnValueOnce(null);
    mocks.slipUrl.mockResolvedValueOnce("/files/slip.pdf?token=t2");
    fireEvent.click(within(rows[0]).getByRole("button", { name: /view_slip/ }));
    await waitFor(() => expect(mocks.slipUrl).toHaveBeenCalledTimes(3));
    open.mockRestore();
  });

  it("deletes a payment after confirmation and reports failures", async () => {
    const { invalidate } = renderDialog({ payments: [payment()] });
    const confirm = screen.getByTestId("confirm");

    fireEvent.click(within(confirm).getByText("confirm-delete"));
    expect(mocks.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "delete_payment" }));
    expect(confirm).toHaveAttribute("data-open", "true");
    fireEvent.click(within(confirm).getByText("keep-open"));
    fireEvent.click(within(confirm).getByText("confirm-delete"));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("payment_deleted"));
    expect(mocks.remove).toHaveBeenCalledWith("p-1");
    expect(invalidate).toHaveBeenCalled();
    fireEvent.click(within(confirm).getByText("close-delete"));
    expect(confirm).toHaveAttribute("data-open", "false");

    mocks.remove.mockRejectedValue(new Error("nope"));
    fireEvent.click(screen.getByRole("button", { name: "delete_payment" }));
    fireEvent.click(within(confirm).getByText("confirm-delete"));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("payment_delete_failed"));
  });

  it("closes from the close button", () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("offers a six-month period and starts on it when that was the member's period", async () => {
    renderDialog({ member: member({ renewal_months: 6, expires_at: "2026-11-01" }) });
    expect(screen.getByRole("button", { name: "period_6_months" })).toHaveAttribute("aria-pressed", "true");
    expect(expiryInput()).toHaveValue("01/05/2027");
    expect(await screen.findByText("amount (฿)")).toBeInTheDocument();
  });

  it("uses the member currency given by the caller", () => {
    renderDialog({
      currency: { id: "t", name: "Lira", symbol: "₺", code: "TRY", rate: 1, is_main: false, user: "u" },
    });
    expect(screen.getByLabelText("amount (₺)")).toBeInTheDocument();
  });
});
