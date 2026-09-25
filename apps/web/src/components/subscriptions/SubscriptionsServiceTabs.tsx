import { Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

import { brandLogoUrl } from "@/lib/brandLogo";
import { OTHER_SERVICE, type ServiceGroup } from "@/lib/serviceGroups";
import { cn } from "@/lib/utils";

/** A service's logo, or nothing when the image cannot load. */
export function ServiceIcon({ serviceKey, className }: { serviceKey: string; className?: string }) {
  const src = serviceKey === OTHER_SERVICE ? null : brandLogoUrl(serviceKey, 64);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={cn("h-5 w-5 shrink-0 rounded object-contain", className)}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

interface Props {
  groups: ServiceGroup[];
  total: number;
  /** Selected service key, or null for all services. */
  selected: string | null;
  grouped: boolean;
  onSelect: (key: string | null) => void;
  onToggleGrouped: () => void;
}

/**
 * One tab per service (built from the subscriptions themselves) plus a switch
 * that shows the list grouped under a header per service.
 */
export function SubscriptionsServiceTabs({
  groups,
  total,
  selected,
  grouped,
  onSelect,
  onToggleGrouped,
}: Props) {
  const { t } = useTranslation();

  const tabClass = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-transparent bg-background/50 text-muted-foreground hover:border-border hover:bg-accent/60",
    );

  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-card/40 p-2 shadow-sm backdrop-blur-md">
      <div
        role="tablist"
        aria-label={t("services")}
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selected === null}
          className={tabClass(selected === null)}
          onClick={() => onSelect(null)}
        >
          {t("all")}
          <span className="text-xs opacity-70">{total}</span>
        </button>
        {groups.map((group) => (
          <button
            key={group.key || "other"}
            type="button"
            role="tab"
            aria-selected={selected === group.key}
            className={tabClass(selected === group.key)}
            onClick={() => onSelect(group.key)}
          >
            <ServiceIcon serviceKey={group.key} className="h-4 w-4" />
            {group.key === OTHER_SERVICE ? t("other_services") : group.label}
            <span className="text-xs opacity-70">{group.subscriptions.length}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={grouped}
        title={t("group_by_service")}
        className={cn(tabClass(grouped), "gap-1.5")}
        onClick={onToggleGrouped}
      >
        <Layers className="h-4 w-4" />
        <span className="hidden sm:inline">{t("group_by_service")}</span>
      </button>
    </div>
  );
}
