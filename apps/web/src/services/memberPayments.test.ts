const mocks = vi.hoisted(() => ({
  getFullList: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  getToken: vi.fn(),
  getUrl: vi.fn(),
  filter: vi.fn(),
}));

vi.mock("@/lib/pb", () => ({
  default: {
    collection: () => ({ getFullList: mocks.getFullList, create: mocks.create, delete: mocks.remove }),
    filter: mocks.filter,
    files: { getToken: mocks.getToken, getUrl: mocks.getUrl },
  },
}));

import { memberPaymentsService } from "./memberPayments";

describe("memberPaymentsService", () => {
  it("lists a subscription's payments newest first", async () => {
    mocks.filter.mockReturnValue("filter:sub-1");
    await memberPaymentsService.listForSubscription("sub-1");
    expect(mocks.filter).toHaveBeenCalledWith("subscription = {:subscriptionId}", {
      subscriptionId: "sub-1",
    });
    expect(mocks.getFullList).toHaveBeenCalledWith({
      filter: "filter:sub-1",
      sort: "-paid_at,-created",
    });
  });

  it("lists every payment of the user newest first", async () => {
    mocks.filter.mockReturnValue("filter:user-1");
    await memberPaymentsService.listForUser("user-1");
    expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", { userId: "user-1" });
    expect(mocks.getFullList).toHaveBeenLastCalledWith({
      filter: "filter:user-1",
      sort: "-paid_at,-created",
    });
  });

  it("creates and deletes payments", async () => {
    const data = new FormData();
    await memberPaymentsService.create(data);
    await memberPaymentsService.delete("p-1");
    expect(mocks.create).toHaveBeenCalledWith(data);
    expect(mocks.remove).toHaveBeenCalledWith("p-1");
  });

  it("signs slip URLs with a file token", async () => {
    mocks.getToken.mockResolvedValue("tok");
    mocks.getUrl.mockReturnValue("/api/files/x/p-1/slip.pdf?token=tok");
    const payment = { id: "p-1", slip: "slip.pdf" } as never;

    await expect(memberPaymentsService.slipUrl(payment)).resolves.toBe(
      "/api/files/x/p-1/slip.pdf?token=tok",
    );
    expect(mocks.getUrl).toHaveBeenCalledWith(
      { collectionId: "member_payments", id: "p-1" },
      "slip.pdf",
      { token: "tok" },
    );
  });

  it("opens a safe slip link without a file token", async () => {
    mocks.getToken.mockClear();
    await expect(
      memberPaymentsService.slipUrl({ id: "p-3", slip_url: "https://line.me/s/x" } as never),
    ).resolves.toBe("https://line.me/s/x");
    await expect(
      memberPaymentsService.slipUrl({ id: "p-4", slip_url: "javascript:alert(1)" } as never),
    ).resolves.toBeNull();
    expect(mocks.getToken).not.toHaveBeenCalled();
  });

  it("has no slip URL without a slip", async () => {
    mocks.getToken.mockClear();
    await expect(memberPaymentsService.slipUrl({ id: "p-2" } as never)).resolves.toBeNull();
    expect(mocks.getToken).not.toHaveBeenCalled();
  });
});
