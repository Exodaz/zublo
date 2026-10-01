/**
 * Renewal dates for family-sharing member payments (member_payments).
 * Dates are YYYY-MM-DD calendar days; a time part is ignored. Mirrored in
 * web/src/lib/memberRenewal.ts so the form previews what the hook stores.
 */

function parseDay(value) {
  var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
  if (!match) return null;
  var y = +match[1], m = +match[2], d = +match[3];
  var date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return { y: y, m: m, d: d };
}

function pad(n) {
  return (n < 10 ? "0" : "") + n;
}

/** YYYY-MM-DD (time part ignored), or "" when not a real date. */
function toDay(value) {
  var day = parseDay(value);
  return day ? day.y + "-" + pad(day.m) + "-" + pad(day.d) : "";
}

/**
 * Adds whole months, keeping the day of month but clamping to the end of a
 * shorter month: 2027-01-31 + 1 → 2027-02-28. "" for an invalid date.
 */
function addMonths(isoDate, months) {
  var day = parseDay(isoDate);
  var n = Math.floor(Number(months));
  if (!day || !isFinite(n)) return "";
  var index = day.y * 12 + (day.m - 1) + n;
  var y = Math.floor(index / 12);
  var m = index - y * 12 + 1;
  var last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return y + "-" + pad(m) + "-" + pad(Math.min(day.d, last));
}

/** Where a renewal counts from: the member's current expiry, else the payment date. */
function renewalBase(currentExpiry, paidAt) {
  return toDay(currentExpiry) || toDay(paidAt);
}

/** New expiry for a payment of `months`, or "" when it cannot be computed. */
function computeExpiry(currentExpiry, paidAt, months) {
  var base = renewalBase(currentExpiry, paidAt);
  if (!base || !(Number(months) > 0)) return "";
  return addMonths(base, months);
}

module.exports = { toDay, addMonths, renewalBase, computeExpiry };
