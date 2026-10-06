/// <reference path="../pb_data/types.d.ts" />

// ================================================================
// ROUTE: Subscriptions Import
// NOTE: In PocketBase JSVM (Goja), file-scope helper bindings are not
// reliably available inside router callbacks. Require helpers inside
// each callback so the runtime can always resolve them at request time.
// ================================================================
routerAdd("POST", "/api/subscriptions/import", (e) => {
  const dateHelpers = require(__hooks + "/lib/date-helpers.js");
  const importParsers = require(__hooks + "/lib/pure/subscription-import.js");
  const brandLogo = require(__hooks + "/lib/pure/brand-logo.js");
  const recordTypes = require(__hooks + "/lib/pure/record-types.js");
  const recordTypeHelpers = require(__hooks + "/lib/record-type-helpers.js");
  if (!e.auth) throw new ForbiddenError("Authentication required");
  const userId = e.auth.id;
  const data = e.requestInfo().body;

  if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
    return e.json(400, { error: "Invalid format: expected { subscriptions: [...] }" });
  }
  if (data.subscriptions.length === 0) {
    return e.json(400, { error: "No subscriptions to import" });
  }

  // Detect format: Wallos uses PascalCase keys like "Name", "Payment Cycle"
  const isWallos = importParsers.detectWallosFormat(data.subscriptions[0]);

  // ---- Lookup caches to avoid repeated DB queries ----
  const categoryCache = {};
  const paymentMethodCache = {};
  const payerCache = {};
  const currencyByCodeCache = {};
  const cycleCache = {};

  function findOrCreate(collection, filter, params, setFields) {
    try {
      const rows = $app.findRecordsByFilter(collection, filter, "", 1, 0, params);
      if (rows.length > 0) return rows[0].id;
    } catch (_) {}
    try {
      const col = $app.findCollectionByNameOrId(collection);
      const rec = new Record(col);
      for (const [k, v] of Object.entries(setFields)) rec.set(k, v);
      $app.save(rec);
      return rec.id;
    } catch (_) { return ""; }
  }

  function findOrCreateCategory(name) {
    if (!name) return "";
    if (categoryCache[name] !== undefined) return categoryCache[name];
    const id = findOrCreate(
      "categories",
      "user = {:u} && name = {:n}",
      { u: userId, n: name },
      { user: userId, name: name }
    );
    categoryCache[name] = id;
    return id;
  }

  function findOrCreatePaymentMethod(name) {
    if (!name) return "";
    if (paymentMethodCache[name] !== undefined) return paymentMethodCache[name];
    const id = findOrCreate(
      "payment_methods",
      "user = {:u} && name = {:n}",
      { u: userId, n: name },
      { user: userId, name: name }
    );
    paymentMethodCache[name] = id;
    return id;
  }

  function findOrCreatePayer(name) {
    if (!name) return "";
    if (payerCache[name] !== undefined) return payerCache[name];
    const id = findOrCreate(
      "household",
      "user = {:u} && name = {:n}",
      { u: userId, n: name },
      { user: userId, name: name }
    );
    payerCache[name] = id;
    return id;
  }

  function findCurrencyByCode(code) {
    if (!code) return "";
    const key = code.toUpperCase();
    if (currencyByCodeCache[key] !== undefined) return currencyByCodeCache[key];
    try {
      const rows = $app.findRecordsByFilter(
        "currencies", "user = {:u} && code = {:c}", "", 1, 0, { u: userId, c: key }
      );
      currencyByCodeCache[key] = rows.length > 0 ? rows[0].id : "";
      return currencyByCodeCache[key];
    } catch (_) { return ""; }
  }

  // Wallos only exports the currency symbol as prefix of the price string.
  // Try to match against user's currencies first, then fall back to a common map.
  function findCurrencyBySymbol(symbol) {
    if (!symbol) return "";
    try {
      const rows = $app.findRecordsByFilter(
        "currencies", "user = {:u} && symbol = {:s}", "", 1, 0, { u: userId, s: symbol }
      );
      if (rows.length > 0) return rows[0].id;
    } catch (_) {}
    const symbolToCode = {
      "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR",
      "₩": "KRW", "₫": "VND", "฿": "THB", "Fr": "CHF", "R": "ZAR",
      "₺": "TRY", "zł": "PLN", "Kč": "CZK", "₴": "UAH", "₱": "PHP",
      "RM": "MYR", "Rp": "IDR", "₦": "NGN", "kr": "SEK",
      "R$": "BRL", "A$": "AUD", "C$": "CAD", "HK$": "HKD",
      "S$": "SGD", "NZ$": "NZD",
    };
    return findCurrencyByCode(symbolToCode[symbol] || "");
  }

  function findCycleByName(name) {
    if (!name) return "";
    if (cycleCache[name] !== undefined) return cycleCache[name];
    try {
      const rows = $app.findRecordsByFilter("cycles", "name = {:n}", "", 1, 0, { n: name });
      cycleCache[name] = rows.length > 0 ? rows[0].id : "";
      return cycleCache[name];
    } catch (_) { return ""; }
  }

  function getUserMainCurrency() {
    try { return $app.findRecordById("users", userId).get("main_currency"); } catch (_) { return ""; }
  }

  const mainCurrencyId = getUserMainCurrency();
  const subsCol = $app.findCollectionByNameOrId("subscriptions");
  const membersCol = $app.findCollectionByNameOrId("subscription_members");
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    members_imported: 0,
    members_updated: 0,
    errors: [],
  };

  // Own-format rows update an existing subscription instead of duplicating
  // it: matched by the exported id (only the caller's own records), else by
  // name ignoring case. Wallos rows are always created.
  function findExisting(row) {
    if (isWallos) return null;
    const id = String(row.id || "").trim();
    if (id) {
      try {
        const byId = $app.findRecordById("subscriptions", id);
        if (byId.getString("user") === userId) return byId;
      } catch (_) {}
    }
    const name = String(row.name || "").trim().toLowerCase();
    if (!name) return null;
    const byName = $app.findRecordsByFilter(
      "subscriptions", "user = {:u} && name:lower = {:n}", "", 1, 0, { u: userId, n: name }
    );
    return byName.length > 0 ? byName[0] : null;
  }

  for (let i = 0; i < data.subscriptions.length; i++) {
    const sub = data.subscriptions[i];
    try {
      let name, price, currencyId, cycleId, frequency, nextPayment, recordType;
      let autoRenew, inactive, notes, url, notify, notifyDaysBefore, cancellationDate;
      let endDate, paymentLimit, paymentsCompleted;
      let categoryId, paymentMethodId, payerId;
      let autoMarkPaid = false, brandDomain = "", paymentAccount = "", members = [];
      let memberCurrencyId = "";
      let startDate = "";
      let hasMembers = false;

      const existing = findExisting(sub);
      // A key missing from the row keeps the stored value, so a partial file
      // (e.g. only name + price) never wipes the rest of a subscription.
      const has = (key) => Object.prototype.hasOwnProperty.call(sub, key);
      // Stored numbers/bools come back as-is; dates and text as strings, the
      // same shape an exported file carries.
      const NATIVE = { price: 1, frequency: 1, notify_days_before: 1, payment_limit: 1,
        payments_completed: 1, auto_renew: 1, inactive: 1, notify: 1, auto_mark_paid: 1 };
      const val = (key) => {
        if (!existing || has(key)) return sub[key];
        return NATIVE[key] ? existing.get(key) : existing.getString(key);
      };
      const relation = (key, resolve) =>
        existing && !has(key) ? existing.getString(key) : resolve(sub[key]);

      if (isWallos) {
        // ── Wallos format ──
        name = (sub["Name"] || "").trim();
        notes = sub["Notes"] || "";
        url = sub["URL"] || "";
        nextPayment = sub["Next Payment"] || new Date().toISOString().split("T")[0];
        autoRenew = sub["Renewal"] === "Automatic";
        inactive = sub["Active"] === "No" || sub["State"] === "Disabled";
        notify = sub["Notifications"] === "Enabled";
        notifyDaysBefore = 3;
        cancellationDate = sub["Cancellation Date"] || "";
        endDate = "";
        paymentLimit = 0;
        paymentsCompleted = 0;
        recordType = "expense";

        // "€9.99" → symbol="€", price=9.99
        const priceInfo = importParsers.parseWallosPrice(sub["Price"]);
        let symbol = priceInfo.symbol;
        price = priceInfo.price;
        currencyId = (symbol ? findCurrencyBySymbol(symbol) : "") || mainCurrencyId;

        const { cycleName, frequency: freq } = importParsers.parseCycleAndFrequency(sub["Payment Cycle"]);
        cycleId = findCycleByName(cycleName);
        frequency = freq;

        categoryId = findOrCreateCategory(sub["Category"]);
        paymentMethodId = findOrCreatePaymentMethod(sub["Payment Method"]);
        payerId = findOrCreatePayer(sub["Paid By"]);

      } else {
        // ── Own export format ──
        name = String(val("name") || "").trim();
        price = parseFloat(val("price")) || 0;
        notes = val("notes") || "";
        url = val("url") || "";
        nextPayment = val("next_payment") || new Date().toISOString().split("T")[0];
        autoRenew = !!val("auto_renew");
        inactive = !!val("inactive");
        notify = !!val("notify");
        // 0 ("on the day") is a valid choice, so only a missing value defaults.
        const daysBefore = parseInt(val("notify_days_before"), 10);
        notifyDaysBefore = isFinite(daysBefore) && daysBefore >= 0 ? daysBefore : 3;
        startDate = importParsers.normalizeImportDate(val("start_date"));
        cancellationDate = importParsers.normalizeImportDate(val("cancellation_date"));
        endDate = importParsers.normalizeImportDate(val("end_date"));
        paymentLimit = Math.max(0, parseInt(val("payment_limit")) || 0);
        paymentsCompleted = Math.max(0, parseInt(val("payments_completed")) || 0);
        recordType = recordTypes.normalizeRecordType(val("record_type"));
        if (recordType === "expense" && paymentLimit > 0) {
          endDate = "";
          paymentsCompleted = Math.min(paymentsCompleted, paymentLimit);
          if (paymentsCompleted >= paymentLimit) inactive = true;
          autoRenew = true;
        } else if (recordType === "expense" && endDate) {
          autoRenew = true;
        }

        currencyId = relation("currency", (code) => (code ? findCurrencyByCode(code) : "")) || mainCurrencyId;
        cycleId = relation("cycle", (cycleName) =>
          findCycleByName(cycleName || (recordType === "credit" ? recordTypes.ONE_TIME_CYCLE : "Monthly"))
        );
        frequency = parseInt(val("frequency")) || 1;

        categoryId = relation("category", findOrCreateCategory);
        paymentMethodId = relation("payment_method", findOrCreatePaymentMethod);
        payerId = relation("payer", findOrCreatePayer);

        // Fields added after the first export format; absent in older files.
        autoMarkPaid = !!val("auto_mark_paid");
        brandDomain = brandLogo.normalizeBrandDomain(val("brand_domain"));
        paymentAccount = String(val("payment_account") || "").trim().slice(0, 255);
        memberCurrencyId = relation("member_currency", (code) => (code ? findCurrencyByCode(code) : ""));
        hasMembers = has("members");
        members = importParsers.normalizeImportedMembers(sub.members);
      }

      if (!name) {
        results.skipped++;
        results.errors.push({ index: i, reason: "Missing name" });
        continue;
      }
      if (recordType === "expense" && endDate && nextPayment && endDate < String(nextPayment).slice(0, 10)) {
        results.skipped++;
        results.errors.push({ index: i, name: name, reason: "end_date cannot be before next_payment" });
        continue;
      }
      if (!cycleId) {
        results.errors.push({ index: i, name: name, warning: "Unknown cycle, defaulting to Monthly" });
        cycleId = findCycleByName("Monthly");
      }

      const rec = existing || new Record(subsCol);
      rec.set("user", userId);
      rec.set("name", name);
      rec.set("price", price);
      rec.set("frequency", frequency);
      rec.set("next_payment", nextPayment);
      rec.set("auto_renew", autoRenew);
      rec.set("inactive", inactive);
      rec.set("notify", notify);
      rec.set("notify_days_before", notifyDaysBefore);
      rec.set("payment_limit", paymentLimit);
      rec.set("payments_completed", paymentsCompleted);
      rec.set("notes", notes);
      rec.set("url", url);
      rec.set("auto_mark_paid", autoMarkPaid);
      rec.set("brand_domain", brandDomain);
      rec.set("payment_account", paymentAccount);
      if (startDate) rec.set("start_date", startDate);
      // Empty values clear optional fields on update; on create they are unset anyway.
      rec.set("cancellation_date", cancellationDate);
      rec.set("end_date", endDate);
      if (currencyId) rec.set("currency", currencyId);
      if (!isWallos) rec.set("member_currency", memberCurrencyId || "");
      if (cycleId) rec.set("cycle", cycleId);
      rec.set("category", categoryId || "");
      rec.set("payment_method", paymentMethodId || "");
      rec.set("payer", payerId || "");

      const policyError = recordTypeHelpers.applyRecordTypeToRecord($app, rec, recordType);
      if (policyError) {
        results.skipped++;
        results.errors.push({ index: i, name: name, reason: policyError });
        continue;
      }

      $app.save(rec);
      if (existing) results.updated++;
      else results.imported++;

      if (!hasMembers) continue;

      // Merge members: matched by email (else name) are updated, new ones are
      // added, and members missing from the file are left alone.
      const current = {};
      if (existing) {
        for (const m of $app.findRecordsByFilter(
          "subscription_members", "subscription = {:s}", "", 0, 0, { s: rec.id }
        )) {
          current[importParsers.memberMatchKey({
            name: m.getString("name"),
            email: m.getString("email"),
          })] = m;
        }
      }

      for (const member of members) {
        try {
          const key = importParsers.memberMatchKey(member);
          const m = current[key] || new Record(membersCol);
          m.set("subscription", rec.id);
          m.set("user", userId);
          m.set("name", member.name);
          m.set("email", member.email);
          m.set("amount", member.amount);
          m.set("expires_at", member.expires_at);
          m.set("notes", member.notes);
          // Older files have no period; keep the one already on the member.
          if (member.renewal_months > 0) m.set("renewal_months", member.renewal_months);
          $app.save(m);
          if (current[key]) {
            results.members_updated++;
          } else {
            results.members_imported++;
            current[key] = m;
          }
        } catch (err) {
          results.errors.push({
            index: i,
            name: name,
            warning: "Member '" + member.name + "' not imported: " + String(err),
          });
        }
      }
    } catch (err) {
      results.skipped++;
      results.errors.push({ index: i, name: sub.name || sub["Name"] || "?", reason: String(err) });
    }
  }

  return e.json(200, results);
});

// ================================================================
// ROUTE: Subscription Clone
// ================================================================
routerAdd("POST", "/api/subscription/clone", (e) => {
  const recordTypeHelpers = require(__hooks + "/lib/record-type-helpers.js");
  if (!e.auth) throw new ForbiddenError("Authentication required");
  const data = e.requestInfo().body;
  const subId = data.id;

  if (!subId) {
    return e.json(400, { error: "Missing subscription id" });
  }

  const original = $app.findRecordById("subscriptions", subId);

  if (original.get("user") !== e.auth.id) {
    throw new ForbiddenError("Not your subscription");
  }

  const col = $app.findCollectionByNameOrId("subscriptions");
  const clone = new Record(col);

  // Copy all fields except id and the finite-schedule progress. A clone starts a
  // fresh schedule: payment_limit and end_date are structural bounds worth
  // keeping, but payments_completed must reset to 0 and an inactive source must
  // not produce a dead clone.
  const fieldsToCopy = [
    "name", "price", "record_type", "frequency", "next_payment", "auto_renew",
    "start_date", "notes", "url", "notify", "notify_days_before",
    "cancellation_date", "currency", "member_currency", "cycle",
    "end_date", "payment_limit", "auto_mark_paid",
    "payment_method", "payer", "category", "user",
  ];

  for (const field of fieldsToCopy) {
    clone.set(field, original.get(field));
  }

  // A clone always starts active with a clean installment count.
  clone.set("inactive", false);
  clone.set("payments_completed", 0);

  const policyError = recordTypeHelpers.applyRecordTypeToRecord($app, clone, clone.get("record_type"));
  if (policyError) return e.json(400, { error: policyError });

  // Logo needs special handling (file copy)
  $app.save(clone);

  return e.json(200, { id: clone.id, message: "Subscription cloned" });
});

// ================================================================
// ROUTE: Subscription Renew
// ================================================================
routerAdd("POST", "/api/subscription/renew", (e) => {
  const dateHelpers = require(__hooks + "/lib/date-helpers.js");
  const recordTypes = require(__hooks + "/lib/pure/record-types.js");
  const subscriptionLimits = require(__hooks + "/lib/pure/subscription-limits.js");
  if (!e.auth) throw new ForbiddenError("Authentication required");
  const data = e.requestInfo().body;
  const subId = data.id;

  if (!subId) {
    return e.json(400, { error: "Missing subscription id" });
  }

  const sub = $app.findRecordById("subscriptions", subId);

  if (sub.get("user") !== e.auth.id) {
    throw new ForbiddenError("Not your subscription");
  }

  if (recordTypes.isCredit(sub.get("record_type"))) {
    return e.json(400, { error: "Credits cannot be renewed" });
  }

  const cycleRecord = $app.findRecordById("cycles", sub.get("cycle"));
  const cycleName = cycleRecord.get("name");
  const frequency = sub.get("frequency");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = subscriptionLimits.advanceFiniteSchedule({
    nextPayment: sub.get("next_payment"),
    today: dateHelpers.formatLocalDate(today),
    cycleName: cycleName,
    frequency: frequency,
    endDate: sub.get("end_date"),
    paymentLimit: sub.get("payment_limit"),
    paymentsCompleted: sub.get("payments_completed"),
    inactive: sub.get("inactive"),
    advanceDate: dateHelpers.advanceDate,
  });

  sub.set("next_payment", result.nextPayment);
  sub.set("payments_completed", result.paymentsCompleted);
  sub.set("inactive", result.inactive);
  $app.save(sub);

  return e.json(200, {
    next_payment: sub.get("next_payment"),
    payments_completed: sub.get("payments_completed"),
    inactive: sub.get("inactive"),
  });
});

// ================================================================
// ROUTE: Subscription History
//
// Replays the append-only log written by subscription_history.pb.js: the
// change events themselves, the price timeline they describe, and what that
// timeline adds up to since the subscription started.
// ================================================================
routerAdd("GET", "/api/subscription/history", (e) => {
  const history = require(__hooks + "/lib/subscription-history.js");
  const requestQuery = require(__hooks + "/lib/pure/request-query.js");
  if (!e.auth) throw new ForbiddenError("Authentication required");

  const subId = requestQuery.getQueryParam(e, "id");
  if (!subId) {
    return e.json(400, { error: "Missing subscription id" });
  }

  let sub;
  try {
    sub = $app.findRecordById("subscriptions", subId);
  } catch (_) {
    return e.json(404, { error: "Subscription not found" });
  }

  if (sub.get("user") !== e.auth.id) {
    throw new ForbiddenError("Not your subscription");
  }

  return e.json(200, history.buildHistoryResponse($app, sub));
});

// ================================================================
// ROUTE: Subscriptions Export
// ================================================================
routerAdd("GET", "/api/subscriptions/export", (e) => {
  const recordTypes = require(__hooks + "/lib/pure/record-types.js");
  if (!e.auth) throw new ForbiddenError("Authentication required");
  const userId = e.auth.id;

  const subs = $app.findRecordsByFilter(
    "subscriptions", "user = {:userId}", "name", 0, 0, { userId: userId }
  );

  const exported = [];

  for (const sub of subs) {
    let currencySymbol = "", currencyCode = "";
    try {
      const cur = $app.findRecordById("currencies", sub.get("currency"));
      currencySymbol = cur.get("symbol");
      currencyCode = cur.get("code");
    } catch (_) { }

    let memberCurrencyCode = "";
    if (sub.getString("member_currency")) {
      try {
        memberCurrencyCode = $app.findRecordById("currencies", sub.getString("member_currency")).getString("code");
      } catch (_) { }
    }

    let cycleName = "";
    try {
      const cycle = $app.findRecordById("cycles", sub.get("cycle"));
      cycleName = cycle.get("name");
    } catch (_) { }

    let paymentName = "";
    try {
      const pm = $app.findRecordById("payment_methods", sub.get("payment_method"));
      paymentName = pm.get("name");
    } catch (_) { }

    let categoryName = "";
    try {
      const cat = $app.findRecordById("categories", sub.get("category"));
      categoryName = cat.get("name");
    } catch (_) { }

    let payerName = "";
    try {
      const payer = $app.findRecordById("household", sub.get("payer"));
      payerName = payer.get("name");
    } catch (_) { }

    const members = $app.findRecordsByFilter(
      "subscription_members", "subscription = {:id}", "name", 0, 0, { id: sub.id }
    ).map((m) => ({
      name: m.getString("name"),
      email: m.getString("email"),
      amount: m.get("amount"),
      expires_at: m.getString("expires_at").slice(0, 10),
      notes: m.getString("notes"),
      renewal_months: m.getInt("renewal_months"),
    }));

    exported.push({
      // Stable reference within one export file; spreadsheet exports use it
      // to tie rows of the Members sheet to their subscription.
      id: sub.id,
      name: sub.get("name"),
      record_type: recordTypes.normalizeRecordType(sub.get("record_type")),
      price: sub.get("price"),
      currency: currencyCode,
      currency_symbol: currencySymbol,
      cycle: cycleName,
      frequency: sub.get("frequency"),
      next_payment: sub.get("next_payment"),
      start_date: sub.get("start_date"),
      category: categoryName,
      payment_method: paymentName,
      payer: payerName,
      auto_renew: sub.get("auto_renew"),
      inactive: sub.get("inactive"),
      notify: sub.get("notify"),
      notify_days_before: sub.get("notify_days_before"),
      notes: sub.get("notes"),
      url: sub.get("url"),
      cancellation_date: sub.get("cancellation_date"),
      end_date: sub.get("end_date"),
      payment_limit: sub.get("payment_limit"),
      payments_completed: sub.get("payments_completed"),
      auto_mark_paid: sub.get("auto_mark_paid"),
      brand_domain: sub.getString("brand_domain"),
      payment_account: sub.getString("payment_account"),
      member_currency: memberCurrencyCode,
      members: members,
    });
  }

  return e.json(200, {
    format: "zublo",
    version: 2,
    exported_at: new Date().toISOString(),
    subscriptions: exported,
  });
});
