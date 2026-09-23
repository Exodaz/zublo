/**
 * Brandfetch Logo API helpers.
 *
 * Brandfetch only allows logos to be hotlinked from its CDN, so Zublo never
 * downloads them: /api/brand-logo answers with a redirect to the CDN URL built
 * here, or with a generated lettermark when no client id is configured.
 */
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/**
 * Lowercases a domain and strips scheme, "www.", path and port so user input
 * like "https://www.Netflix.com/th/" becomes "netflix.com". Returns "" when the
 * result is not a plausible domain.
 */
function normalizeBrandDomain(value) {
  let domain = String(value || "").trim().toLowerCase();
  domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  domain = domain.split(/[/?#:]/)[0];
  domain = domain.replace(/^www\./, "");
  if (domain.length > 253 || !DOMAIN_PATTERN.test(domain)) return "";
  return domain;
}

/** Hotlink URL for a square brand icon; null when either input is unusable. */
function brandfetchLogoUrl(domain, clientId, size) {
  const normalized = normalizeBrandDomain(domain);
  const id = String(clientId || "").trim();
  if (!normalized || !id) return null;
  const px = Math.min(512, Math.max(16, Math.round(Number(size) || 128)));
  return (
    "https://cdn.brandfetch.io/domain/" + normalized +
    "/w/" + px + "/h/" + px +
    "/fallback/lettermark/icon?c=" + encodeURIComponent(id)
  );
}

/** A neutral square SVG with the domain's first letter, used without a client id. */
function lettermarkSvg(domain) {
  const normalized = normalizeBrandDomain(domain);
  const letter = normalized ? normalized[0].toUpperCase() : "?";
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' +
    '<rect width="128" height="128" rx="24" fill="#64748b"/>' +
    '<text x="64" y="64" dy=".35em" text-anchor="middle" fill="#fff" ' +
    'font-family="system-ui,sans-serif" font-size="64" font-weight="700">' +
    letter +
    "</text></svg>"
  );
}

/**
 * Reduces a Brandfetch Brand Search response to {name, domain, verified},
 * dropping entries without a usable domain and duplicate domains.
 */
function parseBrandSearchResults(raw, limit) {
  let items = raw;
  if (typeof raw === "string") {
    try {
      items = JSON.parse(raw);
    } catch (_) {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];

  const max = Math.max(1, Math.floor(Number(limit) || 10));
  const seen = {};
  const results = [];
  for (const item of items) {
    const domain = normalizeBrandDomain(item && item.domain);
    if (!domain || seen[domain]) continue;
    seen[domain] = true;
    results.push({
      name: String((item && item.name) || domain),
      domain: domain,
      verified: !!(item && item.verified),
    });
    if (results.length >= max) break;
  }
  return results;
}

module.exports = { normalizeBrandDomain, brandfetchLogoUrl, lettermarkSvg, parseBrandSearchResults };
