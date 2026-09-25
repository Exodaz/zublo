import type { Subscription } from "@/types";

import { groupByService, OTHER_SERVICE, serviceKeyOf, serviceLabel } from "./serviceGroups";

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "s",
    name: "Sub",
    price: 12,
    currency: "c",
    frequency: 1,
    cycle: "monthly",
    next_payment: "2026-10-01",
    auto_renew: true,
    start_date: "2026-01-01",
    notify: false,
    notify_days_before: 3,
    inactive: false,
    user: "u",
    ...overrides,
  };
}

describe("serviceKeyOf", () => {
  it("prefers the brand domain, then the URL's domain", () => {
    expect(serviceKeyOf({ brand_domain: "microsoft.com", url: "https://netflix.com" })).toBe("microsoft.com");
    expect(serviceKeyOf({ url: "https://www.Netflix.com/th" })).toBe("netflix.com");
    expect(serviceKeyOf({ brand_domain: "", url: "" })).toBe(OTHER_SERVICE);
    expect(serviceKeyOf({})).toBe(OTHER_SERVICE);
  });
});

describe("serviceLabel", () => {
  it("names known services and falls back to the domain", () => {
    expect(serviceLabel("microsoft.com")).toBe("Microsoft 365");
    expect(serviceLabel("example.org")).toBe("example.org");
  });
});

describe("groupByService", () => {
  it("groups by service with counts, members and yearly totals in the main currency", () => {
    const yearly = { id: "y", name: "Yearly" as const };
    const baht = { id: "thb", name: "Baht", symbol: "฿", code: "THB", rate: 1, is_main: true, user: "u" };
    const dollar = { id: "usd", name: "Dollar", symbol: "$", code: "USD", rate: 0.03, is_main: false, user: "u" };
    const groups = groupByService(
      [
        sub({ id: "m1", brand_domain: "microsoft.com", price: 2000, expand: { cycle: yearly, currency: baht } }),
        sub({ id: "m2", brand_domain: "microsoft.com", price: 2000, expand: { cycle: yearly, currency: baht } }),
        // Inactive and credit records are listed but not counted in the cost.
        sub({ id: "m3", brand_domain: "microsoft.com", price: 2000, inactive: true }),
        sub({ id: "m4", brand_domain: "microsoft.com", price: 50, record_type: "credit" }),
        sub({ id: "n1", url: "https://netflix.com", price: 3 }),
        sub({ id: "x1", name: "Gym" }),
        sub({ id: "a1", brand_domain: "adobe.com", price: 10, frequency: 0, expand: { currency: dollar } }),
      ],
      { m1: [{ id: "1" }, { id: "2" }] as never, m2: [{ id: "3" }] as never },
    );

    expect(groups.map((g) => [g.key, g.label, g.subscriptions.length, g.memberCount])).toEqual([
      ["microsoft.com", "Microsoft 365", 4, 3],
      ["adobe.com", "Adobe Creative Cloud", 1, 0],
      ["netflix.com", "Netflix", 1, 0],
      [OTHER_SERVICE, "", 1, 0],
    ]);
    expect(groups[0].yearlyTotal).toBe(4000);
    // 10 USD/month at 0.03 USD per THB → 333.33 THB/month → 4000 THB/year.
    expect(groups[1].yearlyTotal).toBeCloseTo(4000);
    // Without an expanded cycle the monthly default applies: 3 × 12.
    expect(groups[2].yearlyTotal).toBe(36);
  });

  it("orders equal-sized groups by name and handles no members map", () => {
    const groups = groupByService([
      sub({ id: "b", brand_domain: "spotify.com" }),
      sub({ id: "a", brand_domain: "netflix.com" }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Netflix", "Spotify"]);
  });

  it("keeps the no-service group last even when it is the largest", () => {
    const groups = groupByService([
      sub({ id: "1" }),
      sub({ id: "2" }),
      sub({ id: "3", brand_domain: "netflix.com" }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["netflix.com", OTHER_SERVICE]);
  });
});
