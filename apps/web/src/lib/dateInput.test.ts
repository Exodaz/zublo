import { displayToIso, isoToDisplay, maskDateDigits, parseIsoDate, toIsoDate } from "./dateInput";

describe("dateInput helpers", () => {
  it("converts between Date and YYYY-MM-DD", () => {
    expect(toIsoDate(new Date(2027, 2, 4))).toBe("2027-03-04");
    expect(parseIsoDate("2027-03-14 00:00:00.000Z")?.getDate()).toBe(14);
    expect(parseIsoDate("2027-02-30")).toBeUndefined();
    expect(parseIsoDate("")).toBeUndefined();
    expect(parseIsoDate(null)).toBeUndefined();
  });

  it("shows stored dates as DD/MM/YYYY", () => {
    expect(isoToDisplay("2027-03-14")).toBe("14/03/2027");
    expect(isoToDisplay("2027-03-14 00:00:00.000Z")).toBe("14/03/2027");
    expect(isoToDisplay("")).toBe("");
    expect(isoToDisplay(undefined)).toBe("");
  });

  it("masks typed digits into DD/MM/YYYY", () => {
    expect(maskDateDigits("1")).toBe("1");
    expect(maskDateDigits("140")).toBe("14/0");
    expect(maskDateDigits("14/03/20")).toBe("14/03/20");
    expect(maskDateDigits("14032027999")).toBe("14/03/2027");
    expect(maskDateDigits("ab")).toBe("");
  });

  it("reads complete real dates and flags the rest", () => {
    expect(displayToIso("14/03/2027")).toBe("2027-03-14");
    expect(displayToIso("  ")).toBe("");
    expect(displayToIso("14/03")).toBeNull();
    expect(displayToIso("31/02/2027")).toBeNull();
  });
});
