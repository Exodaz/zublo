const {
  normalizeBrandDomain,
  brandfetchLogoUrl,
  lettermarkSvg,
  parseBrandSearchResults,
} = require("../../pb_hooks/lib/pure/brand-logo.js");

describe("pb_hooks/lib/pure/brand-logo.js", () => {
  describe("normalizeBrandDomain", () => {
    it("strips scheme, www, path, query, port and case", () => {
      expect(normalizeBrandDomain("https://www.Netflix.com/th/browse?x=1")).toBe("netflix.com");
      expect(normalizeBrandDomain("  Spotify.com:443 ")).toBe("spotify.com");
      expect(normalizeBrandDomain("open.spotify.com#top")).toBe("open.spotify.com");
    });

    it("rejects values that are not domains", () => {
      expect(normalizeBrandDomain("")).toBe("");
      expect(normalizeBrandDomain(undefined)).toBe("");
      expect(normalizeBrandDomain("netflix")).toBe("");
      expect(normalizeBrandDomain("-bad.com")).toBe("");
      expect(normalizeBrandDomain("a b.com")).toBe("");
      expect(normalizeBrandDomain("x".repeat(250) + ".com")).toBe("");
    });
  });

  describe("brandfetchLogoUrl", () => {
    it("builds a hotlink URL with the client id", () => {
      expect(brandfetchLogoUrl("www.netflix.com", " abc123 ", 64)).toBe(
        "https://cdn.brandfetch.io/domain/netflix.com/w/64/h/64/fallback/lettermark/icon?c=abc123",
      );
    });

    it("defaults and clamps the size", () => {
      expect(brandfetchLogoUrl("netflix.com", "id")).toContain("/w/128/h/128/");
      expect(brandfetchLogoUrl("netflix.com", "id", "abc")).toContain("/w/128/h/128/");
      expect(brandfetchLogoUrl("netflix.com", "id", 4)).toContain("/w/16/h/16/");
      expect(brandfetchLogoUrl("netflix.com", "id", 9999)).toContain("/w/512/h/512/");
    });

    it("returns null without a usable domain or client id", () => {
      expect(brandfetchLogoUrl("netflix.com", "")).toBeNull();
      expect(brandfetchLogoUrl("netflix.com", undefined)).toBeNull();
      expect(brandfetchLogoUrl("not a domain", "id")).toBeNull();
    });
  });

  describe("lettermarkSvg", () => {
    it("renders the first letter of the domain", () => {
      const svg = lettermarkSvg("https://spotify.com");
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain(">S</text>");
    });

    it("falls back to a question mark for invalid input", () => {
      expect(lettermarkSvg("<script>")).toContain(">?</text>");
    });
  });

  describe("parseBrandSearchResults", () => {
    const sample = [
      { name: "Netflix", domain: "netflix.com", verified: true, icon: "x" },
      { name: "Netflix", domain: "NETFLIX.com" },
      { name: "", domain: "netflixgames.com" },
      { name: "Broken", domain: "not a domain" },
      null,
      { name: "Other", domain: "other.com" },
    ];

    it("keeps name, domain and verified, dropping invalid and duplicate domains", () => {
      expect(parseBrandSearchResults(sample)).toEqual([
        { name: "Netflix", domain: "netflix.com", verified: true },
        { name: "netflixgames.com", domain: "netflixgames.com", verified: false },
        { name: "Other", domain: "other.com", verified: false },
      ]);
    });

    it("accepts the raw JSON text and honours the limit", () => {
      expect(parseBrandSearchResults(JSON.stringify(sample), 1)).toEqual([
        { name: "Netflix", domain: "netflix.com", verified: true },
      ]);
      expect(parseBrandSearchResults(sample, "x")).toHaveLength(3);
    });

    it("returns an empty list for anything that is not a result array", () => {
      expect(parseBrandSearchResults("not json")).toEqual([]);
      expect(parseBrandSearchResults({ error: "nope" })).toEqual([]);
      expect(parseBrandSearchResults(undefined)).toEqual([]);
    });
  });
});
