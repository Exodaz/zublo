function detectWallosFormat(subscription) {
  return Object.prototype.hasOwnProperty.call(subscription || {}, "Name") ||
    Object.prototype.hasOwnProperty.call(subscription || {}, "Payment Cycle");
}

function parseCycleAndFrequency(paymentCycle) {
  if (!paymentCycle) return { cycleName: "Monthly", frequency: 1 };
  var normalized = String(paymentCycle).toLowerCase().trim();
  var direct = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };
  if (direct[normalized]) return { cycleName: direct[normalized], frequency: 1 };

  var match = String(paymentCycle).match(/every\s+(\d+)\s+(days?|weeks?|months?|years?)/i);
  if (!match) return { cycleName: "Monthly", frequency: 1 };

  var unitMap = {
    day: "Daily",
    days: "Daily",
    week: "Weekly",
    weeks: "Weekly",
    month: "Monthly",
    months: "Monthly",
    year: "Yearly",
    years: "Yearly",
  };

  return {
    /* v8 ignore next -- regex only captures day/week/month/year variants, all present in unitMap */
    cycleName: unitMap[match[2].toLowerCase()] || "Monthly",
    frequency: parseInt(match[1], 10),
  };
}

function parseWallosPrice(priceValue) {
  var raw = String(priceValue || "0");
  var match = raw.match(/^([^\d]*)(\d[\d.,]*)$/);
  if (!match) {
    return { symbol: "", price: parseFloat(raw) || 0 };
  }
  return {
    symbol: match[1].trim(),
    price: parseFloat(match[2].replace(",", ".")) || 0,
  };
}

/**
 * A date cell from JSON or a spreadsheet as YYYY-MM-DD, or "" when absent or
 * unreadable. Spreadsheets may hand over Excel serial day numbers.
 */
function normalizeImportDate(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number" && isFinite(value)) {
    // Excel serial: days since 1899-12-30 (the 1900 leap-year bug included).
    var ms = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  var match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  var check = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  if (check.getUTCMonth() !== +match[2] - 1 || check.getUTCDate() !== +match[3]) return "";
  return match[0];
}

/**
 * Family-sharing members attached to an imported subscription, cleaned up:
 * entries without a name are dropped, amounts are non-negative numbers and
 * dates are YYYY-MM-DD. Anything that is not an array yields [].
 */
function normalizeImportedMembers(raw) {
  if (!Array.isArray(raw)) return [];
  var members = [];
  for (var i = 0; i < raw.length; i++) {
    var item = raw[i];
    if (!item || typeof item !== "object") continue;
    var name = String(item.name == null ? "" : item.name).trim();
    if (!name) continue;
    var amount = parseFloat(item.amount);
    members.push({
      name: name.slice(0, 255),
      email: String(item.email == null ? "" : item.email).trim(),
      amount: isFinite(amount) && amount > 0 ? amount : 0,
      expires_at: normalizeImportDate(item.expires_at),
      notes: String(item.notes == null ? "" : item.notes).slice(0, 1000),
    });
  }
  return members;
}

module.exports = {
  detectWallosFormat,
  parseCycleAndFrequency,
  parseWallosPrice,
  normalizeImportDate,
  normalizeImportedMembers,
};
