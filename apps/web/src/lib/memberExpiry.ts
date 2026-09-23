import type { SubscriptionMember } from "@/types";

/**
 * Expiry status of a family-sharing member.
 *
 * Mirrors `pb_hooks/lib/pure/member-expiry.js`, which drives the backend
 * reminders, so the badge in the UI and the notification agree on the day.
 */
export type MemberExpiryStatus = "none" | "active" | "expiring" | "expired";

export interface MemberExpiry {
  status: MemberExpiryStatus;
  /** Calendar days until expiry; negative once expired, null without a date. */
  daysLeft: number | null;
}

/** Members expiring within this many days are flagged as "expiring". */
export const MEMBER_EXPIRY_SOON_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(value: string | undefined): number | null {
  const day = (value ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const ms = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.round(ms / DAY_MS) : null;
}

function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function memberExpiryStatus(
  expiresAt: string | undefined,
  today: string = localToday(),
  soonDays: number = MEMBER_EXPIRY_SOON_DAYS,
): MemberExpiry {
  const expiry = dayNumber(expiresAt);
  const todayDay = dayNumber(today);
  if (expiry === null || todayDay === null) return { status: "none", daysLeft: null };

  const daysLeft = expiry - todayDay;
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= soonDays) return { status: "expiring", daysLeft };
  return { status: "active", daysLeft };
}

/** Most urgent status among a subscription's members, for the card badge. */
export function worstMemberStatus(
  members: SubscriptionMember[],
  today?: string,
): MemberExpiryStatus {
  const rank: Record<MemberExpiryStatus, number> = {
    none: 0,
    active: 1,
    expiring: 2,
    expired: 3,
  };
  let worst: MemberExpiryStatus = "none";
  for (const member of members) {
    const { status } = memberExpiryStatus(member.expires_at, today);
    if (rank[status] > rank[worst]) worst = status;
  }
  return worst;
}
