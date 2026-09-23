/**
 * Brand logos from the Brandfetch Logo API.
 *
 * Brandfetch requires logos to be hotlinked, so the app only ever stores a
 * subscription's domain. Images are requested from `/api/brand-logo`, which
 * redirects to the Brandfetch CDN when `BRANDFETCH_CLIENT_ID` is configured on
 * the server, or returns a lettermark otherwise (see pb_hooks/routes_logo.pb.js).
 */
const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/**
 * Mirrors `normalizeBrandDomain` in pb_hooks/lib/pure/brand-logo.js:
 * "https://www.Netflix.com/th/" → "netflix.com"; "" when not a domain.
 */
export function normalizeBrandDomain(value: string | undefined | null): string {
  let domain = (value ?? "").trim().toLowerCase();
  domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  domain = domain.split(/[/?#:]/)[0];
  domain = domain.replace(/^www\./, "");
  if (domain.length > 253 || !DOMAIN_PATTERN.test(domain)) return "";
  return domain;
}

/** Same-origin image URL for a domain's brand logo; null when the domain is invalid. */
export function brandLogoUrl(domain: string | undefined | null, size = 128): string | null {
  const normalized = normalizeBrandDomain(domain);
  if (!normalized) return null;
  return `/api/brand-logo?domain=${encodeURIComponent(normalized)}&size=${size}`;
}
