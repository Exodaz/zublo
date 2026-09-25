/// <reference path="../pb_data/types.d.ts" />

// ================================================================
// CRON 2: Update Exchange Rates (twice daily at 00:00 and 12:00)
//
// Rates come from each user's provider (Fixer.io, APILayer or the free
// Frankfurter API) as EUR-based values and are normalised to the user's
// main currency — see lib/exchange-update.js.
// ================================================================
cronAdd("updateExchange", "0 0,12 * * *", () => {
  const exchangeUpdate = require(__hooks + "/lib/exchange-update.js");

  for (const settings of exchangeUpdate.findUpdatableSettings($app)) {
    try {
      const result = exchangeUpdate.updateRatesForUser($app, settings);
      console.log(
        "[Zublo] updateExchange: " + result.updated + " rate(s) for user " +
        settings.getString("user") + " via " + result.provider + " (base: " + result.base + ")"
      );
    } catch (err) {
      console.log("[Zublo] updateExchange error for user " + settings.getString("user") + ":", err);
    }
  }
});
