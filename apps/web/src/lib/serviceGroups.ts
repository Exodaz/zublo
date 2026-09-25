import { normalizeBrandDomain } from "@/lib/brandLogo";
import { isCredit } from "@/lib/recordTypes";
import { SERVICE_PRESETS } from "@/lib/serviceCatalog";
import { toMainCurrency, toMonthly } from "@/lib/utils";
import type { Subscription, SubscriptionMember } from "@/types";

/** Key used for subscriptions without a service or usable URL. */
export const OTHER_SERVICE = "";

/**
 * The service a subscription belongs to: its chosen brand domain, else the
 * domain of its URL, else OTHER_SERVICE. Same fallback order as its logo
 * (see subscriptionsService.logoUrl), so a group's logo matches its cards.
 */
export function serviceKeyOf(sub: Pick<Subscription, "brand_domain" | "url">): string {
  return normalizeBrandDomain(sub.brand_domain) || normalizeBrandDomain(sub.url) || OTHER_SERVICE;
}

/** Preset name for a known domain ("microsoft.com" → "Microsoft 365"), else the domain. */
export function serviceLabel(key: string): string {
  return SERVICE_PRESETS.find((preset) => preset.domain === key)?.name ?? key;
}

export interface ServiceGroup {
  key: string;
  label: string;
  subscriptions: Subscription[];
  /** Active expense subscriptions only, per year, in the main currency. */
  yearlyTotal: number;
  memberCount: number;
}

/**
 * Groups subscriptions by service, largest group first (then by name), with
 * subscriptions lacking a service collected last under OTHER_SERVICE.
 */
export function groupByService(
  subscriptions: Subscription[],
  membersBySubscription: Record<string, SubscriptionMember[]> = {},
): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>();

  for (const sub of subscriptions) {
    const key = serviceKeyOf(sub);
    let group = groups.get(key);
    if (!group) {
      group = { key, label: serviceLabel(key), subscriptions: [], yearlyTotal: 0, memberCount: 0 };
      groups.set(key, group);
    }
    group.subscriptions.push(sub);
    group.memberCount += membersBySubscription[sub.id]?.length ?? 0;
    if (!sub.inactive && !isCredit(sub)) {
      const monthly = toMonthly(sub.price, sub.expand?.cycle?.name ?? "Monthly", sub.frequency || 1);
      group.yearlyTotal += toMainCurrency(monthly, sub.expand?.currency) * 12;
    }
  }

  return [...groups.values()].sort((a, b) => {
    if ((a.key === OTHER_SERVICE) !== (b.key === OTHER_SERVICE)) return a.key === OTHER_SERVICE ? 1 : -1;
    return b.subscriptions.length - a.subscriptions.length || a.label.localeCompare(b.label);
  });
}
