/**
 * Expiry status of a family-sharing member (subscription_members.expires_at).
 *
 * Both dates are compared as calendar days (YYYY-MM-DD) so the result does not
 * drift with the hour of day or the server timezone. `expiresAt` may carry a
 * time part (PocketBase stores dates as "YYYY-MM-DD HH:MM:SS.sssZ"); only the
 * day is used.
 *
 * Returns `{ status, daysLeft }` where status is one of:
 *   - "none"     no (or an unparseable) expiry date
 *   - "expired"  the expiry day is before today
 *   - "expiring" expires today or within `soonDays` days
 *   - "active"   expires later than that
 * `daysLeft` is null for "none" and negative once expired.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(value) {
  const day = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const ms = Date.parse(day + "T00:00:00Z");
  return isFinite(ms) ? Math.round(ms / DAY_MS) : null;
}

function memberExpiryStatus(expiresAt, todayStr, soonDays) {
  const soon = soonDays === undefined ? 7 : soonDays;
  const expiry = dayNumber(expiresAt);
  const today = dayNumber(todayStr);
  if (expiry === null || today === null) return { status: "none", daysLeft: null };

  const daysLeft = expiry - today;
  if (daysLeft < 0) return { status: "expired", daysLeft: daysLeft };
  if (daysLeft <= soon) return { status: "expiring", daysLeft: daysLeft };
  return { status: "active", daysLeft: daysLeft };
}

module.exports = { memberExpiryStatus };
