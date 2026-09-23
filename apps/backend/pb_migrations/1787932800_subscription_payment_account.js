/// <reference path="../pb_data/types.d.ts" />

/**
 * Subscription payment account — the account a subscription is billed to,
 * e.g. the Apple ID or Google account that holds an in-app subscription.
 * Free text: it complements payment_method (Visa, PayPal, …), which says how
 * the account is funded rather than which account it is.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("subscriptions");
    if (col.fields.getByName("payment_account")) return;
    col.fields.add(new TextField({ name: "payment_account", max: 255 }));
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("subscriptions");
    if (!col.fields.getByName("payment_account")) return;
    col.fields.removeByName("payment_account");
    app.save(col);
  },
);
