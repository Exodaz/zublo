const { memberExpiryStatus } = require("../../pb_hooks/lib/pure/member-expiry.js");

describe("pb_hooks/lib/pure/member-expiry.js", () => {
  it("returns none when there is no expiry date", () => {
    expect(memberExpiryStatus("", "2026-09-23")).toEqual({ status: "none", daysLeft: null });
    expect(memberExpiryStatus(null, "2026-09-23")).toEqual({ status: "none", daysLeft: null });
  });

  it("returns none for unparseable dates", () => {
    expect(memberExpiryStatus("not-a-date", "2026-09-23").status).toBe("none");
    expect(memberExpiryStatus("2026-13-45", "2026-09-23").status).toBe("none");
    expect(memberExpiryStatus("2026-09-30", "garbage").status).toBe("none");
  });

  it("marks past dates as expired with a negative daysLeft", () => {
    expect(memberExpiryStatus("2026-09-20", "2026-09-23")).toEqual({ status: "expired", daysLeft: -3 });
  });

  it("treats today and the next seven days as expiring", () => {
    expect(memberExpiryStatus("2026-09-23", "2026-09-23")).toEqual({ status: "expiring", daysLeft: 0 });
    expect(memberExpiryStatus("2026-09-30", "2026-09-23")).toEqual({ status: "expiring", daysLeft: 7 });
  });

  it("treats later dates as active", () => {
    expect(memberExpiryStatus("2026-10-01", "2026-09-23")).toEqual({ status: "active", daysLeft: 8 });
  });

  it("ignores the time part of PocketBase date values", () => {
    expect(memberExpiryStatus("2026-09-26 23:59:59.000Z", "2026-09-23").daysLeft).toBe(3);
  });

  it("honours a custom soon window", () => {
    expect(memberExpiryStatus("2026-09-26", "2026-09-23", 2).status).toBe("active");
    expect(memberExpiryStatus("2026-09-26", "2026-09-23", 3).status).toBe("expiring");
  });

  it("counts calendar days across month and year boundaries", () => {
    expect(memberExpiryStatus("2027-01-02", "2026-12-30").daysLeft).toBe(3);
  });
});
