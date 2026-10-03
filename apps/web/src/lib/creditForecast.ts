/**
 * Credit wallets: when do the subscriptions billed to an account use up its
 * prepaid balance? Mirrors pb_hooks/lib/pure/credit-forecast.js so the Credit
 * page shows exactly what the reminder cron acts on. Dates are YYYY-MM-DD.
 */
import { toIsoDate } from "@/lib/dateInput";
import { addMonths, toDay } from "@/lib/memberRenewal";
import type { CreditEntry, CreditWallet, Currency, Subscription } from "@/types";

const MONTHS_PER_CYCLE: Record<string, number> = { Monthly: 1, Quarterly: 3, "Half-Yearly": 6, Yearly: 12 };
const DAYS_PER_CYCLE: Record<string, number> = { Daily: 1, Weekly: 7 };

/** A subscription as the forecast sees it, priced in the wallet's currency. */
export interface WalletSubscription {
  id: string;
  name: string;
  amount: number;
  cycle: string;
  frequency?: number;
  next_payment?: string;
  start_date?: string;
  end_date?: string;
  cancellation_date?: string;
  inactive?: boolean;
  record_type?: string;
}

export interface ForecastEntry {
  type: "topup" | "balance";
  amount: number;
  date: string;
  created?: string;
}

export interface ForecastCharge {
  date: string;
  amount: number;
  subscriptionId: string;
  name: string;
  balanceAfter: number;
}

export interface WalletForecast {
  /** Estimated balance as of today. */
  balance: number;
  hasEntries: boolean;
  lastTopup: ForecastEntry | null;
  monthlyBurn: number;
  /** Charges after today, with the balance left after each. */
  nextCharges: ForecastCharge[];
  /** First charge the balance cannot cover, or null within the horizon. */
  runOutDate: string | null;
  daysLeft: number | null;
  shortfall: number;
}

export function addDays(isoDate: string, days: number): string {
  const day = toDay(isoDate);
  if (!day) return "";
  const [y, m, d] = day.split("-").map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function stepFactor(frequency: unknown): number {
  return Math.max(1, Math.floor(Number(frequency) || 1));
}

function nthCharge(anchor: string, cycle: string, frequency: unknown, k: number): string {
  const f = stepFactor(frequency);
  if (MONTHS_PER_CYCLE[cycle]) return addMonths(anchor, k * f * MONTHS_PER_CYCLE[cycle]);
  return addDays(anchor, k * f * DAYS_PER_CYCLE[cycle]);
}

/** Billing dates of a subscription within [from, to], inside its own lifetime. */
export function chargeDates(sub: WalletSubscription | null, from: string, to: string): string[] {
  if (!sub || sub.inactive || sub.record_type === "credit") return [];
  const anchor = toDay(sub.next_payment);
  if (!anchor) return [];
  let lower = from;
  const start = toDay(sub.start_date);
  if (start && start > lower) lower = start;
  let upper = to;
  for (const bound of [sub.end_date, sub.cancellation_date]) {
    const day = toDay(bound);
    if (day && day < upper) upper = day;
  }
  if (lower > upper) return [];

  const { cycle } = sub;
  if (!MONTHS_PER_CYCLE[cycle] && !DAYS_PER_CYCLE[cycle]) {
    // One-time (or unknown) cycles charge once, on the anchor.
    return anchor >= lower && anchor <= upper ? [anchor] : [];
  }

  let k = 0;
  // Walk back to the first charge on or after `lower`, then collect forward.
  while (k > -5000 && nthCharge(anchor, cycle, sub.frequency, k - 1) >= lower) k--;
  while (k < 5000 && nthCharge(anchor, cycle, sub.frequency, k) < lower) k++;
  const dates: string[] = [];
  for (let guard = 0; guard < 5000; guard++, k++) {
    const date = nthCharge(anchor, cycle, sub.frequency, k);
    if (date > upper) break;
    dates.push(date);
  }
  return dates;
}

/** Monthly cost of a subscription in the wallet's currency. */
export function monthlyAmount(sub: WalletSubscription): number {
  if (sub.inactive || sub.record_type === "credit") return 0;
  const f = stepFactor(sub.frequency);
  const amount = Number(sub.amount) || 0;
  if (MONTHS_PER_CYCLE[sub.cycle]) return amount / (f * MONTHS_PER_CYCLE[sub.cycle]);
  if (DAYS_PER_CYCLE[sub.cycle]) return (amount * 30.44) / (f * DAYS_PER_CYCLE[sub.cycle]);
  return 0;
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Simulates the wallet from its first entry until `today + horizonDays`.
 * Same-day order: charges first, then entries (a balance read that day
 * already reflects the day's charges). Money recorded up to today clears
 * earlier shortfalls, so the run-out date is the first charge that fails
 * after what is known now.
 */
export function forecastWallet({
  entries: rawEntries = [],
  subscriptions = [],
  today,
  horizonDays = 730,
}: {
  entries?: ForecastEntry[];
  subscriptions?: WalletSubscription[];
  today: string;
  horizonDays?: number;
}): WalletForecast {
  const entries = rawEntries
    .map((e) => ({ type: e.type, amount: Number(e.amount) || 0, date: toDay(e.date), created: e.created ?? "" }))
    .filter((e) => e.date)
    .sort((a, b) => compare(a.date, b.date) || compare(a.created, b.created));
  const horizon = addDays(today, horizonDays);
  const start = entries.length > 0 ? entries[0].date : today;

  const charges = subscriptions
    .flatMap((sub) =>
      chargeDates(sub, addDays(start, 1), horizon).map((date) => ({
        date,
        amount: Number(sub.amount) || 0,
        subscriptionId: sub.id,
        name: sub.name,
      })),
    )
    .sort((a, b) => compare(a.date, b.date) || compare(a.name, b.name));

  let balance = 0;
  let balanceToday = 0;
  let runOutDate: string | null = null;
  let shortfall = 0;
  const nextCharges: ForecastCharge[] = [];
  let ci = 0;
  let ei = 0;
  while (ci < charges.length || ei < entries.length) {
    const takeCharge = ei >= entries.length || (ci < charges.length && charges[ci].date <= entries[ei].date);
    let date: string;
    if (takeCharge) {
      const charge = charges[ci++];
      date = charge.date;
      if (runOutDate === null && balance < charge.amount) {
        runOutDate = charge.date;
        shortfall = charge.amount - balance;
      }
      balance -= charge.amount;
      if (charge.date > today) nextCharges.push({ ...charge, balanceAfter: balance });
    } else {
      const entry = entries[ei++];
      date = entry.date;
      balance = entry.type === "balance" ? entry.amount : balance + entry.amount;
      if (date <= today) {
        runOutDate = null;
        shortfall = 0;
      }
    }
    if (date <= today) balanceToday = balance;
  }

  const topups = entries.filter((e) => e.type === "topup");
  return {
    balance: balanceToday,
    hasEntries: entries.length > 0,
    lastTopup: topups.at(-1) ?? null,
    monthlyBurn: subscriptions.reduce((sum, sub) => sum + monthlyAmount(sub), 0),
    nextCharges,
    runOutDate,
    daysLeft: runOutDate === null ? null : daysBetween(today, runOutDate),
    shortfall,
  };
}

// ── Adapters for the Credit page ─────────────────────────────────────────────

/** Converts between currencies whose rates are relative to the main currency. */
export function convertAmount(amount: number, fromRate?: number, toRate?: number): number {
  return ((Number(amount) || 0) / (Number(fromRate) || 1)) * (Number(toRate) || 1);
}

/** Whether a subscription's payment_account belongs to the wallet's account. */
export function matchesAccount(paymentAccount: string | undefined, account: string | undefined): boolean {
  const a = (paymentAccount ?? "").trim().toLowerCase();
  return a !== "" && a === (account ?? "").trim().toLowerCase();
}

function rateOf(currency: Currency | undefined): number {
  return currency && !currency.is_main ? currency.rate : 1;
}

/** Subscriptions billed to the wallet's account, priced in the wallet's currency. */
export function walletSubscriptions(
  subscriptions: Subscription[],
  account: string,
  walletCurrency: Currency | undefined,
): { sub: Subscription; forecast: WalletSubscription }[] {
  return subscriptions
    .filter((sub) => matchesAccount(sub.payment_account, account))
    .map((sub) => ({
      sub,
      forecast: {
        id: sub.id,
        name: sub.name,
        amount: convertAmount(sub.price, rateOf(sub.expand?.currency), rateOf(walletCurrency)),
        cycle: sub.expand?.cycle?.name ?? "",
        frequency: sub.frequency,
        next_payment: sub.next_payment,
        start_date: sub.start_date,
        end_date: sub.end_date,
        cancellation_date: sub.cancellation_date,
        inactive: sub.inactive,
        record_type: sub.record_type,
      },
    }));
}

export function toForecastEntries(entries: CreditEntry[]): ForecastEntry[] {
  return entries.map((e) => ({ type: e.type, amount: e.amount, date: e.date, created: e.created }));
}

export type WalletUrgency = "danger" | "warning" | "ok" | "empty";

/** Card colour: red under a week (or already failing), amber within a month. */
export function walletUrgency(forecast: WalletForecast): WalletUrgency {
  if (!forecast.hasEntries) return "empty";
  if (forecast.daysLeft === null) return "ok";
  if (forecast.daysLeft < 7) return "danger";
  return forecast.daysLeft <= 30 ? "warning" : "ok";
}

/**
 * List order: wallets that run out soonest first (already empty ones on top),
 * then wallets still waiting for a first entry, then those that last, by name.
 */
export function sortByUrgency<T extends { wallet: { name: string }; forecast: WalletForecast }>(rows: T[]): T[] {
  const rank = ({ forecast }: T) =>
    !forecast.hasEntries ? Number.MAX_SAFE_INTEGER - 1 : (forecast.daysLeft ?? Number.MAX_SAFE_INTEGER);
  return [...rows].sort((a, b) => rank(a) - rank(b) || a.wallet.name.localeCompare(b.wallet.name));
}

/** Payment accounts in use, preferring App Store Credit ones, minus those with a wallet. */
export function suggestedAccounts(subscriptions: Subscription[], wallets: CreditWallet[]): string[] {
  const isAppStore = (sub: Subscription) =>
    /app store credit/i.test(sub.expand?.payment_method?.name ?? "");
  const pool = subscriptions.some((sub) => isAppStore(sub) && sub.payment_account?.trim())
    ? subscriptions.filter(isAppStore)
    : subscriptions;
  const taken = new Set(wallets.map((w) => w.account.trim().toLowerCase()));
  const seen = new Map<string, string>();
  for (const sub of pool) {
    const account = sub.payment_account?.trim() ?? "";
    const key = account.toLowerCase();
    if (account && !taken.has(key) && !seen.has(key)) seen.set(key, account);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/** Every distinct payment account, for the wallet form's suggestions. */
export function knownAccounts(subscriptions: Subscription[]): string[] {
  return suggestedAccounts(subscriptions.map((sub) => ({ ...sub, expand: undefined })), []);
}
