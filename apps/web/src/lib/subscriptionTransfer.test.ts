const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  sheetToJson: vi.fn(),
}));

vi.mock("xlsx", () => ({
  read: mocks.read,
  utils: { sheet_to_json: mocks.sheetToJson },
}));

import {
  MEMBERS_SHEET,
  readImportFile,
  type SheetUtils,
  SUBSCRIPTIONS_SHEET,
  subscriptionsFromJson,
  subscriptionsFromWorkbook,
  toSpreadsheetRows,
  type WorkbookLike,
} from "./subscriptionTransfer";

/** Fake SheetJS: each "sheet" is simply its array of rows. */
const fakeUtils = {
  sheet_to_json: (sheet: unknown) => sheet as Record<string, unknown>[],
} as unknown as SheetUtils;

function workbook(sheets: Record<string, unknown>): WorkbookLike {
  return { SheetNames: Object.keys(sheets), Sheets: sheets } as unknown as WorkbookLike;
}

describe("toSpreadsheetRows", () => {
  it("lifts members into their own rows linked by subscription id", () => {
    expect(
      toSpreadsheetRows([
        { id: "s1", name: "Netflix", price: 419, members: [{ name: "Alice", amount: 400 }] },
        { id: "s2", name: "Spotify", members: "not a list" },
        { name: "No id" },
        null,
      ]),
    ).toEqual({
      subscriptions: [
        { id: "s1", name: "Netflix", price: 419 },
        { id: "s2", name: "Spotify" },
        { name: "No id" },
        {},
      ],
      members: [{ subscription_id: "s1", subscription: "Netflix", name: "Alice", amount: 400 }],
    });
  });

  it("uses empty references for members of a subscription without id or name", () => {
    expect(toSpreadsheetRows([{ members: [{ name: "Bob" }] }]).members).toEqual([
      { subscription_id: "", subscription: "", name: "Bob" },
    ]);
  });
});

describe("subscriptionsFromJson", () => {
  it("accepts a bare array or an export object", () => {
    expect(subscriptionsFromJson([{ name: "a" }])).toEqual([{ name: "a" }]);
    expect(subscriptionsFromJson({ format: "zublo", subscriptions: [{ name: "b" }] })).toEqual([
      { name: "b" },
    ]);
  });

  it("rejects anything else", () => {
    expect(subscriptionsFromJson({ subscriptions: "x" })).toBeNull();
    expect(subscriptionsFromJson({})).toBeNull();
    expect(subscriptionsFromJson(null)).toBeNull();
    expect(subscriptionsFromJson("text")).toBeNull();
  });
});

describe("subscriptionsFromWorkbook", () => {
  it("re-nests members under their subscription", () => {
    const result = subscriptionsFromWorkbook(
      workbook({
        [SUBSCRIPTIONS_SHEET]: [
          { id: "s1", name: "Netflix" },
          { id: "s2", name: "Spotify" },
          { name: "Loose" },
        ],
        [MEMBERS_SHEET]: [
          { subscription_id: "s1", subscription: "Netflix", name: "Alice" },
          { subscription_id: "s1", subscription: "Netflix", name: "Bob" },
          { subscription_id: "", name: "Orphan" },
          { name: "No reference" },
        ],
      }),
      fakeUtils,
    );

    expect(result).toEqual([
      { id: "s1", name: "Netflix", members: [{ name: "Alice" }, { name: "Bob" }] },
      { id: "s2", name: "Spotify" },
      { name: "Loose" },
    ]);
  });

  it("falls back to the first sheet and works without a members sheet", () => {
    expect(subscriptionsFromWorkbook(workbook({ Sheet1: [{ name: "Only" }] }), fakeUtils)).toEqual([
      { name: "Only" },
    ]);
  });

  it("returns null for a workbook without sheets", () => {
    expect(subscriptionsFromWorkbook(workbook({}), fakeUtils)).toBeNull();
  });
});

describe("readImportFile", () => {
  beforeEach(() => {
    mocks.read.mockReset();
    mocks.sheetToJson.mockReset();
  });

  it("parses JSON files", async () => {
    const file = new File(['{"subscriptions":[{"name":"a"}]}'], "backup.json");
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve('{"subscriptions":[{"name":"a"}]}'),
    });
    await expect(readImportFile(file)).resolves.toEqual([{ name: "a" }]);
    expect(mocks.read).not.toHaveBeenCalled();
  });

  it("reads Excel files through SheetJS", async () => {
    const buffer = new ArrayBuffer(4);
    const file = new File(["xlsx"], "Backup.XLSX");
    Object.defineProperty(file, "arrayBuffer", { value: () => Promise.resolve(buffer) });
    mocks.read.mockReturnValue(
      workbook({ [SUBSCRIPTIONS_SHEET]: "subs-sheet" }),
    );
    mocks.sheetToJson.mockReturnValue([{ id: "s1", name: "Netflix" }]);

    await expect(readImportFile(file)).resolves.toEqual([{ id: "s1", name: "Netflix" }]);
    expect(mocks.read).toHaveBeenCalledWith(buffer, { type: "array" });
    expect(mocks.sheetToJson).toHaveBeenCalledWith("subs-sheet", { defval: "" });
  });
});
