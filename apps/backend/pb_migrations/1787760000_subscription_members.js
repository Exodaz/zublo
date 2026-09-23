/// <reference path="../pb_data/types.d.ts" />

/**
 * Subscription members — the people a subscription is shared with
 * (family plans and the like).
 *
 * Each member belongs to exactly one subscription and carries its own name,
 * email, the amount they pay (informational, in the subscription's currency;
 * it is not folded into costs or statistics) and an optional expiry date that
 * drives the member-expiry reminders in cron_subscriptions.pb.js.
 *
 * Unlike subscription_history, `subscription` is a real relation with cascade
 * delete: members are owned data of the subscription and must disappear with
 * it, and the owner edits them directly through the collection API.
 */
migrate(
  (app) => {
    try {
      app.findCollectionByNameOrId("subscription_members");
      return;
    } catch (_) {}

    // ── Phase 1: create without relations or rules ────────────────────────
    // Plain descriptors, as in 0001 — field instances are not picked up by the
    // Collection constructor in this PocketBase version.
    app.save(
      new Collection({
        name: "subscription_members",
        type: "base",
        fields: [
          { type: "text", name: "name", required: true, max: 255 },
          { type: "email", name: "email" },
          { type: "number", name: "amount", min: 0 },
          { type: "date", name: "expires_at" },
          { type: "text", name: "notes", max: 1000 },
          { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        ],
      }),
    );

    // ── Phase 2: owner and subscription relations ─────────────────────────
    const users = app.findCollectionByNameOrId("users");
    const subscriptions = app.findCollectionByNameOrId("subscriptions");
    const withRelations = app.findCollectionByNameOrId("subscription_members");
    withRelations.fields.add(
      new RelationField({
        name: "subscription",
        required: true,
        collectionId: subscriptions.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
    );
    withRelations.fields.add(
      new RelationField({
        name: "user",
        required: true,
        collectionId: users.id,
        maxSelect: 1,
        cascadeDelete: true,
      }),
    );
    app.save(withRelations);

    // ── Phase 3: owner-only rules ─────────────────────────────────────────
    // A member may only be attached to one of the caller's own subscriptions,
    // and neither the owner nor the subscription can be reassigned later.
    const withRules = app.findCollectionByNameOrId("subscription_members");
    const ownerRule = "@request.auth.id != '' && user = @request.auth.id";
    withRules.listRule = ownerRule;
    withRules.viewRule = ownerRule;
    withRules.createRule =
      "@request.auth.id != '' && @request.body.user = @request.auth.id" +
      " && subscription.user = @request.auth.id";
    withRules.updateRule =
      ownerRule +
      " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)" +
      " && (@request.body.subscription:isset = false || @request.body.subscription = subscription)";
    withRules.deleteRule = ownerRule;
    app.save(withRules);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("subscription_members"));
    } catch (_) {}
  },
);
