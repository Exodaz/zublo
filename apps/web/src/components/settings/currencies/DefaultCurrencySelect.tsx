import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toast";
import { usersService } from "@/services/users";
import type { Currency } from "@/types";

/** Currency preselected for new subscriptions (users.default_currency); "" = main. */
export function DefaultCurrencySelect({ currencies }: { currencies: Currency[] }) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  const saveMutation = useMutation({
    mutationFn: (id: string) => usersService.update(user!.id, { default_currency: id }),
    onSuccess: () => {
      void refreshUser();
      toast.success(t("saved"));
    },
    onError: () => toast.error(t("unknown_error")),
  });

  // A default that was deleted reads as "main currency".
  const value = currencies.some((c) => c.id === user?.default_currency) ? user!.default_currency! : "";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
      <div>
        <Label htmlFor="default-currency">{t("default_new_currency")}</Label>
        <p className="text-sm text-muted-foreground">{t("default_new_currency_hint")}</p>
      </div>
      <select
        id="default-currency"
        value={value}
        disabled={!user || saveMutation.isPending}
        onChange={(e) => saveMutation.mutate(e.target.value)}
        className="h-10 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">{t("main_currency_option")}</option>
        {currencies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.symbol} {c.code}
          </option>
        ))}
      </select>
    </div>
  );
}
