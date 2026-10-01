import { useTranslation } from "react-i18next";

import type { Subscription } from "@/types";

/** Native select of subscriptions ("groups"), "" meaning all of them. */
export function GroupFilter({
  subscriptions,
  value,
  onChange,
}: {
  subscriptions: Subscription[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <select
      aria-label={t("group")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border bg-background px-2 text-sm"
    >
      <option value="">{t("all_groups")}</option>
      {subscriptions.map((sub) => (
        <option key={sub.id} value={sub.id}>
          {sub.name}
        </option>
      ))}
    </select>
  );
}
