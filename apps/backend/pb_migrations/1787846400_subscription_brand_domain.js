/// <reference path="../pb_data/types.d.ts" />

/**
 * Subscription brand domain — the service's website domain (netflix.com,
 * spotify.com, …) used to show its logo through the Brandfetch Logo API.
 *
 * Brandfetch requires logos to be hotlinked from its CDN, never downloaded and
 * stored, so the domain is all that is persisted. The browser loads the image
 * through /api/brand-logo, which redirects to the CDN (see routes_logo.pb.js).
 * An uploaded `logo` file still takes precedence over the brand logo.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("subscriptions");
    if (col.fields.getByName("brand_domain")) return;
    col.fields.add(
      new TextField({
        name: "brand_domain",
        max: 253,
        pattern: "^$|^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$",
      }),
    );
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("subscriptions");
    if (!col.fields.getByName("brand_domain")) return;
    col.fields.removeByName("brand_domain");
    app.save(col);
  },
);
