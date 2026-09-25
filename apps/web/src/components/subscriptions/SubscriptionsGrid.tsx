import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard";
import { ServiceIcon } from "@/components/subscriptions/SubscriptionsServiceTabs";
import { groupByService, OTHER_SERVICE } from "@/lib/serviceGroups";
import { formatPrice } from "@/lib/utils";
import type { Currency, Subscription, SubscriptionMember } from "@/types";

function SubscriptionsLoadingGrid({ layout }: { layout: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-[4.5rem] animate-pulse rounded-xl border bg-card/40 backdrop-blur-sm"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="h-36 rounded-2xl border bg-card/40 animate-pulse backdrop-blur-sm"
        />
      ))}
    </div>
  );
}

function SubscriptionsEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-dashed bg-card/30 p-12 text-center backdrop-blur-md">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Search className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-lg font-medium text-foreground">{t("no_subscriptions")}</p>
      <p className="mt-1 text-muted-foreground">{t("no_subscriptions_hint")}</p>
    </div>
  );
}

interface SubscriptionsGridProps {
  isLoading: boolean;
  subscriptions: Subscription[];
  layout?: "grid" | "list";
  mainCurrency?: Currency;
  convertCurrency?: boolean;
  showMonthly?: boolean;
  showProgress?: boolean;
  onEdit: (subscription: Subscription) => void;
  onClone: (id: string) => void;
  onRenew: (id: string) => void;
  onHistory: (subscription: Subscription) => void;
  onMembers: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onOpen?: (subscription: Subscription) => void;
  /** Family-sharing members keyed by subscription id. */
  membersBySubscription?: Record<string, SubscriptionMember[]>;
  /** Show a header per service with its subscriptions underneath. */
  groupByService?: boolean;
}

export function SubscriptionsGrid({
  isLoading,
  subscriptions,
  layout = "grid",
  mainCurrency,
  convertCurrency,
  showMonthly,
  showProgress,
  onEdit,
  onClone,
  onRenew,
  onHistory,
  onMembers,
  onDelete,
  onOpen,
  membersBySubscription = {},
  groupByService: grouped = false,
}: SubscriptionsGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <SubscriptionsLoadingGrid layout={layout} />;
  }

  if (subscriptions.length === 0) {
    return <SubscriptionsEmptyState />;
  }

  const containerClass =
    layout === "list" ? "space-y-2" : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";

  const renderCards = (items: Subscription[]) =>
    items.map((subscription) => (
        <SubscriptionCard
          key={subscription.id}
          sub={subscription}
          layout={layout}
          mainCurrency={mainCurrency}
          convertCurrency={convertCurrency}
          showMonthly={showMonthly}
          showProgress={showProgress}
          onEdit={() => onEdit(subscription)}
          onClone={() => onClone(subscription.id)}
          onRenew={() => onRenew(subscription.id)}
          onHistory={() => onHistory(subscription)}
          onMembers={() => onMembers(subscription)}
          onDelete={() => onDelete(subscription.id)}
          onOpen={onOpen ? () => onOpen(subscription) : undefined}
          members={membersBySubscription[subscription.id]}
        />
    ));

  if (!grouped) {
    return <div className={containerClass}>{renderCards(subscriptions)}</div>;
  }

  const symbol = mainCurrency?.symbol ?? "$";
  return (
    <div className="space-y-8">
      {groupByService(subscriptions, membersBySubscription).map((group) => (
        <section key={group.key || "other"} aria-label={group.label || t("other_services")} className="space-y-3">
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2">
            <ServiceIcon serviceKey={group.key} className="h-7 w-7 rounded-lg" />
            <h2 className="text-lg font-semibold">
              {group.key === OTHER_SERVICE ? t("other_services") : group.label}
            </h2>
            <span className="text-sm text-muted-foreground">
              {t("service_group_summary", {
                count: group.subscriptions.length,
                total: formatPrice(group.yearlyTotal, symbol, { currencyCode: mainCurrency?.code }),
              })}
              {group.memberCount > 0 && ` · ${t("members_count", { count: group.memberCount })}`}
            </span>
          </header>
          <div className={containerClass}>{renderCards(group.subscriptions)}</div>
        </section>
      ))}
    </div>
  );
}
