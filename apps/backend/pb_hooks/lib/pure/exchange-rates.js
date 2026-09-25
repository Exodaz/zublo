/**
 * Exchange-rate providers.
 *
 * Every provider is asked for EUR-based rates (the only base on the free
 * Fixer/APILayer plans) and the result is normalised to the user's main
 * currency:  stored_rate[X] = eurRates[X] / eurRates[mainCode]
 *
 * Frankfurter (https://frankfurter.dev) is free and needs no API key.
 */
const PROVIDERS = ["fixer", "apilayer", "frankfurter"];

function normalizeProvider(provider) {
  return PROVIDERS.indexOf(provider) >= 0 ? provider : "fixer";
}

function providerNeedsApiKey(provider) {
  return normalizeProvider(provider) !== "frankfurter";
}

/**
 * Whether stored settings can fetch rates: a key-based provider needs a
 * non-empty key, Frankfurter only needs to be enabled.
 */
function canFetchRates(provider, apiKey, enabled) {
  if (!providerNeedsApiKey(provider)) return !!enabled;
  return String(apiKey || "").trim().length > 0;
}

/** URL and headers for a EUR-based latest-rates request. */
function buildRateRequest(provider, apiKey) {
  const p = normalizeProvider(provider);
  if (p === "frankfurter") {
    return { url: "https://api.frankfurter.dev/v2/rates?base=EUR", headers: {} };
  }
  if (p === "apilayer") {
    return { url: "https://api.apilayer.com/fixer/latest?base=EUR", headers: { apikey: apiKey } };
  }
  return {
    url: "https://data.fixer.io/api/latest?access_key=" + encodeURIComponent(apiKey || ""),
    headers: {},
  };
}

/**
 * EUR-based rates as { CODE: rate } from a provider response, or an
 * Error explaining why the response is unusable.
 */
function extractEurRates(provider, statusCode, json) {
  const p = normalizeProvider(provider);

  if (p === "frankfurter") {
    // v2: [{ date, base: "EUR", quote: "USD", rate: 1.17 }, ...]
    if (statusCode !== 200 || !Array.isArray(json)) {
      const message = json && json.message ? json.message : "HTTP " + statusCode;
      return new Error("Frankfurter request failed: " + message);
    }
    const rates = {};
    for (const row of json) {
      if (row && row.base === "EUR" && typeof row.quote === "string" && Number(row.rate) > 0) {
        rates[row.quote.toUpperCase()] = Number(row.rate);
      }
    }
    if (Object.keys(rates).length === 0) return new Error("Frankfurter returned no rates.");
    return rates;
  }

  // Fixer returns HTTP 200 even for errors; check the body first.
  if (json && json.success === false) {
    const info = json.error && json.error.info;
    return new Error(info || "Fixer error code " + (json.error && json.error.code));
  }
  if (statusCode !== 200 || !json || !json.rates) {
    return new Error("Exchange rate API failed (HTTP " + statusCode + ")");
  }
  return json.rates;
}

function normalizeRatesByMainCurrency(eurRates, mainCode, currencyCodes) {
  const rates = Object.assign({}, eurRates || {});
  rates.EUR = 1;

  const mainRate = rates[mainCode];
  if (!mainRate) {
    throw new Error("Main currency '" + mainCode + "' was not found in the API response.");
  }

  const normalized = {};
  for (let index = 0; index < currencyCodes.length; index++) {
    const code = currencyCodes[index];
    if (code === mainCode) {
      normalized[code] = 1;
    } else if (rates[code] !== undefined) {
      normalized[code] = rates[code] / mainRate;
    }
  }

  return normalized;
}

module.exports = {
  PROVIDERS,
  normalizeProvider,
  providerNeedsApiKey,
  canFetchRates,
  buildRateRequest,
  extractEurRates,
  normalizeRatesByMainCurrency,
};
