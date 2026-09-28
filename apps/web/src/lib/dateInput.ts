/**
 * Conversions between stored dates (YYYY-MM-DD, optionally with a time part)
 * and what the DateInput field shows and accepts (DD/MM/YYYY).
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** A local Date as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM-DD (time part ignored) as a local Date, or undefined when invalid. */
export function parseIsoDate(value: string | undefined | null): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!match) return undefined;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : undefined;
}

/** "2027-03-14" → "14/03/2027"; "" for empty or invalid input. */
export function isoToDisplay(value: string | undefined | null): string {
  const date = parseIsoDate(value);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : "";
}

/** Keeps up to 8 typed digits and inserts the slashes: "1403" → "14/03". */
export function maskDateDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

/**
 * "14/03/2027" → "2027-03-14". "" when the field is empty, null while it is
 * incomplete or not a real date (e.g. 31/02/2027).
 */
export function displayToIso(text: string): string | null {
  if (text.trim() === "") return "";
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return parseIsoDate(iso) ? iso : null;
}
