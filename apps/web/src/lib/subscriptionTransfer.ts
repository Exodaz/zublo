import type { utils, WorkBook } from "xlsx";

/**
 * File formats for exporting and importing subscriptions.
 *
 * JSON keeps the backend's export object as-is: subscriptions with their
 * family-sharing members nested inside. Spreadsheets cannot nest, so the
 * workbook has a "Subscriptions" sheet and a "Members" sheet whose
 * `subscription_id` column points at the subscription row's `id`.
 */

export const SUBSCRIPTIONS_SHEET = "Subscriptions";
export const MEMBERS_SHEET = "Members";

type Row = Record<string, unknown>;

/** The slices of the SheetJS API used here, so tests can pass small fakes. */
export type SheetUtils = Pick<typeof utils, "sheet_to_json">;
export type WorkbookLike = Pick<WorkBook, "SheetNames" | "Sheets">;

/** Splits exported subscriptions into flat rows for the two workbook sheets. */
export function toSpreadsheetRows(subscriptions: unknown[]): { subscriptions: Row[]; members: Row[] } {
  const subscriptionRows: Row[] = [];
  const memberRows: Row[] = [];

  for (const item of subscriptions) {
    const { members, ...subscription } = (item ?? {}) as Row & { members?: unknown };
    subscriptionRows.push(subscription);
    if (!Array.isArray(members)) continue;
    for (const member of members as Row[]) {
      memberRows.push({
        subscription_id: subscription.id ?? "",
        subscription: subscription.name ?? "",
        ...member,
      });
    }
  }

  return { subscriptions: subscriptionRows, members: memberRows };
}

/** The subscriptions array of a parsed JSON file: a bare array or `{ subscriptions }`. */
export function subscriptionsFromJson(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const list = (parsed as { subscriptions?: unknown }).subscriptions;
    if (Array.isArray(list)) return list;
  }
  return null;
}

/**
 * Rebuilds subscriptions (with nested members) from a workbook. Uses the
 * "Subscriptions" sheet, or the first sheet for files made elsewhere.
 */
export function subscriptionsFromWorkbook(workbook: WorkbookLike, utils: SheetUtils): unknown[] | null {
  const subscriptionSheet =
    workbook.Sheets[SUBSCRIPTIONS_SHEET] ?? workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!subscriptionSheet) return null;

  const rows = utils.sheet_to_json<Row>(subscriptionSheet, { defval: "" });
  const memberSheet = workbook.Sheets[MEMBERS_SHEET];
  const memberRows = memberSheet ? utils.sheet_to_json<Row>(memberSheet, { defval: "" }) : [];

  const membersById = new Map<string, Row[]>();
  for (const { subscription_id: subscriptionId, subscription: _name, ...member } of memberRows) {
    const key = String(subscriptionId ?? "");
    if (!key) continue;
    const list = membersById.get(key) ?? [];
    list.push(member);
    membersById.set(key, list);
  }

  return rows.map((row) => {
    const members = membersById.get(String(row.id ?? ""));
    return members ? { ...row, members } : row;
  });
}

/** Reads a user-picked .json or .xlsx/.xls file into a subscriptions array. */
export async function readImportFile(file: File): Promise<unknown[] | null> {
  if (/\.xlsx?$/i.test(file.name)) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return subscriptionsFromWorkbook(workbook, XLSX.utils);
  }
  return subscriptionsFromJson(JSON.parse(await file.text()));
}
