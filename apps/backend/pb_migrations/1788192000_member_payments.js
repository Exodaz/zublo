/// <reference path="../pb_data/types.d.ts" />

/**
 * Member payments: each payment a family-sharing member makes, with an
 * optional transfer slip, and the expiry date it moved the member to.
 *
 * Hooks in pb_hooks/member_payments.pb.js keep subscription_members.expires_at
 * in step: a new payment moves it to expires_after, and deleting the latest
 * payment restores expires_before. Payments are never updated, only added or
 * deleted, so the history stays a faithful log.
 *
 * Slips are personal financial documents, so the file field is protected:
 * downloads need a file token of the owning user.
 *
 * Also adds subscription_members.renewal_months, the period (in months) last
 * used for a member, offered as the default for the next renewal.
 */
migrate(
  (app) => {
    const members = app.findCollectionByNameOrId("subscription_members");
    if (!members.fields.getByName("renewal_months")) {
      members.fields.add(new NumberField({ name: "renewal_months", min: 0, onlyInt: true }));
      app.save(members);
    }

    try {
      app.findCollectionByNameOrId("member_payments");
      return;
    } catch (_) {}

    // ── Phase 1: plain fields (descriptors, as in 0001) ───────────────────
    app.save(
      new Collection({
        name: "member_payments",
        type: "base",
        fields: [
          { type: "date", name: "paid_at", required: true },
          { type: "number", name: "amount", min: 0 },
          { type: "number", name: "period_months", min: 0, onlyInt: true },
          { type: "date", name: "expires_before" },
          { type: "date", name: "expires_after", required: true },
          {
            type: "file",
            name: "slip",
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
            protected: true,
          },
          { type: "text", name: "notes", max: 1000 },
          { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        ],
      }),
    );

    // ── Phase 2: relations ────────────────────────────────────────────────
    const col = app.findCollectionByNameOrId("member_payments");
    col.fields.add(new RelationField({
      name: "member", required: true, maxSelect: 1, cascadeDelete: true,
      collectionId: members.id,
    }));
    col.fields.add(new RelationField({
      name: "subscription", required: true, maxSelect: 1, cascadeDelete: true,
      collectionId: app.findCollectionByNameOrId("subscriptions").id,
    }));
    col.fields.add(new RelationField({
      name: "user", required: true, maxSelect: 1, cascadeDelete: true,
      collectionId: app.findCollectionByNameOrId("users").id,
    }));
    app.save(col);

    // ── Phase 3: owner-only rules; no updates ─────────────────────────────
    const withRules = app.findCollectionByNameOrId("member_payments");
    const ownerRule = "@request.auth.id != '' && user = @request.auth.id";
    withRules.listRule = ownerRule;
    withRules.viewRule = ownerRule;
    withRules.createRule =
      "@request.auth.id != '' && @request.body.user = @request.auth.id" +
      " && member.user = @request.auth.id";
    withRules.updateRule = null;
    withRules.deleteRule = ownerRule;
    app.save(withRules);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("member_payments"));
    } catch (_) {}
    const members = app.findCollectionByNameOrId("subscription_members");
    if (members.fields.getByName("renewal_months")) {
      members.fields.removeByName("renewal_months");
      app.save(members);
    }
  },
);
