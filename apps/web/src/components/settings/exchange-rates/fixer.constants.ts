export const FIXER_PROVIDER_LINKS: Record<string, string> = {
  fixer: "https://fixer.io/product",
  apilayer: "https://apilayer.com/marketplace/fixer-api",
  frankfurter: "https://frankfurter.dev",
};

/**
 * Whether saved settings can fetch rates. Mirrors canFetchRates in
 * pb_hooks/lib/pure/exchange-rates.js: Frankfurter only needs to be enabled.
 */
export function exchangeRatesConfigured(
  settings: { provider?: string; enabled?: boolean; api_key_configured?: boolean } | null | undefined,
): boolean {
  if (!settings) return false;
  if (settings.provider === "frankfurter") return !!settings.enabled;
  return !!settings.api_key_configured;
}
