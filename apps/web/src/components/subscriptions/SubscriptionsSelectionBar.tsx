import { Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface Props {
  selectedCount: number;
  visibleCount: number;
  deleting: boolean;
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
  onSelectAll,
  onClear,
  onDelete,
  onClose,
}: Props) {
  const { t } = useTranslation();

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
      <div className="ml-auto flex items-center gap-2">
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
