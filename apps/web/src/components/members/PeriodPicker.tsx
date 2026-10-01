import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MONTH_KEYS } from "@/components/calendar/constants";
import { Button } from "@/components/ui/button";
import { currentPeriod, type Period, type PeriodMode, stepPeriod } from "@/lib/memberLedger";
import { cn } from "@/lib/utils";

/** This month / this year / all time, with ‹ › stepping for months and years. */
export function PeriodPicker({
  period,
  onChange,
}: {
  period: Period;
  onChange: (period: Period) => void;
}) {
  const { t } = useTranslation();

  const setMode = (mode: PeriodMode) => {
    const now = currentPeriod();
    onChange({ ...now, mode, year: mode === "all" ? now.year : period.year });
  };

  const label =
    period.mode === "month"
      ? `${t(MONTH_KEYS[period.month - 1])} ${period.year}`
      : period.mode === "year"
        ? String(period.year)
        : t("period_all_time");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border bg-background/50 p-1" role="group" aria-label={t("period")}>
        {(["month", "year", "all"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={period.mode === mode}
            onClick={() => setMode(mode)}
            className={cn(
              "rounded-lg px-3 py-1 text-sm font-medium transition-colors",
              period.mode === mode ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {t(`period_mode_${mode}`)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {period.mode !== "all" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t("previous")}
            onClick={() => onChange(stepPeriod(period, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <span className="min-w-[7.5rem] text-center text-sm font-semibold">{label}</span>
        {period.mode !== "all" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t("next")}
            onClick={() => onChange(stepPeriod(period, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
