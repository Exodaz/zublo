import { useQuery } from "@tanstack/react-query";

import { memberCurrencyOf } from "@/lib/memberBilling";
import { queryKeys } from "@/lib/queryKeys";
import { currenciesService } from "@/services/currencies";
import type { Currency, Subscription } from "@/types";

/**
 * The user's currencies and the one members of `sub` pay in. `memberCurrencyId`
 * overrides the subscription's own value (e.g. right after changing it, before
 * the subscription list refetches).
 */
export function useMemberCurrency(
  sub: Pick<Subscription, "member_currency" | "expand"> | undefined,
  userId: string,
  memberCurrencyId?: string,
): { currencies: Currency[]; mainCurrency?: Currency; memberCurrency?: Currency } {
  const { data: currencies = [] } = useQuery({
    queryKey: queryKeys.currencies.all(userId),
    queryFn: () => currenciesService.list(userId),
    enabled: !!userId,
  });
  const mainCurrency = currencies.find((c) => c.is_main);
  const id = memberCurrencyId ?? sub?.member_currency;
  const chosen = id ? currencies.find((c) => c.id === id) : undefined;
  return {
    currencies,
    mainCurrency,
    memberCurrency: chosen ?? memberCurrencyOf(sub, mainCurrency),
  };
}
