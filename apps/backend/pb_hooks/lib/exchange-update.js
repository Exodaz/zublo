/// <reference path="../../pb_data/types.d.ts" />

/**
 * Fetches EUR-based rates from the user's configured provider and stores them
 * normalised to the user's main currency. Shared by the scheduled job, the
 * "update now" route and the admin cron trigger so all three behave the same.
 *
 * Returns { updated, base, provider }; throws an Error with a user-facing
 * message when the provider or the user's currencies make an update impossible.
 */
function updateRatesForUser(app, settings) {
  const exchangeRates = require(__hooks + "/lib/pure/exchange-rates.js");
  const provider = exchangeRates.normalizeProvider(settings.getString("provider"));
  const userId = settings.getString("user");

  // is_main is authoritative; user.main_currency may be stale.
  const mains = app.findRecordsByFilter(
    "currencies", "user = {:u} && is_main = true", "", 1, 0, { u: userId }
  );
  if (mains.length === 0) throw new Error("No main currency set.");
  const mainCode = mains[0].getString("code");

  const request = exchangeRates.buildRateRequest(provider, settings.getString("api_key"));
  const res = $http.send({ url: request.url, method: "GET", headers: request.headers, timeout: 20 });
  const eurRates = exchangeRates.extractEurRates(provider, res.statusCode, res.json);
  if (eurRates instanceof Error) throw eurRates;

  const currencies = app.findRecordsByFilter("currencies", "user = {:u}", "", 0, 0, { u: userId });
  let normalized;
  try {
    normalized = exchangeRates.normalizeRatesByMainCurrency(
      eurRates,
      mainCode,
      currencies.map((record) => record.getString("code")),
    );
  } catch (_) {
    throw new Error(
      "Main currency '" + mainCode + "' was not found in the API response. " +
      "Make sure you have the correct currency code (e.g. BRL, USD, EUR)."
    );
  }

  let updated = 0;
  for (const currency of currencies) {
    const rate = normalized[currency.getString("code")];
    if (rate === undefined) continue;
    currency.set("rate", rate);
    app.save(currency);
    updated++;
  }

  try {
    const logs = app.findRecordsByFilter("exchange_log", "1=1", "", 1, 0);
    const log = logs.length > 0 ? logs[0] : new Record(app.findCollectionByNameOrId("exchange_log"));
    log.set("last_update", new Date().toISOString());
    log.set("provider", provider);
    log.set("status", "success");
    app.save(log);
  } catch (_) {}

  return { updated: updated, base: mainCode, provider: provider };
}

/** Every fixer_settings record that can currently fetch rates. */
function findUpdatableSettings(app) {
  const exchangeRates = require(__hooks + "/lib/pure/exchange-rates.js");
  // api_key is hidden (migration 0017) and silently dropped from filters, so
  // load everything and decide in JS.
  return app.findRecordsByFilter("fixer_settings", "1=1", "", 0, 0).filter((settings) =>
    exchangeRates.canFetchRates(
      settings.getString("provider"),
      settings.getString("api_key"),
      settings.getBool("enabled"),
    )
  );
}

module.exports = { updateRatesForUser, findUpdatableSettings };
