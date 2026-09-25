/// <reference path="../pb_data/types.d.ts" />

/**
 * Adds Frankfurter (https://frankfurter.dev) as an exchange-rate provider.
 * It is free and needs no API key, so fixer_settings.enabled alone decides
 * whether rates are fetched for it (see lib/pure/exchange-rates.js).
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("fixer_settings");
    const field = col.fields.getByName("provider");
    if (field.values.indexOf("frankfurter") >= 0) return;
    field.values = field.values.concat(["frankfurter"]);
    app.save(col);
  },
  (app) => {
    // Settings pointing at Frankfurter fall back to Fixer before the value goes.
    for (const record of app.findRecordsByFilter("fixer_settings", "provider = 'frankfurter'", "", 0, 0)) {
      record.set("provider", "fixer");
      record.set("enabled", false);
      app.save(record);
    }
    const col = app.findCollectionByNameOrId("fixer_settings");
    const field = col.fields.getByName("provider");
    field.values = field.values.filter((value) => value !== "frankfurter");
    app.save(col);
  },
);
