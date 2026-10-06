import { Coins, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { Currency } from "@/types";

interface Props {
  selectedCount: number;
  visibleCount: number;
  deleting: boolean;
  currencies: Currency[];
  /** True while a bulk currency change is running. */
  updating: boolean;
  onSetCurrency: (currencyId: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Bulk actions while the Subscriptions page is in select mode. */
export function SubscriptionsSelectionBar({
  selectedCount,
  visibleCount,
  deleting,
  currencies,
  updating,
  onSetCurrency,
  onSelectAll,
  onClear,
  onDelete,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [currencyId, setCurrencyId] = useState("");

  return (
    <div
      role="toolbar"
      aria-label={t("select")}
      className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-card/95 p-2 shadow-md backdrop-blur-md"
    >
      <span className="px-2 text-sm font-semibold">
        {t("selected_count", { count: selectedCount })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSelectAll}
        disabled={visibleCount === 0 || selectedCount === visibleCount}
      >
        {t("select_all")}
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={selectedCount === 0}>
        {t("clear_selection")}
      </Button>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <select
          aria-label={t("currency")}
          value={currencyId}
          onChange={(e) => setCurrencyId(e.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">{t("currency")}…</option>
          {currencies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSetCurrency(currencyId)}
          disabled={selectedCount === 0 || !currencyId || updating}
        >
          <Coins className="mr-1.5 h-4 w-4" />
          {t("set_currency")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={selectedCount === 0 || deleting}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t("delete_selected")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          title={t("close")}
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
