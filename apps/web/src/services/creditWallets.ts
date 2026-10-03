import pb from "@/lib/pb";
import type { CreditEntry, CreditWallet } from "@/types";

export const creditWalletsService = {
  list: (userId: string) =>
    pb.collection("credit_wallets").getFullList<CreditWallet>({
      filter: pb.filter("user = {:userId}", { userId }),
      sort: "name",
      expand: "currency",
    }),

  create: (data: Partial<CreditWallet>) => pb.collection("credit_wallets").create<CreditWallet>(data),

  update: (id: string, data: Partial<CreditWallet>) =>
    pb.collection("credit_wallets").update<CreditWallet>(id, data),

  /** Entries go with the wallet (cascade delete). */
  delete: (id: string) => pb.collection("credit_wallets").delete(id),
};

export const creditEntriesService = {
  /** Every entry of every wallet of the user, newest first. */
  listForUser: (userId: string) =>
    pb.collection("credit_entries").getFullList<CreditEntry>({
      filter: pb.filter("user = {:userId}", { userId }),
      sort: "-date,-created",
    }),

  create: (data: Omit<CreditEntry, "id" | "created">) =>
    pb.collection("credit_entries").create<CreditEntry>(data),

  delete: (id: string) => pb.collection("credit_entries").delete(id),
};
