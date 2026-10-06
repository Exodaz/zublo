import { hasSlip, isValidSlipLink } from "./memberSlip";

describe("memberSlip", () => {
  it("knows when a payment has a slip", () => {
    expect(hasSlip({ slip: "s.pdf" })).toBe(true);
    expect(hasSlip({ slip_url: "https://line.me/s/abc" })).toBe(true);
    expect(hasSlip({ slip_url: "javascript:alert(1)" })).toBe(false);
    expect(hasSlip({})).toBe(false);
  });

  it("accepts empty or http(s) slip links", () => {
    expect(isValidSlipLink("")).toBe(true);
    expect(isValidSlipLink(" https://drive.google.com/file/d/x ")).toBe(true);
    expect(isValidSlipLink("http://x.test/slip.jpg")).toBe(true);
    expect(isValidSlipLink("ftp://x")).toBe(false);
    expect(isValidSlipLink("not a link")).toBe(false);
  });
});
