import { Globe, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandLogoUrl, normalizeBrandDomain } from "@/lib/brandLogo";
import {
  searchServicePresets,
  SERVICE_PRESETS,
  type ServicePreset,
} from "@/lib/serviceCatalog";
import { type BrandSearchResult, brandSearchService } from "@/services/brandSearch";

function BrandIcon({ domain, size = "h-8 w-8" }: { domain: string; size?: string }) {
  return (
    <img
      src={brandLogoUrl(domain, 64) ?? ""}
      alt=""
      className={`${size} shrink-0 rounded-lg border bg-background object-contain`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
}

interface Props {
  /** Current brand domain, "" when none is chosen. */
  value: string;
  onSelect: (preset: ServicePreset) => void;
  onClear: () => void;
}

/**
 * Picks the service a subscription is for. Choosing a preset (or typing any
 * domain) sets the Brandfetch logo; the form decides what else to pre-fill.
 */
export function ServicePicker({ value, onSelect, onClear }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [remote, setRemote] = useState<BrandSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Brandfetch covers every brand the presets do not. Debounced so typing a
  // name costs one request, and aborted when the query changes again.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemote([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      brandSearchService
        .search(q, controller.signal)
        .then((res) => setRemote(res.brands))
        .catch(() => setRemote([]))
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const results = searchServicePresets(query);
  const presetDomains = new Set(results.map((preset) => preset.domain));
  const remoteResults = remote.filter((brand) => !presetDomains.has(brand.domain));
  const typedDomain = normalizeBrandDomain(query);
  const offerCustom =
    !!typedDomain &&
    !presetDomains.has(typedDomain) &&
    !remoteResults.some((brand) => brand.domain === typedDomain);
  const selectedPreset = SERVICE_PRESETS.find((preset) => preset.domain === value);

  const choose = (preset: ServicePreset) => {
    onSelect(preset);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label htmlFor="service-search">{t("service")}</Label>

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
          <BrandIcon domain={value} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selectedPreset?.name ?? value}</p>
            <p className="truncate text-xs text-muted-foreground">{value}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClear}
            title={t("clear_service")}
            aria-label={t("clear_service")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="relative">
        <Input
          id="service-search"
          placeholder={t("search_service_placeholder")}
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />

        {open && (
          <div
            role="listbox"
            aria-label={t("service")}
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
          >
            {offerCustom && (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  choose({ name: "", domain: typedDomain, url: `https://${typedDomain}` })
                }
                className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Globe className="h-8 w-8 shrink-0 rounded-lg border p-1.5 text-muted-foreground" />
                <span className="truncate">{t("use_domain", { domain: typedDomain })}</span>
              </button>
            )}
            {results.map((preset) => (
              <button
                key={preset.domain}
                type="button"
                role="option"
                aria-selected={preset.domain === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(preset)}
                className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <BrandIcon domain={preset.domain} />
                <span className="min-w-0 flex-1 truncate font-medium">{preset.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{preset.domain}</span>
              </button>
            ))}
            {remoteResults.length > 0 && (
              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Brandfetch
              </p>
            )}
            {remoteResults.map((brand) => (
              <button
                key={`remote-${brand.domain}`}
                type="button"
                role="option"
                aria-selected={brand.domain === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  choose({ name: brand.name, domain: brand.domain, url: `https://${brand.domain}` })
                }
                className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <BrandIcon domain={brand.domain} />
                <span className="min-w-0 flex-1 truncate font-medium">{brand.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{brand.domain}</span>
              </button>
            ))}
            {searching && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("loading")}</p>
            )}
            {results.length === 0 && remoteResults.length === 0 && !offerCustom && !searching && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                {t("no_services_found")}
              </p>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("service_hint")}</p>
    </div>
  );
}
