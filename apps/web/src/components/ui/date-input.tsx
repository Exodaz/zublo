import "react-day-picker/style.css";

import { CalendarDays } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { displayToIso, isoToDisplay, maskDateDigits, parseIsoDate, toIsoDate } from "@/lib/dateInput";
import { cn } from "@/lib/utils";

interface DateInputProps {
  id?: string;
  name?: string;
  /** Stored value: YYYY-MM-DD, or "" for no date. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// react-day-picker colours taken from the app theme so it fits light and dark.
const PICKER_THEME = {
  "--rdp-accent-color": "hsl(var(--primary))",
  "--rdp-accent-background-color": "hsl(var(--primary) / 0.15)",
  "--rdp-today-color": "hsl(var(--primary))",
} as CSSProperties;

/**
 * Date field shown as DD/MM/YYYY regardless of the browser's language, with a
 * calendar popover. Native `<input type="date">` follows the OS locale (e.g.
 * MM/DD/YYYY), which this replaces.
 */
export function DateInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  disabled,
  required,
  className,
}: DateInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(() => isoToDisplay(value));
  const [lastValue, setLastValue] = useState(value);
  const [open, setOpen] = useState(false);

  // Follow value changes made outside the field (form reset, calendar pick)
  // without clobbering what the user is still typing.
  if (value !== lastValue) {
    setLastValue(value);
    if (displayToIso(text) !== (parseIsoDate(value) ? value.slice(0, 10) : "")) {
      setText(isoToDisplay(value));
    }
  }

  const selected = parseIsoDate(value);

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        name={name}
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        autoComplete="off"
        value={text}
        disabled={disabled}
        required={required}
        className="pr-10"
        onChange={(event) => {
          const masked = maskDateDigits(event.target.value);
          setText(masked);
          const iso = displayToIso(masked);
          if (iso !== null) onChange(iso);
        }}
        onBlur={() => {
          // Drop an incomplete or impossible date instead of keeping it half-typed.
          if (displayToIso(text) === null) setText(isoToDisplay(value));
          onBlur?.();
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={t("open_calendar")}
            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <DayPicker
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={new Date(2060, 11)}
            selected={selected}
            defaultMonth={selected}
            style={PICKER_THEME}
            onSelect={(date) => {
              if (!date) return;
              const iso = toIsoDate(date);
              setText(isoToDisplay(iso));
              onChange(iso);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
