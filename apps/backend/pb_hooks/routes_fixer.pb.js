/// <reference path="../pb_data/types.d.ts" />

// ================================================================
// ROUTE: Update exchange rates for the authenticated user
// POST /api/fixer/update
//
// Fixer.io and APILayer free plans only return EUR as the base, and the
// free Frankfurter API is asked for EUR too. Rates are normalized to the
// user's main currency so existing conversion formulas keep working:
//
//   stored_rate[X] = eur_rates[X] / eur_rates[mainCode]
//
// This means: "how many units of X per 1 unit of main currency".
// Conversion in UI: price_in_main = price_in_X / stored_rate[X]
//
// NOTE: In PocketBase JSVM (Goja), file-scope helper bindings are not
// reliably available inside router callbacks. Require helpers inside
// each callback so the runtime can always resolve them at request time.
// ================================================================
routerAdd("POST", "/api/fixer/update", (e) => {
  const exchangeRates = require(__hooks + "/lib/pure/exchange-rates.js");
  const exchangeUpdate = require(__hooks + "/lib/exchange-update.js");
  if (!e.auth) throw new ForbiddenError("Authentication required");

  const candidates = $app.findRecordsByFilter(
    "fixer_settings", "user = {:u}", "", 1, 0, { u: e.auth.id }
  );
  const settings = candidates[0];
  if (
    !settings ||
    !exchangeRates.canFetchRates(
      settings.getString("provider"),
      settings.getString("api_key"),
      settings.getBool("enabled"),
    )
  ) {
    return e.json(400, { error: "No exchange rate provider configured." });
  }

  try {
    const result = exchangeUpdate.updateRatesForUser($app, settings);
    return e.json(200, { updated: result.updated, base: result.base, provider: result.provider });
  } catch (err) {
    return e.json(502, { error: String((err && err.message) || err) });
  }
});
