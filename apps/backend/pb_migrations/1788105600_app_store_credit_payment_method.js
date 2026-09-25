/// <reference path="../pb_data/types.d.ts" />

/**
 * Adds an "App Store Credit" payment method for every existing user, for
 * subscriptions paid from an Apple ID balance. New users get it from
 * onboarding. The UI shows it with the App Store logo (web
 * lib/paymentMethodIcons.ts). Users who already have one keep theirs.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("payment_methods");
    for (const user of app.findRecordsByFilter("users", "1=1", "", 0, 0)) {
      const existing = app.findRecordsByFilter(
        "payment_methods",
        "user = {:u} && name ~ 'App Store Credit'",
        "", 1, 0, { u: user.id }
      );
      if (existing.length > 0) continue;
      const record = new Record(col);
      record.set("name", "App Store Credit");
      record.set("user", user.id);
      app.save(record);
    }
  },
  (app) => {
    // Only remove the ones nothing points at, so no subscription loses its method.
    for (const record of app.findRecordsByFilter("payment_methods", "name = 'App Store Credit'", "", 0, 0)) {
      const used = app.findRecordsByFilter(
        "subscriptions", "payment_method = {:id}", "", 1, 0, { id: record.id }
      );
      if (used.length === 0) app.delete(record);
    }
  },
);
