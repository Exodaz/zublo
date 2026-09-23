import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { queryKeys } from "@/lib/queryKeys";
import { createQueryClientWrapper } from "@/test/query-client";
import type { Subscription, SubscriptionMember } from "@/types";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
  }),
}));

vi.mock("@/services/subscriptionMembers", () => ({
  subscriptionMembersService: {
    create: mocks.create,
    update: mocks.update,
    delete: mocks.remove,
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    formatPrice: (value: number, symbol: string) => `${value.toFixed(2)} ${symbol}`,
    formatDate: (value: string) => `date(${value})`,
  };
});

// Rendered unconditionally so both the open and the closed state can be driven.
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
        keep-delete-open
      </button>
    </div>
  ),
}));

import { SubscriptionMembersDialog } from "./SubscriptionMembersDialog";

function getSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "Netflix",
    price: 15,
    currency: "cur-1",
    frequency: 1,
    cycle: "monthly",
    next_payment: "2026-10-01",
    auto_renew: true,
    start_date: "2026-01-01",
    notify: true,
    notify_days_before: 3,
    inactive: false,
    user: "user-1",
    expand: {
      currency: { id: "cur-1", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "user-1" },
    },
    ...overrides,
  };
}

function member(overrides: Partial<SubscriptionMember>): SubscriptionMember {
  return { id: "m", subscription: "sub-1", user: "user-1", name: "Member", ...overrides };
}

// Today is pinned to 2026-09-23 (see beforeEach).
const MEMBERS: SubscriptionMember[] = [
  member({ id: "m-eve", name: "Eve" }),
  member({ id: "m-dan", name: "Dan", expires_at: "2026-12-01 00:00:00.000Z", amount: 0 }),
  member({ id: "m-frank", name: "Frank" }),
  member({ id: "m-carol", name: "Carol", expires_at: "2026-09-26 00:00:00.000Z", amount: 50 }),
  member({
    id: "m-alice",
    name: "Alice",
    email: "alice@example.com",
    amount: 100,
    expires_at: "2026-09-20 00:00:00.000Z",
    notes: "Paid by transfer",
  }),
  member({ id: "m-bob", name: "Bob", expires_at: "2026-09-23 00:00:00.000Z" }),
];

function renderDialog(props: { sub?: Subscription; members?: SubscriptionMember[] } = {}) {
  const onClose = vi.fn();
  const { client, Wrapper } = createQueryClientWrapper();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <SubscriptionMembersDialog
      sub={props.sub ?? getSubscription()}
      userId="user-1"
      members={props.members ?? MEMBERS}
      onClose={onClose}
    />,
    { wrapper: Wrapper },
  );
  return { onClose, invalidate };
}

function rows() {
  return screen.getAllByRole("listitem");
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("SubscriptionMembersDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 23, 12, 0));
    mocks.create.mockResolvedValue({});
    mocks.update.mockResolvedValue({});
    mocks.remove.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists members soonest expiry first with their status, amount and contact", () => {
    renderDialog();

    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("members_summary:6,150.00 ฿")).toBeInTheDocument();
    expect(rows().map((row) => within(row).getByText(/^[A-Z][a-z]+$/).textContent)).toEqual([
      "Alice",
      "Bob",
      "Carol",
      "Dan",
      "Eve",
      "Frank",
    ]);

    const [alice, bob, carol, dan, eve] = rows();
    expect(within(alice).getByText("member_expired")).toBeInTheDocument();
    expect(within(alice).getByText("100.00 ฿")).toBeInTheDocument();
    expect(within(alice).getByText("date(2026-09-20)")).toBeInTheDocument();
    expect(within(alice).getByText("Paid by transfer")).toBeInTheDocument();
    expect(within(alice).getByRole("link")).toHaveAttribute("href", "mailto:alice@example.com");
    expect(within(bob).getByText("member_expires_today")).toBeInTheDocument();
    expect(within(carol).getByText("member_expires_in_days:3")).toBeInTheDocument();
    expect(within(dan).getByText("member_active")).toBeInTheDocument();
    expect(within(dan).queryByText(/฿/)).not.toBeInTheDocument();
    expect(within(eve).getByText("member_no_expiry")).toBeInTheDocument();
    expect(within(eve).queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows the empty state until the add form is opened", () => {
    renderDialog({ sub: getSubscription({ expand: undefined }), members: [] });

    expect(screen.getByText("no_members")).toBeInTheDocument();
    expect(screen.queryByText(/members_summary/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add_member/ }));
    expect(screen.queryByText("no_members")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.getByText("no_members")).toBeInTheDocument();
  });

  it("adds a member through the form", async () => {
    const { invalidate } = renderDialog({ members: [] });

    fireEvent.click(screen.getByRole("button", { name: /add_member/ }));
    const save = screen.getByRole("button", { name: "save" });
    expect(save).toBeDisabled();

    fill("name *", "  Grace  ");
    fill("email", " grace@example.com ");
    fill("member_amount", "12.5");
    fill("member_expires_at", "2026-10-31");
    fill("notes", " family ");
    expect(save).toBeEnabled();
    fireEvent.click(save);

    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("member_saved"));
    expect(mocks.create).toHaveBeenCalledWith("user-1", "sub-1", {
      name: "Grace",
      email: "grace@example.com",
      amount: 12.5,
      expires_at: "2026-10-31",
      notes: "family",
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.subscriptions.members("user-1"),
    });
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("edits an existing member with its values prefilled", async () => {
    renderDialog();

    fireEvent.click(within(rows()[0]).getByRole("button", { name: "edit" }));
    expect(screen.getByLabelText("name *")).toHaveValue("Alice");
    expect(screen.getByLabelText("email")).toHaveValue("alice@example.com");
    expect(screen.getByLabelText("member_amount")).toHaveValue(100);
    expect(screen.getByLabelText("member_expires_at")).toHaveValue("2026-09-20");
    expect(screen.getByLabelText("notes")).toHaveValue("Paid by transfer");
    // The add button is hidden while a row is being edited.
    expect(screen.queryByRole("button", { name: /add_member/ })).not.toBeInTheDocument();

    fill("member_expires_at", "2026-10-20");
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith("m-alice", {
        name: "Alice",
        email: "alice@example.com",
        amount: 100,
        expires_at: "2026-10-20",
        notes: "Paid by transfer",
      }),
    );
  });

  it("edits a bare member, sending an empty amount as zero, and can cancel", async () => {
    renderDialog();

    fireEvent.click(within(rows()[4]).getByRole("button", { name: "edit" }));
    expect(screen.getByLabelText("name *")).toHaveValue("Eve");
    expect(screen.getByLabelText("email")).toHaveValue("");
    expect(screen.getByLabelText("member_amount")).toHaveValue(null);
    expect(screen.getByLabelText("member_expires_at")).toHaveValue("");
    expect(screen.getByLabelText("notes")).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(screen.queryByLabelText("name *")).not.toBeInTheDocument();

    fireEvent.click(within(rows()[4]).getByRole("button", { name: "edit" }));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith("m-eve", {
        name: "Eve",
        email: "",
        amount: 0,
        expires_at: "",
        notes: "",
      }),
    );
  });

  it("shows the saving state and reports save failures", async () => {
    let reject: (error: Error) => void = () => {};
    mocks.create.mockReturnValue(new Promise((_, r) => (reject = r)));
    renderDialog({ members: [] });

    fireEvent.click(screen.getByRole("button", { name: /add_member/ }));
    fill("name *", "Grace");
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "saving" })).toBeDisabled());
    reject(new Error("nope"));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("member_save_failed"));
    // The form stays open so the input is not lost.
    expect(screen.getByLabelText("name *")).toHaveValue("Grace");
  });

  it("deletes a member after confirmation", async () => {
    const { invalidate } = renderDialog();
    const confirm = screen.getByTestId("confirm");

    // Nothing selected yet: confirming is a no-op.
    fireEvent.click(within(confirm).getByText("confirm-delete"));
    expect(mocks.remove).not.toHaveBeenCalled();

    fireEvent.click(within(rows()[1]).getByRole("button", { name: "delete" }));
    expect(confirm).toHaveAttribute("data-open", "true");
    fireEvent.click(within(confirm).getByText("keep-delete-open"));
    expect(confirm).toHaveAttribute("data-open", "true");

    fireEvent.click(within(confirm).getByText("confirm-delete"));
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledWith("member_deleted"));
    expect(mocks.remove).toHaveBeenCalledWith("m-bob");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.subscriptions.members("user-1"),
    });

    fireEvent.click(within(confirm).getByText("close-delete"));
    expect(confirm).toHaveAttribute("data-open", "false");
  });

  it("reports delete failures", async () => {
    mocks.remove.mockRejectedValue(new Error("nope"));
    renderDialog();

    fireEvent.click(within(rows()[0]).getByRole("button", { name: "delete" }));
    fireEvent.click(screen.getByText("confirm-delete"));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("member_delete_failed"));
  });

  it("closes on escape", () => {
    const { onClose } = renderDialog();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});
