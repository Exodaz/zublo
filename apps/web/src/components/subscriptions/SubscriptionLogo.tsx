import { useState } from "react";

import { cn } from "@/lib/utils";
import { subscriptionsService } from "@/services/subscriptions";
import type { Subscription } from "@/types";

/**
 * A subscription's logo: the uploaded file, else its Brandfetch brand logo
 * (see subscriptionsService.logoUrl), else — or when the image fails to
 * load — the first letter of its name.
 */
export function SubscriptionLogo({
  sub,
  imgClassName,
  fallbackClassName,
}: {
  sub: Subscription;
  imgClassName?: string;
  fallbackClassName?: string;
}) {
  const src = subscriptionsService.logoUrl(sub);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={sub.name}
        className={cn("h-full w-full", imgClassName)}
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center bg-primary/10 text-primary",
        fallbackClassName,
      )}
    >
      {sub.name[0]?.toUpperCase()}
    </span>
  );
}
