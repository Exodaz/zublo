import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import type { MemberExpiry } from "@/lib/memberExpiry";

export function MemberExpiryBadge({ expiry }: { expiry: MemberExpiry }) {
  const { t } = useTranslation();

  if (expiry.status === "none" || expiry.daysLeft === null) {
    return <Badge variant="outline">{t("member_no_expiry")}</Badge>;
  }
  if (expiry.status === "expired") {
    return (
      <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
        {t("member_expired")}
      </Badge>
    );
  }
  if (expiry.status === "expiring") {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
        {expiry.daysLeft === 0
          ? t("member_expires_today")
          : t("member_expires_in_days", { count: expiry.daysLeft })}
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/15 dark:text-green-400">
      {t("member_active")}
    </Badge>
  );
}
