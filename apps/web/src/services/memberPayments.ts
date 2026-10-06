import pb from "@/lib/pb";
import { sanitizeHref } from "@/lib/utils";
import type { MemberPayment } from "@/types";

export const memberPaymentsService = {
  /** Payments of every member of a subscription, newest first. */
  listForSubscription: (subscriptionId: string) =>
    pb.collection("member_payments").getFullList<MemberPayment>({
      filter: pb.filter("subscription = {:subscriptionId}", { subscriptionId }),
      sort: "-paid_at,-created",
    }),

  /** Every payment of every member of the user, newest first. */
  listForUser: (userId: string) =>
    pb.collection("member_payments").getFullList<MemberPayment>({
      filter: pb.filter("user = {:userId}", { userId }),
      sort: "-paid_at,-created",
    }),

  /** The backend fills expires_before and, from period_months, expires_after. */
  create: (data: FormData) => pb.collection("member_payments").create<MemberPayment>(data),

  /** Deleting the latest payment restores the member's previous expiry date. */
  delete: (id: string) => pb.collection("member_payments").delete(id),

  /**
   * Where the slip opens: an uploaded file (protected, so its URL needs a
   * short-lived file token) wins over a link; only http(s) links are used.
   */
  slipUrl: async (payment: MemberPayment): Promise<string | null> => {
    if (!payment.slip) return sanitizeHref(payment.slip_url);
    const token = await pb.files.getToken();
    return pb.files.getUrl(
      { collectionId: "member_payments", id: payment.id } as Parameters<typeof pb.files.getUrl>[0],
      payment.slip,
      { token },
    );
  },
};
