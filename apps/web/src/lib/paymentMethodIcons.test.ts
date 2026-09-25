vi.mock("@/services/paymentMethods", () => ({
  paymentMethodsService: {
    iconUrl: (method: { icon?: string }) => (method.icon ? `/files/${method.icon}` : null),
  },
}));

import { getPaymentIconSrc, PAYMENT_BRAND_DOMAINS, PAYMENT_ICON_MAP } from "./paymentMethodIcons";

const method = (name: string, icon?: string) => ({ id: "pm", user: "u", name, icon });

describe("getPaymentIconSrc", () => {
  it("prefers an uploaded icon", () => {
    expect(getPaymentIconSrc(method("App Store Credit", "mine.png"))).toBe("/files/mine.png");
  });

  it("uses bundled icons by name, ignoring case and surrounding spaces", () => {
    expect(getPaymentIconSrc(method("Visa"))).toBe("/assets/payments/Visa.png");
    expect(getPaymentIconSrc(method(" webmoney "))).toBe("/assets/payments/webmoney.png");
  });

  it("shows the App Store logo for App Store Credit and its aliases", () => {
    for (const name of ["App Store Credit", "app store", "Apple App Store", "iTunes Credit"]) {
      expect(getPaymentIconSrc(method(name))).toBe("/api/brand-logo?domain=appstore.com&size=128");
    }
    expect(getPaymentIconSrc(method("Google Play Credit"))).toBe(
      "/api/brand-logo?domain=play.google.com&size=128",
    );
  });

  it("returns null for unknown methods", () => {
    expect(getPaymentIconSrc(method("Cash"))).toBeNull();
  });

  it("keeps bundled icons and brand domains separate", () => {
    for (const key of Object.keys(PAYMENT_BRAND_DOMAINS)) {
      expect(PAYMENT_ICON_MAP[key]).toBeUndefined();
    }
  });
});
