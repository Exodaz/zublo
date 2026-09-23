import type { SubscriptionMember } from "@/types";

import { MEMBER_EXPIRY_SOON_DAYS, memberExpiryStatus, worstMemberStatus } from "./memberExpiry";

function member(expires_at?: string): SubscriptionMember {
  return { id: "m", subscription: "s", user: "u", name: "Alice", expires_at };
}

describe("memberExpiryStatus", () => {
  it("returns none without a usable expiry date", () => {
    expect(memberExpiryStatus(undefined, "2026-09-23")).toEqual({ status: "none", daysLeft: null });
    expect(memberExpiryStatus("", "2026-09-23")).toEqual({ status: "none", daysLeft: null });
    expect(memberExpiryStatus("2026-13-45", "2026-09-23").status).toBe("none");
    expect(memberExpiryStatus("2026-09-30", "nope").status).toBe("none");
  });

  it("classifies expired, expiring and active members by calendar day", () => {
    expect(memberExpiryStatus("2026-09-20", "2026-09-23")).toEqual({ status: "expired", daysLeft: -3 });
    expect(memberExpiryStatus("2026-09-23", "2026-09-23")).toEqual({ status: "expiring", daysLeft: 0 });
    expect(memberExpiryStatus("2026-09-30", "2026-09-23")).toEqual({
      status: "expiring",
      daysLeft: MEMBER_EXPIRY_SOON_DAYS,
    });
    expect(memberExpiryStatus("2026-10-01", "2026-09-23")).toEqual({ status: "active", daysLeft: 8 });
  });

  it("ignores the time part of PocketBase dates and honours a custom window", () => {
    expect(memberExpiryStatus("2026-09-26 00:00:00.000Z", "2026-09-23").daysLeft).toBe(3);
    expect(memberExpiryStatus("2026-09-26", "2026-09-23", 2).status).toBe("active");
  });

  it("defaults to the local current day", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 23, 23, 30));
    try {
      expect(memberExpiryStatus("2026-09-24").daysLeft).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("worstMemberStatus", () => {
  it("returns none for no members", () => {
    expect(worstMemberStatus([], "2026-09-23")).toBe("none");
  });

  it("picks the most urgent status", () => {
    const today = "2026-09-23";
    expect(worstMemberStatus([member(), member("2027-01-01")], today)).toBe("active");
    expect(worstMemberStatus([member("2026-09-25"), member("2027-01-01")], today)).toBe("expiring");
    expect(worstMemberStatus([member("2027-01-01"), member("2026-09-01"), member("2026-09-25")], today)).toBe(
      "expired",
    );
  });
});
