import {
  exchangeRatesConfigured,
  FIXER_PROVIDER_LINKS,
} from "@/components/settings/exchange-rates/fixer.constants";

describe("fixer.constants", () => {
  it("maps each provider to the correct product page", () => {
    expect(FIXER_PROVIDER_LINKS).toEqual({
      fixer: "https://fixer.io/product",
      apilayer: "https://apilayer.com/marketplace/fixer-api",
      frankfurter: "https://frankfurter.dev",
    });
  });

  it("knows when saved settings can fetch rates", () => {
    expect(exchangeRatesConfigured(null)).toBe(false);
    expect(exchangeRatesConfigured(undefined)).toBe(false);
    expect(exchangeRatesConfigured({ provider: "frankfurter", enabled: true })).toBe(true);
    expect(exchangeRatesConfigured({ provider: "frankfurter", enabled: false })).toBe(false);
    expect(exchangeRatesConfigured({ provider: "frankfurter" })).toBe(false);
    expect(exchangeRatesConfigured({ provider: "fixer", api_key_configured: true })).toBe(true);
    expect(exchangeRatesConfigured({ provider: "apilayer", enabled: true })).toBe(false);
  });
});
