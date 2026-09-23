import pb from "@/lib/pb";
import type { SubscriptionMember } from "@/types";

export type SubscriptionMemberInput = Pick<
  SubscriptionMember,
  "name" | "email" | "amount" | "expires_at" | "notes"
>;

export const subscriptionMembersService = {
  /** Every member of every subscription owned by the user, soonest expiry first. */
  list: (userId: string) =>
    pb.collection("subscription_members").getFullList<SubscriptionMember>({
      filter: pb.filter("user = {:userId}", { userId }),
      sort: "expires_at,name",
    }),

  create: (userId: string, subscriptionId: string, data: SubscriptionMemberInput) =>
    pb.collection("subscription_members").create<SubscriptionMember>({
      ...data,
      subscription: subscriptionId,
      user: userId,
    }),

  update: (id: string, data: SubscriptionMemberInput) =>
    pb.collection("subscription_members").update<SubscriptionMember>(id, data),

  delete: (id: string) => pb.collection("subscription_members").delete(id),
};
