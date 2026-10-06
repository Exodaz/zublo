import { sanitizeHref } from "@/lib/utils";
import type { MemberPayment } from "@/types";

/** Whether a payment has a slip to open: an uploaded file or a safe (http/https) link. */
export function hasSlip(payment: Pick<MemberPayment, "slip" | "slip_url">): boolean {
  return !!payment.slip || !!sanitizeHref(payment.slip_url);
}

/** A typed slip link is fine when empty or http(s). */
export function isValidSlipLink(value: string): boolean {
  return value.trim() === "" || !!sanitizeHref(value.trim());
}
