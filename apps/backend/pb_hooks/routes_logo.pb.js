/// <reference path="../pb_data/types.d.ts" />

// NOTE: In PocketBase JSVM (Goja), file-scope helper bindings are not
// reliably available inside router callbacks: handlers run on a pooled
// runtime that never evaluated this file's top level. Require helpers
// inside each callback so the runtime can always resolve them at
// request time.

// ================================================================
// ROUTE: Logo Search
// ================================================================
routerAdd("GET", "/api/logo_search", (e) => {
  const logoUtils = require(__hooks + "/lib/pure/logo-utils.js");
  const { getQueryParam } = require(__hooks + "/lib/pure/request-query.js");
  try {
    if (!e.auth) {
      return e.json(403, { error: "Authentication required" });
    }

    const search = getQueryParam(e, "search");
    if (!search) {
      return e.json(400, { error: "Missing 'search' parameter" });
    }

    const encodedQuery = encodeURIComponent(search + " logo");
    const maxResults = 24;
    let logos = [];

    const googleUrl = "https://www.google.com/search?q=" + encodedQuery + "&tbm=isch";
    const braveUrl = "https://search.brave.com/search?q=" + encodedQuery;

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "identity",
    };

    try {
      const res = $http.send({
        url: googleUrl,
        method: "GET",
        headers,
      });

      if (res.statusCode === 200 && res.raw) {
        logos = logoUtils.extractImageUrlsFromPage(res.raw, maxResults);
      }
    } catch (_) { }

    if (logos.length === 0) {
      try {
        const res = $http.send({
          url: "https://search.brave.com/images?q=" + encodedQuery + "&source=web",
          method: "GET",
          headers,
        });

        if (res.statusCode === 200 && res.raw) {
          logos = logoUtils.extractImageUrlsFromPage(res.raw, maxResults);
        }
      } catch (_) { }
    }

    return e.json(200, { logos: logos });
  } catch (_) {
    return e.json(200, { logos: [] });
  }
});

routerAdd("GET", "/api/logo_fetch", (e) => {
  const { getQueryParam } = require(__hooks + "/lib/pure/request-query.js");
  try {
    if (!e.auth) {
      return e.json(403, { error: "Authentication required" });
    }

    const url = getQueryParam(e, "url");

    if (!url || !/^https?:\/\//i.test(url)) {
      return e.json(400, { error: "Invalid 'url' parameter" });
    }

    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.includes("localhost") ||
      lowerUrl.includes("127.0.0.1") ||
      lowerUrl.includes("0.0.0.0") ||
      lowerUrl.includes("::1")
    ) {
      return e.json(400, { error: "Blocked host" });
    }

    const res = $http.send({
      url,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Zublo/1.0)",
        "Accept": "image/*,*/*;q=0.8",
      },
    });

    if (res.statusCode !== 200 || !res.raw) {
      return e.json(400, { error: "Unable to fetch image" });
    }

    let contentType = "image/png";
    try {
      const ct = res.headers?.["Content-Type"] || res.headers?.["content-type"];
      if (ct) contentType = String(ct).split(";")[0];
    } catch (_) { }

    const base64 = btoa(res.raw);
    return e.json(200, { contentType, base64 });
  } catch (err) {
    return e.json(400, { error: "Failed to fetch image", details: String(err) });
  }
});

// ================================================================
// ROUTE: Brand logo (Brandfetch Logo API)
// ================================================================
// Public on purpose: <img> requests carry no Authorization header. It never
// proxies or stores the image — Brandfetch requires logos to be hotlinked — it
// only redirects the browser to the CDN, so the only thing it reveals is the
// client id, which is designed to appear in public image URLs anyway.
routerAdd("GET", "/api/brand-logo", (e) => {
  const brandLogo = require(__hooks + "/lib/pure/brand-logo.js");
  const { getQueryParam } = require(__hooks + "/lib/pure/request-query.js");

  const domain = brandLogo.normalizeBrandDomain(getQueryParam(e, "domain"));
  if (!domain) {
    return e.json(400, { error: "Invalid 'domain' parameter" });
  }

  const target = brandLogo.brandfetchLogoUrl(
    domain,
    $os.getenv("BRANDFETCH_CLIENT_ID"),
    getQueryParam(e, "size"),
  );

  e.response.header().set("Cache-Control", "public, max-age=86400");
  if (target) {
    return e.redirect(302, target);
  }

  e.response.header().set("Content-Type", "image/svg+xml");
  return e.string(200, brandLogo.lettermarkSvg(domain));
});

// ================================================================
// ROUTE: Brand search (Brandfetch Brand Search API)
// ================================================================
// Returns brands matching a name so the subscription form can offer their
// logos. Only names and domains are returned; logos are always hotlinked
// through /api/brand-logo. Without BRANDFETCH_CLIENT_ID it answers
// `configured: false` and the form falls back to its preset list.
routerAdd("GET", "/api/brand-search", (e) => {
  const brandLogo = require(__hooks + "/lib/pure/brand-logo.js");
  const { getQueryParam } = require(__hooks + "/lib/pure/request-query.js");

  if (!e.auth) {
    return e.json(403, { error: "Authentication required" });
  }

  const query = getQueryParam(e, "q").slice(0, 100);
  const clientId = String($os.getenv("BRANDFETCH_CLIENT_ID") || "").trim();
  if (!clientId) {
    return e.json(200, { configured: false, brands: [] });
  }
  if (query.length < 2) {
    return e.json(200, { configured: true, brands: [] });
  }

  try {
    const res = $http.send({
      url:
        "https://api.brandfetch.io/v2/search/" + encodeURIComponent(query) +
        "?c=" + encodeURIComponent(clientId),
      method: "GET",
      headers: { "Accept": "application/json" },
      timeout: 8,
    });
    if (res.statusCode !== 200) {
      return e.json(200, { configured: true, brands: [] });
    }
    return e.json(200, {
      configured: true,
      brands: brandLogo.parseBrandSearchResults(res.raw, 10),
    });
  } catch (_) {
    return e.json(200, { configured: true, brands: [] });
  }
});
