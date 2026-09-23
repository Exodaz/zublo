import { brandLogoUrl, normalizeBrandDomain } from "./brandLogo";

describe("normalizeBrandDomain", () => {
  it("strips scheme, www, path, query, port and case", () => {
    expect(normalizeBrandDomain("https://www.Netflix.com/th/browse?x=1")).toBe("netflix.com");
    expect(normalizeBrandDomain("  Spotify.com:443 ")).toBe("spotify.com");
    expect(normalizeBrandDomain("open.spotify.com#top")).toBe("open.spotify.com");
  });

  it("rejects values that are not domains", () => {
    expect(normalizeBrandDomain("")).toBe("");
    expect(normalizeBrandDomain(undefined)).toBe("");
    expect(normalizeBrandDomain(null)).toBe("");
    expect(normalizeBrandDomain("netflix")).toBe("");
    expect(normalizeBrandDomain("a b.com")).toBe("");
    expect(normalizeBrandDomain(`${"x".repeat(250)}.com`)).toBe("");
  });
});

describe("brandLogoUrl", () => {
  it("points at the same-origin brand logo route", () => {
    expect(brandLogoUrl("www.Netflix.com")).toBe("/api/brand-logo?domain=netflix.com&size=128");
    expect(brandLogoUrl("spotify.com", 64)).toBe("/api/brand-logo?domain=spotify.com&size=64");
  });

  it("returns null for an invalid or missing domain", () => {
    expect(brandLogoUrl("")).toBeNull();
    expect(brandLogoUrl(undefined)).toBeNull();
  });
});
