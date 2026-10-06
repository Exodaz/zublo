import { renderHook, waitFor } from "@testing-library/react";

import { createQueryClientWrapper } from "@/test/query-client";

const mocks = vi.hoisted(() => ({ members: vi.fn(), payments: vi.fn(), subs: vi.fn() }));
vi.mock("@/services/subscriptionMembers", () => ({ subscriptionMembersService: { list: mocks.members } }));
vi.mock("@/services/memberPayments", () => ({ memberPaymentsService: { listForUser: mocks.payments } }));
vi.mock("@/services/subscriptions", () => ({ subscriptionsService: { list: mocks.subs } }));

import { useMemberIncome } from "./useMemberIncome";

function run(userId: string) {
  const { Wrapper } = createQueryClientWrapper();
  return renderHook(() => useMemberIncome(userId), { wrapper: Wrapper });
}

describe("useMemberIncome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6, 12));
    mocks.subs.mockResolvedValue([{ id: "ms", name: "MS", frequency: 1, expand: { cycle: { name: "Yearly" } } }]);
    mocks.payments.mockResolvedValue([{ id: "p", member: "a", subscription: "ms", paid_at: "2026-10-01", amount: 400 }]);
  });
  afterEach(() => vi.useRealTimers());

  it("summarises member income once everything is loaded", async () => {
    mocks.members.mockResolvedValue([{ id: "a", subscription: "ms", name: "A", amount: 1200 }]);
    const { result } = run("u");
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({ expectedMonthly: 100, receivedThisMonth: 400, receivedCount: 1 });
  });

  it("has no data without members or a user", async () => {
    mocks.members.mockResolvedValue([]);
    const { result } = run("u");
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(run("").result.current.data).toBeUndefined();
  });
});
