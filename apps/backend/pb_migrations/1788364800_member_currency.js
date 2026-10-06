/// <reference path="../pb_data/types.d.ts" />

/**
 * Currencies for family sharing and new subscriptions.
 *
 * subscriptions.member_currency — the currency members of the group pay in
 * (member amounts and member payments), which can differ from what the
 * service itself is billed in (e.g. billed in TRY, collected in THB). Empty
 * means the user's main currency, so existing data keeps reading as before.
 *
 * users.default_currency — preselected currency for new subscriptions; empty
 * means the main currency.
 */
migrate(
  (app) => {
    const currenciesId = app.findCollectionByNameOrId("currencies").id;

    const subs = app.findCollectionByNameOrId("subscriptions");
    if (!subs.fields.getByName("member_currency")) {
      subs.fields.add(new RelationField({
        name: "member_currency", required: false, maxSelect: 1, cascadeDelete: false,
        collectionId: currenciesId,
      }));
      app.save(subs);
    }

    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("default_currency")) {
      users.fields.add(new RelationField({
        name: "default_currency", required: false, maxSelect: 1, cascadeDelete: false,
        collectionId: currenciesId,
      }));
      app.save(users);
    }
  },
  (app) => {
    for (const [name, field] of [["subscriptions", "member_currency"], ["users", "default_currency"]]) {
      const col = app.findCollectionByNameOrId(name);
      if (!col.fields.getByName(field)) continue;
      col.fields.removeByName(field);
      app.save(col);
    }
  },
);
