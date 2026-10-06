/// <reference path="../pb_data/types.d.ts" />

/**
 * member_payments.slip_url — a link to the transfer slip (e.g. an image shared
 * on LINE or Google Drive), as an alternative to uploading the slip file.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("member_payments");
    if (col.fields.getByName("slip_url")) return;
    col.fields.add(new URLField({ name: "slip_url" }));
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("member_payments");
    if (!col.fields.getByName("slip_url")) return;
    col.fields.removeByName("slip_url");
    app.save(col);
  },
);
