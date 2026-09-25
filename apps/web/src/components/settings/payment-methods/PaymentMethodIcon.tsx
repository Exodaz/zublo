import { useState } from "react";

import { getPaymentIconSrc } from "@/lib/paymentMethodIcons";
import type { PaymentMethod } from "@/types";

export function PaymentMethodIcon({
  method,
  size = 40,
}: {
  method: PaymentMethod;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const src = getPaymentIconSrc(method);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={method.name}
        width={size}
        height={size}
        className="rounded-lg object-contain bg-white p-0.5"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = method.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="rounded-lg bg-muted flex items-center justify-center font-semibold text-muted-foreground text-xs shrink-0"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}
