/**
 * Renewal dates for member payments. Mirrors pb_hooks/lib/pure/member-renewal.js
 * so the payment form previews exactly what the backend stores.
 */
import { parseIsoDate, toIsoDate } from "@/lib/dateInput";

/** YYYY-MM-DD (time part ignored), or "" when not a real date. */
export function toDay(value: string | undefined | null): string {
  const date = parseIsoDate(value);
  return date ? toIsoDate(date) : "";
}

/** Adds whole months, clamping to the end of shorter months (31 Jan + 1 → 28/29 Feb). */
export function addMonths(isoDate: string, months: number): string {
  const date = parseIsoDate(isoDate);
  if (!date || !Number.isFinite(months)) return "";
  const target = new Date(date.getFullYear(), date.getMonth() + Math.floor(months), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return toIsoDate(target);
}

/** A renewal counts from the member's current expiry, else from the payment date. */
export function computeExpiry(
  currentExpiry: string | undefined,
  paidAt: string,
  months: number,
): string {
  const base = toDay(currentExpiry) || toDay(paidAt);
  if (!base || !(months > 0)) return "";
  return addMonths(base, months);
}
