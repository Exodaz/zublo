const f = require("../../pb_hooks/lib/pure/credit-forecast.js");

const monthly = (o) => ({ id: "s1", name: "Spotify", amount: 279, cycle: "Monthly", frequency: 1, next_payment: "2026-10-05", ...o });
const icloud = monthly({ id: "s2", name: "iCloud", amount: 99, next_payment: "2026-10-20" });

describe("pb_hooks/lib/pure/credit-forecast.js", () => {
  describe("dates", () => {
    it("adds days and counts days between dates", () => {
      expect(f.addDays("2026-12-30", 3)).toBe("2027-01-02");
      expect(f.addDays("bad", 1)).toBe("");
      expect(f.daysBetween("2026-10-03", "2026-12-05")).toBe(63);
      expect(f.daysBetween("2026-10-03", "2026-10-01")).toBe(-2);
    });
  });

  describe("chargeDates", () => {
    it("steps monthly back and forward from next_payment, clamping month ends", () => {
      expect(f.chargeDates(monthly({ next_payment: "2026-10-31" }), "2026-09-01", "2027-03-01")).toEqual([
        "2026-09-30",
        "2026-10-31",
        "2026-11-30",
        "2026-12-31",
        "2027-01-31",
        "2027-02-28",
      ]);
    });

    it("handles yearly, quarterly, weekly and daily cycles with frequency", () => {
      expect(f.chargeDates(monthly({ cycle: "Yearly", next_payment: "2027-01-22" }), "2026-01-01", "2028-12-31")).toEqual([
        "2026-01-22",
        "2027-01-22",
        "2028-01-22",
      ]);
      expect(f.chargeDates(monthly({ cycle: "Quarterly", next_payment: "2026-10-01" }), "2026-10-01", "2027-04-01")).toEqual([
        "2026-10-01",
        "2027-01-01",
        "2027-04-01",
      ]);
      expect(f.chargeDates(monthly({ cycle: "Weekly", frequency: 2, next_payment: "2026-10-05" }), "2026-09-20", "2026-10-31")).toEqual([
        "2026-09-21",
        "2026-10-05",
        "2026-10-19",
      ]);
      expect(f.chargeDates(monthly({ cycle: "Daily", frequency: 0, next_payment: "2026-10-05" }), "2026-10-04", "2026-10-06")).toEqual([
        "2026-10-04",
        "2026-10-05",
        "2026-10-06",
      ]);
      expect(f.chargeDates(monthly({ cycle: "Half-Yearly", next_payment: "2026-10-05" }), "2026-10-06", "2027-04-05")).toEqual([
        "2027-04-05",
      ]);
    });

    it("stays inside start, end and cancellation dates", () => {
      expect(f.chargeDates(monthly({ start_date: "2026-10-01" }), "2026-08-01", "2026-11-30")).toEqual(["2026-10-05", "2026-11-05"]);
      expect(f.chargeDates(monthly({ end_date: "2026-11-05" }), "2026-10-01", "2027-01-31")).toEqual(["2026-10-05", "2026-11-05"]);
      expect(f.chargeDates(monthly({ cancellation_date: "2026-10-20" }), "2026-10-01", "2027-01-31")).toEqual(["2026-10-05"]);
      expect(f.chargeDates(monthly({ start_date: "2027-01-01", end_date: "2026-12-01" }), "2026-01-01", "2027-12-31")).toEqual([]);
    });

    it("charges one-time subscriptions once and skips inactive, credits and undated ones", () => {
      expect(f.chargeDates(monthly({ cycle: "One-Time" }), "2026-10-01", "2026-12-31")).toEqual(["2026-10-05"]);
      expect(f.chargeDates(monthly({ cycle: "One-Time" }), "2026-10-06", "2026-12-31")).toEqual([]);
      expect(f.chargeDates(monthly({ inactive: true }), "2026-10-01", "2026-12-31")).toEqual([]);
      expect(f.chargeDates(monthly({ record_type: "credit" }), "2026-10-01", "2026-12-31")).toEqual([]);
      expect(f.chargeDates(monthly({ next_payment: "" }), "2026-10-01", "2026-12-31")).toEqual([]);
      expect(f.chargeDates(null, "2026-10-01", "2026-12-31")).toEqual([]);
    });
  });

  describe("monthlyAmount", () => {
    it("normalises every cycle to a month", () => {
      expect(f.monthlyAmount(monthly())).toBe(279);
      expect(f.monthlyAmount(monthly({ cycle: "Yearly", amount: 1200 }))).toBe(100);
      expect(f.monthlyAmount(monthly({ cycle: "Weekly", amount: 7 }))).toBeCloseTo(30.44);
      expect(f.monthlyAmount(monthly({ cycle: "One-Time" }))).toBe(0);
      expect(f.monthlyAmount(monthly({ inactive: true }))).toBe(0);
      expect(f.monthlyAmount(monthly({ record_type: "credit" }))).toBe(0);
      expect(f.monthlyAmount(monthly({ amount: "x", frequency: "x" }))).toBe(0);
    });
  });

  describe("forecastWallet", () => {
    it("finds the first charge the balance cannot cover", () => {
      const r = f.forecastWallet({
        entries: [{ type: "topup", amount: 1000, date: "2026-10-01" }],
        subscriptions: [monthly(), icloud],
        today: "2026-10-03",
      });
      expect(r).toMatchObject({ balance: 1000, hasEntries: true, runOutDate: "2026-12-05", daysLeft: 63, shortfall: 35, monthlyBurn: 378 });
      expect(r.lastTopup).toMatchObject({ amount: 1000, date: "2026-10-01" });
      expect(r.nextCharges.slice(0, 3)).toEqual([
        { date: "2026-10-05", amount: 279, subscriptionId: "s1", name: "Spotify", balanceAfter: 721 },
        { date: "2026-10-20", amount: 99, subscriptionId: "s2", name: "iCloud", balanceAfter: 622 },
        { date: "2026-11-05", amount: 279, subscriptionId: "s1", name: "Spotify", balanceAfter: 343 },
      ]);
    });

    it("recalibrates from a recorded balance; same-day charges come first", () => {
      const r = f.forecastWallet({
        entries: [
          { type: "balance", amount: 500, date: "2026-10-05 00:00:00.000Z", created: "b" },
          { type: "topup", amount: 1000, date: "2026-10-01", created: "a" },
          { type: "topup", amount: 50, date: "2026-10-05", created: "c" },
          { type: "topup", amount: 5, date: "bad" },
        ],
        subscriptions: [monthly()],
        today: "2026-10-12",
      });
      expect(r.balance).toBe(550);
      expect(r.runOutDate).toBe("2026-12-05");
      expect(r.lastTopup).toMatchObject({ amount: 50 });
    });

    it("orders same-day entries by creation time and charges by name", () => {
      const r = f.forecastWallet({
        entries: [
          { type: "balance", amount: 100, date: "2026-10-01", created: "2" },
          { type: "balance", amount: 900, date: "2026-10-01", created: "1" },
        ],
        subscriptions: [monthly({ name: "B" }), monthly({ id: "s3", name: "A", amount: 1 })],
        today: "2026-10-01",
      });
      expect(r.balance).toBe(100);
      expect(r.nextCharges.slice(0, 2).map((c) => c.name)).toEqual(["A", "B"]);
      expect(r.runOutDate).toBe("2026-10-05");
    });

    it("keeps an earlier shortfall until money is recorded, then restarts", () => {
      const past = f.forecastWallet({
        entries: [{ type: "topup", amount: 100, date: "2026-09-01" }],
        subscriptions: [monthly()],
        today: "2026-10-10",
      });
      expect(past).toMatchObject({ runOutDate: "2026-09-05", daysLeft: -35, shortfall: 179, balance: -458 });

      const after = f.forecastWallet({
        entries: [
          { type: "topup", amount: 100, date: "2026-09-01" },
          { type: "balance", amount: 2000, date: "2026-10-06" },
        ],
        subscriptions: [monthly()],
        today: "2026-10-10",
      });
      expect(after.runOutDate).toBe("2027-06-05");

      // A top-up dated in the future does not hide a failure before it.
      const future = f.forecastWallet({
        entries: [
          { type: "topup", amount: 300, date: "2026-10-01" },
          { type: "topup", amount: 1000, date: "2026-11-10" },
        ],
        subscriptions: [monthly()],
        today: "2026-10-03",
      });
      expect(future.runOutDate).toBe("2026-11-05");
    });

    it("works without entries, subscriptions or with a short horizon", () => {
      const empty = f.forecastWallet({ subscriptions: [monthly()], today: "2026-10-03" });
      expect(empty).toMatchObject({ balance: 0, hasEntries: false, lastTopup: null, runOutDate: "2026-10-05", daysLeft: 2 });

      const none = f.forecastWallet({ entries: [{ type: "topup", amount: 10, date: "2026-10-01" }], today: "2026-10-03" });
      expect(none).toMatchObject({ balance: 10, runOutDate: null, daysLeft: null, monthlyBurn: 0, nextCharges: [] });

      const short = f.forecastWallet({
        entries: [{ type: "topup", amount: 300, date: "2026-10-01" }],
        subscriptions: [monthly({ amount: undefined })],
        today: "2026-10-03",
        horizonDays: 10,
      });
      expect(short.nextCharges).toEqual([
        { date: "2026-10-05", amount: 0, subscriptionId: "s1", name: "Spotify", balanceAfter: 300 },
      ]);
      expect(short.runOutDate).toBeNull();
    });
  });

  describe("convertAmount and matchesAccount", () => {
    it("converts through the main currency", () => {
      expect(f.convertAmount(3, 0.03, 1)).toBeCloseTo(100);
      expect(f.convertAmount(100, 1, 0.03)).toBeCloseTo(3);
      expect(f.convertAmount(50, 0, undefined)).toBe(50);
      expect(f.convertAmount("x", 1, 1)).toBe(0);
    });

    it("matches accounts case-insensitively and never matches blanks", () => {
      expect(f.matchesAccount(" AppleID@Test ", "appleid@test")).toBe(true);
      expect(f.matchesAccount("other@test", "appleid@test")).toBe(false);
      expect(f.matchesAccount("", "")).toBe(false);
      expect(f.matchesAccount(undefined, undefined)).toBe(false);
    });
  });

  describe("creditAlertMessage", () => {
    const wallet = { name: "EXODAZTH", account: "appleid@test" };
    const base = {
      balance: 1000,
      runOutDate: "2026-12-05",
      daysLeft: 3,
      shortfall: 35,
      nextCharges: [{ date: "2026-12-05", amount: 279, name: "Spotify" }],
    };

    it("names the failing charge", () => {
      const { title, message } = f.creditAlertMessage(wallet, base, "฿");
      expect(title).toContain("Credit running low");
      expect(message).toContain("**EXODAZTH** (appleid@test)");
      expect(message).toContain("Estimated balance: ฿1,000");
      expect(message).toContain("Runs out in 3 day(s) — 05-12-26: the ฿279 charge for Spotify will fail (short by ฿35)");
    });

    it("words today and past run-outs, without a known charge", () => {
      const today = f.creditAlertMessage(wallet, { ...base, balance: 1234567.891, daysLeft: 0 }, "฿").message;
      expect(today).toContain("฿1,234,567.89");
      expect(today).toContain("Runs out today");
      const past = f.creditAlertMessage(wallet, { ...base, daysLeft: -2, nextCharges: [] }).message;
      expect(past).toContain("Runs out already — 05-12-26 (short by 35)");
    });
  });
});
