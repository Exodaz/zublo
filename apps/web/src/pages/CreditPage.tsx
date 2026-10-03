import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PiggyBank, Plus, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreditEntryDialog } from "@/components/credit/CreditEntryDialog";
import { WalletDialog } from "@/components/credit/WalletDialog";
import { WalletList } from "@/components/credit/WalletList";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  forecastWallet,
  knownAccounts,
  sortByUrgency,
  suggestedAccounts,
  toForecastEntries,
  walletSubscriptions,
} from "@/lib/creditForecast";
import { toIsoDate } from "@/lib/dateInput";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { creditEntriesService, creditWalletsService } from "@/services/creditWallets";
import { currenciesService } from "@/services/currencies";
import { subscriptionsService } from "@/services/subscriptions";
import type { CreditEntry, CreditWallet } from "@/types";

type Editing = { wallet?: CreditWallet } | null;
type Recording = { wallet: CreditWallet; type: CreditEntry["type"] } | null;
type Deleting = { kind: "wallet"; id: string } | { kind: "entry"; id: string } | null;

/** Prepaid credit (App Store Credit and the like): balance, run-out date and top-ups per account. */
export function CreditPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Editing>(null);
  const [recording, setRecording] = useState<Recording>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: queryKeys.credit.wallets(userId),
    queryFn: () => creditWalletsService.list(userId),
    enabled: !!userId,
  });
  const { data: entries = [] } = useQuery({
    queryKey: queryKeys.credit.entries(userId),
    queryFn: () => creditEntriesService.listForUser(userId),
    enabled: !!userId,
  });
  const { data: subscriptions = [] } = useQuery({
    queryKey: queryKeys.subscriptions.all(userId),
    queryFn: () => subscriptionsService.list(userId),
    enabled: !!userId,
  });
  const { data: currencies = [] } = useQuery({
    queryKey: queryKeys.currencies.all(userId),
    queryFn: () => currenciesService.list(userId),
    enabled: !!userId,
  });

  const mainCurrency = currencies.find((c) => c.is_main);
  const today = toIsoDate(new Date());

  const cards = useMemo(
    () =>
      sortByUrgency(wallets.map((wallet) => {
        const currency = wallet.expand?.currency ?? mainCurrency;
        const linked = walletSubscriptions(subscriptions, wallet.account, currency);
        const own = entries.filter((entry) => entry.wallet === wallet.id);
        return {
          wallet,
          currency,
          linked: linked.map((row) => row.sub),
          entries: own,
          forecast: forecastWallet({
            entries: toForecastEntries(own),
            subscriptions: linked.map((row) => row.forecast),
            today,
          }),
        };
      })),
    [wallets, subscriptions, entries, mainCurrency, today],
  );

  const suggestions = suggestedAccounts(subscriptions, wallets);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.credit.wallets(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.credit.entries(userId) });
  };

  const createFromAccounts = useMutation({
    mutationFn: async () => {
      for (const account of suggestions) {
        await creditWalletsService.create({
          user: userId,
          name: account,
          account,
          currency: mainCurrency?.id ?? "",
          alerts: true,
        });
      }
      return suggestions.length;
    },
    onSuccess: (count) => toast.success(t("wallets_created", { count })),
    onError: () => toast.error(t("unknown_error")),
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (target: NonNullable<Deleting>) =>
      target.kind === "wallet"
        ? creditWalletsService.delete(target.id)
        : creditEntriesService.delete(target.id),
    onSuccess: (_, target) => {
      invalidate();
      toast.success(target.kind === "wallet" ? t("wallet_deleted") : t("entry_deleted"));
    },
    onError: () => toast.error(t("unknown_error")),
  });

  const recordingCard = recording ? cards.find((card) => card.wallet.id === recording.wallet.id) : undefined;

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-6 fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <PiggyBank className="h-7 w-7 text-primary" aria-hidden />
            {t("credit")}
          </h1>
          <p className="max-w-2xl text-muted-foreground">{t("credit_desc")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {wallets.length > 0 && suggestions.length > 0 && (
            <Button variant="outline" disabled={createFromAccounts.isPending} onClick={() => createFromAccounts.mutate()}>
              <Wand2 className="mr-1.5 h-4 w-4" />
              {t("create_wallets_from_accounts")}
            </Button>
          )}
          <Button onClick={() => setEditing({})}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("add_wallet")}
          </Button>
        </div>
      </div>

      {!isLoading && wallets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <PiggyBank className="h-10 w-10 text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold">{t("no_wallets")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{t("no_wallets_desc")}</p>
          {suggestions.length > 0 && (
            <Button disabled={createFromAccounts.isPending} onClick={() => createFromAccounts.mutate()}>
              <Wand2 className="mr-1.5 h-4 w-4" />
              {t("create_wallets_from_accounts")} ({suggestions.length})
            </Button>
          )}
        </div>
      ) : (
        <WalletList
          rows={cards}
          onTopUp={(wallet) => setRecording({ wallet, type: "topup" })}
          onSetBalance={(wallet) => setRecording({ wallet, type: "balance" })}
          onEdit={(wallet) => setEditing({ wallet })}
          onDelete={(wallet) => setDeleting({ kind: "wallet", id: wallet.id })}
          onDeleteEntry={(entry) => setDeleting({ kind: "entry", id: entry.id })}
        />
      )}

      {editing && (
        <WalletDialog
          wallet={editing.wallet}
          userId={userId}
          currencies={currencies}
          accountOptions={knownAccounts(subscriptions)}
          onClose={() => setEditing(null)}
        />
      )}
      {recording && (
        <CreditEntryDialog
          wallet={recording.wallet}
          type={recording.type}
          userId={userId}
          symbol={recordingCard?.currency?.symbol ?? ""}
          onClose={() => setRecording(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting?.kind === "wallet" ? t("delete_wallet") : t("delete_entry")}
        description={deleting?.kind === "wallet" ? t("confirm_delete_wallet") : t("confirm_delete_entry")}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}
