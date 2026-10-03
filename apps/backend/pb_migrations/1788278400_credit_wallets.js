/// <reference path="../pb_data/types.d.ts" />

/**
 * Credit wallets: prepaid balances (App Store Credit and the like) that the
 * subscriptions billed to an account draw from.
 *
 * credit_wallets.account is matched case-insensitively against
 * subscriptions.payment_account; pb_hooks/lib/pure/credit-forecast.js turns
 * the wallet's entries and those subscriptions' billing dates into a balance
 * and a run-out date, and cron_credit.pb.js sends reminders before it.
 *
 * credit_entries are top-ups (add money) or balance readings (the real
 * balance seen in the account, which recalibrates the estimate). Like member
 * payments they are never updated, only added or deleted.
 */
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId("credit_wallets");
      return;
    } catch (_) {}

    // ── Phase 1: plain fields ─────────────────────────────────────────────
    app.save(
      new Collection({
        name: "credit_wallets",
        type: "base",
        fields: [
          { type: "text", name: "name", required: true, max: 200 },
          { type: "text", name: "account", required: true, max: 255 },
          { type: "bool", name: "alerts" },
          { type: "text", name: "notes", max: 1000 },
          { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        ],
      }),
    );
    app.save(
      new Collection({
        name: "credit_entries",
        type: "base",
        fields: [
          { type: "select", name: "type", required: true, maxSelect: 1, values: ["topup", "balance"] },
          { type: "number", name: "amount", required: false, min: 0 },
          { type: "date", name: "date", required: true },
          { type: "text", name: "notes", max: 1000 },
          { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        ],
      }),
    );

    // ── Phase 2: relations ────────────────────────────────────────────────
    const usersId = app.findCollectionByNameOrId("users").id;
    const wallets = app.findCollectionByNameOrId("credit_wallets");
    wallets.fields.add(new RelationField({
      name: "currency", required: false, maxSelect: 1, cascadeDelete: false,
      collectionId: app.findCollectionByNameOrId("currencies").id,
    }));
    wallets.fields.add(new RelationField({
      name: "user", required: true, maxSelect: 1, cascadeDelete: true, collectionId: usersId,
    }));
    app.save(wallets);

    const entries = app.findCollectionByNameOrId("credit_entries");
    entries.fields.add(new RelationField({
      name: "wallet", required: true, maxSelect: 1, cascadeDelete: true, collectionId: wallets.id,
    }));
    entries.fields.add(new RelationField({
      name: "user", required: true, maxSelect: 1, cascadeDelete: true, collectionId: usersId,
    }));
    app.save(entries);

    // ── Phase 3: owner-only rules ─────────────────────────────────────────
    const ownerRule = "@request.auth.id != '' && user = @request.auth.id";
    const walletRules = app.findCollectionByNameOrId("credit_wallets");
    walletRules.listRule = ownerRule;
    walletRules.viewRule = ownerRule;
    walletRules.createRule = "@request.auth.id != '' && @request.body.user = @request.auth.id";
    walletRules.updateRule =
      ownerRule + " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)";
    walletRules.deleteRule = ownerRule;
    app.save(walletRules);

    const entryRules = app.findCollectionByNameOrId("credit_entries");
    entryRules.listRule = ownerRule;
    entryRules.viewRule = ownerRule;
    entryRules.createRule =
      "@request.auth.id != '' && @request.body.user = @request.auth.id" +
      " && wallet.user = @request.auth.id";
    entryRules.updateRule = null;
    entryRules.deleteRule = ownerRule;
    app.save(entryRules);
  },
  (app) => {
    ["credit_entries", "credit_wallets"].forEach((name) => {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    });
  },
);
