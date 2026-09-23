const subscriptionImport = require("../../pb_hooks/lib/pure/subscription-import.js");

describe("pb_hooks/lib/pure/subscription-import.js", () => {
  it("detects Wallos rows by exported field names", () => {
    expect(subscriptionImport.detectWallosFormat({ Name: "Netflix" })).toBe(true);
    expect(subscriptionImport.detectWallosFormat({ "Payment Cycle": "Monthly" })).toBe(true);
    expect(subscriptionImport.detectWallosFormat({ name: "Netflix" })).toBe(false);
    // covers `subscription || {}` fallback on lines 2-3
    expect(subscriptionImport.detectWallosFormat(null)).toBe(false);
  });

  it("parses direct and interval-based payment cycles", () => {
    expect(subscriptionImport.parseCycleAndFrequency("")).toEqual({
      cycleName: "Monthly",
      frequency: 1,
    });
    expect(subscriptionImport.parseCycleAndFrequency("Monthly")).toEqual({
      cycleName: "Monthly",
      frequency: 1,
    });
    expect(subscriptionImport.parseCycleAndFrequency("Every 3 Months")).toEqual({
      cycleName: "Monthly",
      frequency: 3,
    });
    expect(subscriptionImport.parseCycleAndFrequency("Every 2 weeks")).toEqual({
      cycleName: "Weekly",
      frequency: 2,
    });
    expect(subscriptionImport.parseCycleAndFrequency("unknown")).toEqual({
      cycleName: "Monthly",
      frequency: 1,
    });
  });

  it("parses Wallos price strings with symbols and comma decimals", () => {
    expect(subscriptionImport.parseWallosPrice("€9,99")).toEqual({ symbol: "€", price: 9.99 });
    expect(subscriptionImport.parseWallosPrice("R$29.90")).toEqual({ symbol: "R$", price: 29.9 });
    expect(subscriptionImport.parseWallosPrice("12.5")).toEqual({ symbol: "", price: 12.5 });
    expect(subscriptionImport.parseWallosPrice("free")).toEqual({ symbol: "", price: 0 });
    // covers `priceValue || "0"` (line 38) and `parseFloat("0") || 0` (line 45)
    expect(subscriptionImport.parseWallosPrice(null)).toEqual({ symbol: "", price: 0 });
    expect(subscriptionImport.parseWallosPrice("$0")).toEqual({ symbol: "$", price: 0 });
  });
});

describe("normalizeImportDate", () => {
  const { normalizeImportDate } = subscriptionImport;

  it("keeps the day of date and datetime strings", () => {
    expect(normalizeImportDate("2026-09-23")).toBe("2026-09-23");
    expect(normalizeImportDate(" 2026-09-23 00:00:00.000Z")).toBe("2026-09-23");
  });

  it("converts Excel serial day numbers", () => {
    expect(normalizeImportDate(46288)).toBe("2026-09-23");
    expect(normalizeImportDate(46288.6)).toBe("2026-09-24");
  });

  it("returns an empty string for missing, invalid or impossible dates", () => {
    expect(normalizeImportDate(undefined)).toBe("");
    expect(normalizeImportDate(null)).toBe("");
    expect(normalizeImportDate("")).toBe("");
    expect(normalizeImportDate("23/09/2026")).toBe("");
    expect(normalizeImportDate("2026-02-30")).toBe("");
    expect(normalizeImportDate(Number.NaN)).toBe("");
  });
});

describe("normalizeImportedMembers", () => {
  const { normalizeImportedMembers } = subscriptionImport;

  it("cleans members and drops entries without a name", () => {
    expect(
      normalizeImportedMembers([
        { name: "  alice@x.com ", email: " alice@x.com ", amount: "400", expires_at: "2027-01-22", notes: "vip" },
        { name: "bob", amount: -5, expires_at: "bad" },
        { name: "carol", email: null, amount: null, notes: null },
        { name: "   " },
        { email: "no-name@x.com" },
        null,
        "text",
      ]),
    ).toEqual([
      { name: "alice@x.com", email: "alice@x.com", amount: 400, expires_at: "2027-01-22", notes: "vip" },
      { name: "bob", email: "", amount: 0, expires_at: "", notes: "" },
      { name: "carol", email: "", amount: 0, expires_at: "", notes: "" },
    ]);
  });

  it("truncates long names and notes", () => {
    const [member] = normalizeImportedMembers([{ name: "n".repeat(300), notes: "x".repeat(1200) }]);
    expect(member.name).toHaveLength(255);
    expect(member.notes).toHaveLength(1000);
  });

  it("returns [] for anything that is not an array", () => {
    expect(normalizeImportedMembers(undefined)).toEqual([]);
    expect(normalizeImportedMembers("[]")).toEqual([]);
    expect(normalizeImportedMembers({ name: "x" })).toEqual([]);
  });
});
