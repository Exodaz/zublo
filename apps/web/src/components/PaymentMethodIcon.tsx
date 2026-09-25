import { useState } from "react";

import { getPaymentIconSrc } from "@/lib/paymentMethodIcons";
import type { PaymentMethod } from "@/types";

export { getPaymentIconSrc } from "@/lib/paymentMethodIcons";

export function PaymentMethodIcon({ method }: { method: PaymentMethod }) {
  const [err, setErr] = useState(false);
  const src = getPaymentIconSrc(method);
  if (src && !err) {
    return (
      <img
        src={src}
        alt={method.name}
        title={method.name}
        className="h-7 w-10 rounded object-contain bg-white p-0.5 shrink-0"
        onError={() => setErr(true)}
      />
    );
  }
  const initials = method.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      title={method.name}
      className="h-7 w-10 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0"
    >
      {initials}
    </span>
  );
}
