import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PiggyBank } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { creditWalletsService } from "@/services/creditWallets";
import type { CreditWallet, Currency } from "@/types";

/** Creates or edits a credit wallet: which account it covers and in what currency. */
export function WalletDialog({
  wallet,
  userId,
  currencies,
  accountOptions,
  onClose,
}: {
  /** Absent when creating. */
  wallet?: CreditWallet;
  userId: string;
  currencies: Currency[];
  /** Payment accounts used by the user's subscriptions, offered as suggestions. */
  accountOptions: string[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mainCurrency = currencies.find((c) => c.is_main);

  const [name, setName] = useState(wallet?.name ?? "");
  const [account, setAccount] = useState(wallet?.account ?? "");
  const [currency, setCurrency] = useState(wallet?.currency || mainCurrency?.id || "");
  const [alerts, setAlerts] = useState(wallet?.alerts ?? true);
  const [notes, setNotes] = useState(wallet?.notes ?? "");

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = {
        name: name.trim(),
        account: account.trim(),
        currency,
        alerts,
        notes: notes.trim(),
      };
      return wallet
        ? creditWalletsService.update(wallet.id, data)
        : creditWalletsService.create({ ...data, user: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.credit.wallets(userId) });
      toast.success(t("wallet_saved"));
      onClose();
    },
    onError: () => toast.error(t("unknown_error")),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[96vw] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" aria-hidden />
            {wallet ? t("edit_wallet") : t("add_wallet")}
          </DialogTitle>
          <DialogDescription>{t("wallet_account_hint")}</DialogDescription>
        </DialogHeader>

        <form aria-label={wallet ? t("edit_wallet") : t("add_wallet")} className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="wallet-account">{t("wallet_account")}</Label>
            <Input
              id="wallet-account"
              list="wallet-account-options"
              required
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
            <datalist id="wallet-account-options">
              {accountOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wallet-name">{t("wallet_name")}</Label>
            <Input
              id="wallet-name"
              required
              placeholder={t("wallet_name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wallet-currency">{t("wallet_currency")}</Label>
            <select
              id="wallet-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2">
            <div>
              <Label htmlFor="wallet-alerts">{t("credit_alerts")}</Label>
              <p className="text-xs text-muted-foreground">{t("credit_alerts_hint")}</p>
            </div>
            <Switch id="wallet-alerts" checked={alerts} onCheckedChange={setAlerts} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wallet-notes">{t("notes")}</Label>
            <Textarea
              id="wallet-notes"
              rows={2}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || !name.trim() || !account.trim()}>
              {saveMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
