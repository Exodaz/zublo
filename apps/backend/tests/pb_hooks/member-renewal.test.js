const { toDay, addMonths, renewalBase, computeExpiry } = require("../../pb_hooks/lib/pure/member-renewal.js");

describe("pb_hooks/lib/pure/member-renewal.js", () => {
  it("normalises dates to their calendar day", () => {
    expect(toDay("2027-03-14 00:00:00.000Z")).toBe("2027-03-14");
    expect(toDay("2027-02-30")).toBe("");
    expect(toDay("")).toBe("");
    expect(toDay(undefined)).toBe("");
  });

  it("adds months, clamping to the end of shorter months", () => {
    expect(addMonths("2027-03-14", 12)).toBe("2028-03-14");
    expect(addMonths("2026-10-01", 1)).toBe("2026-11-01");
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2027-03-31", -1)).toBe("2027-02-28");
  });

  it("returns an empty string for invalid input", () => {
    expect(addMonths("nope", 1)).toBe("");
    expect(addMonths("2027-03-14", "x")).toBe("");
  });

  it("renews from the current expiry, else from the payment date", () => {
    expect(renewalBase("2027-03-14 00:00:00.000Z", "2026-10-01")).toBe("2027-03-14");
    expect(renewalBase("", "2026-10-01")).toBe("2026-10-01");
    expect(computeExpiry("2027-03-14", "2026-10-01", 12)).toBe("2028-03-14");
    expect(computeExpiry("", "2026-10-01", 1)).toBe("2026-11-01");
  });

  it("cannot compute without a period or a date", () => {
    expect(computeExpiry("2027-03-14", "2026-10-01", 0)).toBe("");
    expect(computeExpiry("", "", 12)).toBe("");
  });
});
