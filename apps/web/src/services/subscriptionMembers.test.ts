vi.mock("@/lib/pb", () => ({
  default: {
    collection: vi.fn(),
    filter: vi.fn(),
  },
}));

import pb from "@/lib/pb";

import { subscriptionMembersService } from "./subscriptionMembers";

describe("subscriptionMembersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the user's members, soonest expiry first", async () => {
    const getFullList = vi.fn().mockResolvedValue([]);
    (pb.filter as unknown as ReturnType<typeof vi.fn>).mockReturnValue("filter:user-1");
    (pb.collection as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ getFullList });

    await subscriptionMembersService.list("user-1");

    expect(pb.collection).toHaveBeenCalledWith("subscription_members");
    expect(pb.filter).toHaveBeenCalledWith("user = {:userId}", { userId: "user-1" });
    expect(getFullList).toHaveBeenCalledWith({
      filter: "filter:user-1",
      sort: "expires_at,name",
    });
  });

  it("creates members owned by the user and attached to the subscription, then updates and deletes", async () => {
    const create = vi.fn();
    const update = vi.fn();
    const remove = vi.fn();
    (pb.collection as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      create,
      update,
      delete: remove,
    });
    const data = { name: "Alice", email: "a@x.com", amount: 5, expires_at: "2026-10-01", notes: "" };

    await subscriptionMembersService.create("user-1", "sub-1", data);
    await subscriptionMembersService.update("m-1", data);
    await subscriptionMembersService.delete("m-1");

    expect(create).toHaveBeenCalledWith({ ...data, subscription: "sub-1", user: "user-1" });
    expect(update).toHaveBeenCalledWith("m-1", data);
    expect(remove).toHaveBeenCalledWith("m-1");
  });
});
