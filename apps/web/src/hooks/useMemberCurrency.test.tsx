import { renderHook, waitFor } from "@testing-library/react";

import { createQueryClientWrapper } from "@/test/query-client";

const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/services/currencies", () => ({ currenciesService: { list: mocks.list } }));

import { useMemberCurrency } from "./useMemberCurrency";

const thb = { id: "thb", code: "THB", symbol: "฿", rate: 1, is_main: true, name: "Baht", user: "u" };
const try_ = { id: "try", code: "TRY", symbol: "₺", rate: 1.2, is_main: false, name: "Lira", user: "u" };

describe("useMemberCurrency", () => {
  beforeEach(() => mocks.list.mockResolvedValue([try_, thb]));

  function run(...args: Parameters<typeof useMemberCurrency>) {
    const { Wrapper } = createQueryClientWrapper();
    return renderHook(() => useMemberCurrency(...args), { wrapper: Wrapper });
  }

  it("falls back to the main currency", async () => {
    const { result } = run({}, "u");
    await waitFor(() => expect(result.current.memberCurrency).toBe(thb));
    expect(result.current.mainCurrency).toBe(thb);
    expect(result.current.currencies).toHaveLength(2);
  });

  it("uses the subscription's member currency, or an override", async () => {
    const { result } = run({ member_currency: "try" }, "u");
    await waitFor(() => expect(result.current.memberCurrency).toBe(try_));
    const override = run({ member_currency: "try" }, "u", "thb");
    await waitFor(() => expect(override.result.current.memberCurrency).toBe(thb));
    // An unknown id falls back to the expanded relation.
    const expanded = run({ member_currency: "gone", expand: { member_currency: try_ } }, "u");
    await waitFor(() => expect(expanded.result.current.memberCurrency).toBe(try_));
  });

  it("does not fetch without a user", () => {
    mocks.list.mockClear();
    const { result } = run(undefined, "");
    expect(result.current.memberCurrency).toBeUndefined();
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
