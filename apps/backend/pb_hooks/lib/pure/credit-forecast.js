/**
 * Credit wallets (prepaid App Store Credit and the like): when do the
 * subscriptions billed to an account use up its balance?
 *
 * Mirrored in web/src/lib/creditForecast.ts so the Credit page shows exactly
 * what the reminder cron (cron_credit.pb.js) acts on. Dates are YYYY-MM-DD.
 *
 * Subscriptions passed in are plain objects already converted to the wallet's
 * currency: { id, name, amount, cycle, frequency, next_payment, start_date,
 * end_date, cancellation_date, inactive, record_type }.
 */
var renewal = require("./member-renewal.js");

var MONTHS_PER_CYCLE = { Monthly: 1, Quarterly: 3, "Half-Yearly": 6, Yearly: 12 };
var DAYS_PER_CYCLE = { Daily: 1, Weekly: 7 };

function addDays(isoDate, days) {
  var day = renewal.toDay(isoDate);
  if (!day) return "";
  var parts = day.split("-");
  var date = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2] + days));
  return date.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
function daysBetween(from, to) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}

/** The k-th billing date counted from the anchor (k may be negative). */
function nthCharge(anchor, cycle, frequency, k) {
  var f = Math.max(1, Math.floor(Number(frequency) || 1));
  if (MONTHS_PER_CYCLE[cycle]) return renewal.addMonths(anchor, k * f * MONTHS_PER_CYCLE[cycle]);
  return addDays(anchor, k * f * DAYS_PER_CYCLE[cycle]);
}

/** Billing dates of a subscription within [from, to], inside its own lifetime. */
function chargeDates(sub, from, to) {
  if (!sub || sub.inactive || sub.record_type === "credit") return [];
  var anchor = renewal.toDay(sub.next_payment);
  if (!anchor) return [];
  var lower = from;
  var start = renewal.toDay(sub.start_date);
  if (start && start > lower) lower = start;
  var upper = to;
  [sub.end_date, sub.cancellation_date].forEach(function (bound) {
    var day = renewal.toDay(bound);
    if (day && day < upper) upper = day;
  });
  if (lower > upper) return [];

  var cycle = sub.cycle;
  if (!MONTHS_PER_CYCLE[cycle] && !DAYS_PER_CYCLE[cycle]) {
    // One-time (or unknown) cycles charge once, on the anchor.
    return anchor >= lower && anchor <= upper ? [anchor] : [];
  }

  var k = 0;
  // Walk back to the first charge on or after `lower`...
  while (k > -5000 && nthCharge(anchor, cycle, sub.frequency, k - 1) >= lower) k--;
  while (k < 5000 && nthCharge(anchor, cycle, sub.frequency, k) < lower) k++;
  // ...then collect forward until `upper`.
  var dates = [];
  for (var guard = 0; guard < 5000; guard++, k++) {
    var date = nthCharge(anchor, cycle, sub.frequency, k);
    if (date > upper) break;
    dates.push(date);
  }
  return dates;
}

function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Monthly cost of a subscription in the wallet's currency. */
function monthlyAmount(sub) {
  if (!sub || sub.inactive || sub.record_type === "credit") return 0;
  var f = Math.max(1, Math.floor(Number(sub.frequency) || 1));
  var amount = Number(sub.amount) || 0;
  if (MONTHS_PER_CYCLE[sub.cycle]) return amount / (f * MONTHS_PER_CYCLE[sub.cycle]);
  if (DAYS_PER_CYCLE[sub.cycle]) return (amount * 30.44) / (f * DAYS_PER_CYCLE[sub.cycle]);
  return 0;
}

/**
 * Simulates the wallet from its first entry until `today + horizonDays`.
 * Same-day order: charges first, then entries (a balance read that day
 * already reflects the day's charges). Charges on the first entry's own day
 * are not counted: the wallet starts there.
 *
 * Returns { balance, hasEntries, lastTopup, monthlyBurn, nextCharges,
 * runOutDate, daysLeft, shortfall }. runOutDate is the first charge the
 * balance could not cover since the latest entry recorded up to today; it can
 * lie in the past (daysLeft negative) when no top-up followed it.
 */
function forecastWallet(options) {
  var entries = (options.entries || [])
    .map(function (e) {
      return { type: e.type, amount: Number(e.amount) || 0, date: renewal.toDay(e.date), created: e.created || "" };
    })
    .filter(function (e) { return e.date; })
    .sort(function (a, b) {
      return compare(a.date, b.date) || compare(a.created, b.created);
    });
  var subs = options.subscriptions || [];
  var today = options.today;
  var horizon = addDays(today, options.horizonDays === undefined ? 730 : options.horizonDays);
  var start = entries.length > 0 ? entries[0].date : today;

  var charges = [];
  subs.forEach(function (sub) {
    chargeDates(sub, addDays(start, 1), horizon).forEach(function (date) {
      charges.push({ date: date, amount: Number(sub.amount) || 0, subscriptionId: sub.id, name: sub.name });
    });
  });
  charges.sort(function (a, b) {
    return compare(a.date, b.date) || compare(a.name, b.name);
  });

  var balance = 0;
  var balanceToday = 0;
  var runOutDate = null;
  var shortfall = 0;
  var nextCharges = [];
  var ci = 0;
  var ei = 0;
  while (ci < charges.length || ei < entries.length) {
    var takeCharge = ei >= entries.length || (ci < charges.length && charges[ci].date <= entries[ei].date);
    var date;
    if (takeCharge) {
      var charge = charges[ci++];
      date = charge.date;
      if (runOutDate === null && balance < charge.amount) {
        runOutDate = charge.date;
        shortfall = charge.amount - balance;
      }
      balance -= charge.amount;
      if (charge.date > today) {
        nextCharges.push({
          date: charge.date,
          amount: charge.amount,
          subscriptionId: charge.subscriptionId,
          name: charge.name,
          balanceAfter: balance,
        });
      }
    } else {
      var entry = entries[ei++];
      date = entry.date;
      balance = entry.type === "balance" ? entry.amount : balance + entry.amount;
      // Money recorded up to today supersedes earlier shortfalls: the
      // forecast restarts from what is known now.
      if (date <= today) {
        runOutDate = null;
        shortfall = 0;
      }
    }
    // Events are in date order, so the last one on or before today wins.
    if (date <= today) balanceToday = balance;
  }

  var topups = entries.filter(function (e) { return e.type === "topup"; });
  return {
    balance: balanceToday,
    hasEntries: entries.length > 0,
    lastTopup: topups.length > 0 ? topups[topups.length - 1] : null,
    monthlyBurn: subs.reduce(function (sum, sub) { return sum + monthlyAmount(sub); }, 0),
    nextCharges: nextCharges,
    runOutDate: runOutDate,
    daysLeft: runOutDate === null ? null : daysBetween(today, runOutDate),
    shortfall: shortfall,
  };
}

/**
 * Converts between currencies whose rates are relative to the main currency
 * (rate = units per 1 main unit). A missing or zero rate counts as main.
 */
function convertAmount(amount, fromRate, toRate) {
  var from = Number(fromRate) || 1;
  var to = Number(toRate) || 1;
  return ((Number(amount) || 0) / from) * to;
}

/** Whether a subscription's payment_account belongs to the wallet's account. */
function matchesAccount(paymentAccount, account) {
  var a = String(paymentAccount || "").trim().toLowerCase();
  return a !== "" && a === String(account || "").trim().toLowerCase();
}

function formatMoney(value, symbol) {
  // Goja has no locale data, so group thousands by hand.
  var parts = String(Math.round(value * 100) / 100).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (symbol || "") + parts.join(".");
}

function shortDate(isoDate) {
  var p = isoDate.split("-");
  return p[2] + "-" + p[1] + "-" + p[0].slice(2);
}

/** Title and body of the "credit running low" reminder. */
function creditAlertMessage(wallet, forecast, symbol) {
  var when = forecast.daysLeft === 0 ? "today" : forecast.daysLeft < 0 ? "already" : "in " + forecast.daysLeft + " day(s)";
  var failing = forecast.nextCharges.filter(function (c) { return c.date === forecast.runOutDate; })[0];
  var message =
    "**" + wallet.name + "** (" + wallet.account + ")\n" +
    "Estimated balance: " + formatMoney(forecast.balance, symbol) + "\n" +
    "Runs out " + when + " — " + shortDate(forecast.runOutDate);
  if (failing) message += ": the " + formatMoney(failing.amount, symbol) + " charge for " + failing.name + " will fail";
  message += " (short by " + formatMoney(forecast.shortfall, symbol) + ").\nTop up to keep your subscriptions running.";
  return { title: "💳 Zublo — Credit running low", message: message };
}

module.exports = {
  addDays,
  daysBetween,
  chargeDates,
  monthlyAmount,
  forecastWallet,
  convertAmount,
  matchesAccount,
  creditAlertMessage,
};
