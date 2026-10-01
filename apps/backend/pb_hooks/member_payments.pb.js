/// <reference path="../pb_data/types.d.ts" />

// ================================================================
// Member payments keep their member's expiry date in step.
// NOTE: In PocketBase JSVM (Goja), file-scope helper bindings are not
// reliably available inside hook callbacks. Require helpers inside each
// callback so the runtime can always resolve them.
// ================================================================

// Before create: trust the server for the "before" date, compute the new
// expiry from the period when none was chosen by hand, and make sure the
// payment belongs to the member's own subscription.
onRecordCreateRequest((e) => {
  const renewal = require(__hooks + "/lib/pure/member-renewal.js");
  const record = e.record;

  let member;
  try {
    member = e.app.findRecordById("subscription_members", record.getString("member"));
  } catch (_) {
    throw new BadRequestError("Member not found.");
  }
  if (member.getString("subscription") !== record.getString("subscription")) {
    throw new BadRequestError("The payment's subscription does not match the member.");
  }

  const currentExpiry = renewal.toDay(member.getString("expires_at"));
  record.set("expires_before", currentExpiry);

  let expiresAfter = renewal.toDay(record.getString("expires_after"));
  if (!expiresAfter) {
    expiresAfter = renewal.computeExpiry(
      currentExpiry,
      record.getString("paid_at"),
      record.getInt("period_months"),
    );
  }
  if (!expiresAfter) {
    throw new BadRequestError("Choose a renewal period or a new expiry date.");
  }
  record.set("expires_after", expiresAfter);

  return e.next();
}, "member_payments");

// After create: move the member to the new expiry and remember the period.
onRecordAfterCreateSuccess((e) => {
  const renewal = require(__hooks + "/lib/pure/member-renewal.js");
  const payment = e.record;
  try {
    const member = e.app.findRecordById("subscription_members", payment.getString("member"));
    member.set("expires_at", renewal.toDay(payment.getString("expires_after")));
    if (payment.getInt("period_months") > 0) {
      member.set("renewal_months", payment.getInt("period_months"));
    }
    if (!(member.getFloat("amount") > 0) && payment.getFloat("amount") > 0) {
      member.set("amount", payment.getFloat("amount"));
    }
    e.app.save(member);
  } catch (err) {
    console.log("[Zublo] member payment sync error:", err);
  }
  return e.next();
}, "member_payments");

// After delete: undo the expiry change only when this payment was the last
// thing that moved it; an older payment leaves the current date alone.
onRecordAfterDeleteSuccess((e) => {
  const renewal = require(__hooks + "/lib/pure/member-renewal.js");
  const payment = e.record;
  try {
    const member = e.app.findRecordById("subscription_members", payment.getString("member"));
    const current = renewal.toDay(member.getString("expires_at"));
    if (current && current === renewal.toDay(payment.getString("expires_after"))) {
      member.set("expires_at", renewal.toDay(payment.getString("expires_before")));
      e.app.save(member);
    }
  } catch (_) {
    // The member itself was deleted (cascade): nothing to restore.
  }
  return e.next();
}, "member_payments");
