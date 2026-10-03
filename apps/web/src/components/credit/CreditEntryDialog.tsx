import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Scale } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toIsoDate } from "@/lib/dateInput";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/lib/toast";
import { creditEntriesService } from "@/services/creditWallets";
import type { CreditEntry, CreditWallet } from "@/types";

/** Records a top-up, or the real balance read from the account. */
export function CreditEntryDialog({
  wallet,
  type,
  userId,
  symbol,
  onClose,
}: {
  wallet: CreditWallet;
  type: CreditEntry["type"];
  userId: string;
  symbol: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const title = type === "topup" ? t("top_up") : t("set_balance");

  const saveMutation = useMutation({
    mutationFn: () =>
      creditEntriesService.create({
        wallet: wallet.id,
        user: userId,
        type,
        amount: Number(amount),
        date,
        notes: notes.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.credit.entries(userId) });
      toast.success(t("entry_saved"));
      onClose();
    },
    onError: () => toast.error(t("unknown_error")),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const Icon = type === "topup" ? Plus : Scale;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
            {title}
          </DialogTitle>
          <DialogDescription>
            {wallet.name} · {type === "topup" ? t("top_up_hint") : t("set_balance_hint")}
          </DialogDescription>
        </DialogHeader>
        <form aria-label={title} className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="credit-date">{t("date")}</Label>
              <DateInput id="credit-date" value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credit-amount">
                {t("amount")} ({symbol})
              </Label>
              <Input
                id="credit-amount"
                type="number"
                min="0"
                step="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit-notes">{t("notes")}</Label>
            <Textarea
              id="credit-notes"
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
            <Button type="submit" disabled={saveMutation.isPending || amount === "" || !date}>
              {saveMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
