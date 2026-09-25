import { brandLogoUrl } from "@/lib/brandLogo";
import { paymentMethodsService } from "@/services/paymentMethods";
import type { PaymentMethod } from "@/types";

/** Bundled icons in /assets/payments, keyed by lower-case method name. */
export const PAYMENT_ICON_MAP: Record<string, string> = {
  visa: "Visa.png",
  mastercard: "Mastercard.png",
  "american express": "Amex.png",
  amex: "Amex.png",
  discover: "Discover.png",
  "diners club": "DinersClub.png",
  jcb: "JCB.png",
  unionpay: "unionpay.png",
  "union pay": "unionpay.png",
  maestro: "Maestro.png",
  paypal: "PayPal.png",
  "apple pay": "ApplePay.png",
  "google pay": "GooglePay.png",
  "samsung pay": "samsungpay.png",
  "amazon pay": "amazonpay.png",
  alipay: "alipay.png",
  "wechat pay": "wechat.png",
  wechat: "wechat.png",
  venmo: "venmo.png",
  stripe: "Stripe.png",
  klarna: "Klarna.png",
  affirm: "affirm.png",
  skrill: "skrill.png",
  paysafecard: "paysafe.png",
  paysafe: "paysafe.png",
  ideal: "ideal.png",
  bancontact: "bancontact.png",
  giropay: "gitopay.png",
  sofort: "sofort.png",
  payoneer: "Payoneer.png",
  interac: "Interac.png",
  bitcoin: "Bitcoin.png",
  "bitcoin cash": "BitcoinCash.png",
  ethereum: "Etherium.png",
  litecoin: "Lightcoin.png",
  yandex: "Yandex.png",
  elo: "elo.png",
  qiwi: "qiwi.png",
  bitpay: "bitpay.png",
  "direct debit": "directdebit.png",
  directdebit: "directdebit.png",
  poli: "poli.png",
  webmoney: "webmoney.png",
  verifone: "verifone.png",
  "shop pay": "shoppay.png",
  shoppay: "shoppay.png",
  "facebook pay": "facebookpay.png",
  citadele: "citadele.png",
};

/**
 * Methods shown with a Brandfetch brand logo instead of a bundled icon. The
 * logo is hotlinked like every brand logo (see lib/brandLogo.ts).
 */
export const PAYMENT_BRAND_DOMAINS: Record<string, string> = {
  "app store credit": "appstore.com",
  "app store": "appstore.com",
  "apple app store": "appstore.com",
  "itunes credit": "appstore.com",
  "google play credit": "play.google.com",
  "google play": "play.google.com",
};

/**
 * Icon for a payment method: its uploaded icon, else a bundled icon or brand
 * logo matched by name, else null (callers fall back to initials).
 */
export function getPaymentIconSrc(method: PaymentMethod): string | null {
  if (method.icon) return paymentMethodsService.iconUrl(method);
  const key = method.name.trim().toLowerCase();
  if (PAYMENT_ICON_MAP[key]) return `/assets/payments/${PAYMENT_ICON_MAP[key]}`;
  return brandLogoUrl(PAYMENT_BRAND_DOMAINS[key]);
}
