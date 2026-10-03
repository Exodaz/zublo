const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  getFullList: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  filter: vi.fn((query: string, params: Record<string, string>) => `${query}|${params.userId}`),
}));

vi.mock("@/lib/pb", () => ({
  default: {
    collection: (name: string) => {
      mocks.collection(name);
      return { getFullList: mocks.getFullList, create: mocks.create, update: mocks.update, delete: mocks.remove };
    },
    filter: mocks.filter,
  },
}));

import { creditEntriesService, creditWalletsService } from "./creditWallets";

describe("creditWalletsService", () => {
  it("lists, creates, updates and deletes wallets", async () => {
    await creditWalletsService.list("u1");
    expect(mocks.collection).toHaveBeenLastCalledWith("credit_wallets");
    expect(mocks.getFullList).toHaveBeenLastCalledWith({
      filter: "user = {:userId}|u1",
      sort: "name",
      expand: "currency",
    });
    await creditWalletsService.create({ name: "A" });
    expect(mocks.create).toHaveBeenLastCalledWith({ name: "A" });
    await creditWalletsService.update("w1", { alerts: false });
    expect(mocks.update).toHaveBeenLastCalledWith("w1", { alerts: false });
    await creditWalletsService.delete("w1");
    expect(mocks.remove).toHaveBeenLastCalledWith("w1");
  });
});

describe("creditEntriesService", () => {
  it("lists newest first, creates and deletes entries", async () => {
    await creditEntriesService.listForUser("u1");
    expect(mocks.collection).toHaveBeenLastCalledWith("credit_entries");
    expect(mocks.getFullList).toHaveBeenLastCalledWith({ filter: "user = {:userId}|u1", sort: "-date,-created" });
    const entry = { wallet: "w1", user: "u1", type: "topup" as const, amount: 1000, date: "2026-10-01" };
    await creditEntriesService.create(entry);
    expect(mocks.create).toHaveBeenLastCalledWith(entry);
    await creditEntriesService.delete("e1");
    expect(mocks.remove).toHaveBeenLastCalledWith("e1");
  });
});
