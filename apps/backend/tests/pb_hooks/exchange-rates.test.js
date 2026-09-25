const {
  normalizeRatesByMainCurrency,
} = require("../../pb_hooks/lib/pure/exchange-rates.js");

describe("pb_hooks/lib/pure/exchange-rates.js", () => {
  it("normalizes rates relative to the main currency and injects EUR=1", () => {
    expect(
      normalizeRatesByMainCurrency({ USD: 1.08, BRL: 5.4 }, "BRL", ["USD", "BRL", "EUR"]),
    ).toEqual({
      USD: 0.2,
      BRL: 1,
      EUR: 0.18518518518518517,
    });
  });

  it("ignores currencies missing from the provider payload", () => {
    expect(
      normalizeRatesByMainCurrency({ USD: 1.08, EUR: 1 }, "EUR", ["USD", "EUR", "GBP"]),
    ).toEqual({
      USD: 1.08,
      EUR: 1,
    });
  });

  it("throws when the main currency is absent", () => {
    expect(() =>
      normalizeRatesByMainCurrency({ USD: 1.08 }, "BRL", ["USD", "BRL"]),
    ).toThrow("Main currency 'BRL' was not found in the API response.");
  });

  it("treats a null eurRates argument as an empty map and still works when main is EUR", () => {
    // covers the `eurRates || {}` fallback branch on line 2
    expect(normalizeRatesByMainCurrency(null, "EUR", ["EUR"])).toEqual({ EUR: 1 });
  });

  it("returns 1 for the main currency even when it also exists in the rates map", () => {
    expect(
      normalizeRatesByMainCurrency({ USD: 1.08, EUR: 1 }, "USD", ["USD", "EUR"]),
    ).toEqual({
      USD: 1,
      EUR: 0.9259259259259258,
    });
  });
});

describe("exchange-rate providers", () => {
  const {
    PROVIDERS,
    normalizeProvider,
    providerNeedsApiKey,
    canFetchRates,
    buildRateRequest,
    extractEurRates,
  } = require("../../pb_hooks/lib/pure/exchange-rates.js");

  it("knows Fixer, APILayer and Frankfurter and defaults unknown values to Fixer", () => {
    expect(PROVIDERS).toEqual(["fixer", "apilayer", "frankfurter"]);
    expect(normalizeProvider("frankfurter")).toBe("frankfurter");
    expect(normalizeProvider("")).toBe("fixer");
    expect(normalizeProvider(undefined)).toBe("fixer");
  });

  it("only requires an API key for the paid providers", () => {
    expect(providerNeedsApiKey("fixer")).toBe(true);
    expect(providerNeedsApiKey("apilayer")).toBe(true);
    expect(providerNeedsApiKey("frankfurter")).toBe(false);

    expect(canFetchRates("fixer", " key ", false)).toBe(true);
    expect(canFetchRates("apilayer", "  ", true)).toBe(false);
    expect(canFetchRates("fixer", undefined, true)).toBe(false);
    expect(canFetchRates("frankfurter", "", true)).toBe(true);
    expect(canFetchRates("frankfurter", "", false)).toBe(false);
  });

  it("builds EUR-based requests for each provider", () => {
    expect(buildRateRequest("frankfurter", "ignored")).toEqual({
      url: "https://api.frankfurter.dev/v2/rates?base=EUR",
      headers: {},
    });
    expect(buildRateRequest("apilayer", "k1")).toEqual({
      url: "https://api.apilayer.com/fixer/latest?base=EUR",
      headers: { apikey: "k1" },
    });
    expect(buildRateRequest("fixer", "a&b")).toEqual({
      url: "https://data.fixer.io/api/latest?access_key=a%26b",
      headers: {},
    });
    expect(buildRateRequest("fixer", undefined).url).toBe(
      "https://data.fixer.io/api/latest?access_key=",
    );
  });

  describe("extractEurRates", () => {
    it("turns a Frankfurter v2 array into a rate map", () => {
      expect(
        extractEurRates("frankfurter", 200, [
          { date: "2026-09-23", base: "EUR", quote: "USD", rate: 1.17 },
          { date: "2026-09-23", base: "EUR", quote: "thb", rate: 38.5 },
          { base: "USD", quote: "JPY", rate: 150 },
          { base: "EUR", quote: "XXX", rate: 0 },
          { base: "EUR", quote: 5, rate: 1 },
          null,
        ]),
      ).toEqual({ USD: 1.17, THB: 38.5 });
    });

    it("reports Frankfurter failures", () => {
      expect(extractEurRates("frankfurter", 422, { message: "bad base" }).message).toBe(
        "Frankfurter request failed: bad base",
      );
      expect(extractEurRates("frankfurter", 500, null).message).toBe(
        "Frankfurter request failed: HTTP 500",
      );
      expect(extractEurRates("frankfurter", 200, []).message).toBe("Frankfurter returned no rates.");
    });

    it("reads Fixer/APILayer rates and their error bodies", () => {
      expect(extractEurRates("fixer", 200, { success: true, rates: { USD: 1.1 } })).toEqual({ USD: 1.1 });
      expect(
        extractEurRates("apilayer", 200, { success: false, error: { code: 101, info: "Invalid key" } })
          .message,
      ).toBe("Invalid key");
      expect(extractEurRates("fixer", 200, { success: false, error: { code: 104 } }).message).toBe(
        "Fixer error code 104",
      );
      expect(extractEurRates("fixer", 200, { success: false }).message).toBe("Fixer error code undefined");
      expect(extractEurRates("fixer", 401, { rates: {} }).message).toBe(
        "Exchange rate API failed (HTTP 401)",
      );
      expect(extractEurRates("fixer", 200, null).message).toBe("Exchange rate API failed (HTTP 200)");
    });
  });
});

