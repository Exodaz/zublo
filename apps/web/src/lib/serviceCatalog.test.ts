import { normalizeBrandDomain } from "./brandLogo";
import { searchServicePresets,SERVICE_PRESETS } from "./serviceCatalog";

describe("serviceCatalog", () => {
  it("has unique, valid domains and https urls", () => {
    const domains = SERVICE_PRESETS.map((preset) => preset.domain);
    expect(new Set(domains).size).toBe(domains.length);
    for (const preset of SERVICE_PRESETS) {
      expect(normalizeBrandDomain(preset.domain)).toBe(preset.domain);
      expect(preset.url.startsWith("https://")).toBe(true);
    }
  });

  it("includes the services people ask for most", () => {
    const names = SERVICE_PRESETS.map((preset) => preset.name);
    for (const name of ["Netflix", "YouTube Premium", "Spotify", "Prime Video", "HBO Max", "Microsoft 365"]) {
      expect(names).toContain(name);
    }
  });

  it("searches by name or domain, case-insensitively", () => {
    expect(searchServicePresets("")).toBe(SERVICE_PRESETS);
    expect(searchServicePresets("  NETFLIX ").map((p) => p.name)).toEqual(["Netflix"]);
    expect(searchServicePresets("hbomax.com").map((p) => p.name)).toEqual(["HBO Max"]);
    expect(searchServicePresets("zzz-nothing")).toEqual([]);
  });
});
