"use client";

import { MapPin, Search, ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SAMPLE_PLACES } from "@/lib/constants";
import type { Place } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LocationComboboxProps {
  label: string;
  value: Place;
  accent: string;
  icon: React.ReactNode;
  testId: string;
  onChange: (place: Place) => void;
}

/** Ô nhập điểm đi/đến: text field + gợi ý địa điểm (Popover). */
export function LocationCombobox({
  label,
  value,
  accent,
  icon,
  testId,
  onChange,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const listboxId = `${testId}-listbox`;

  const results = filterPlaces(draft);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid={testId}
            aria-label={`${label}: ${value.name}`}
            className={cn(
              "flex h-11 w-full items-center gap-2 rounded-lg border bg-card px-3 text-left text-sm shadow-sm",
              "transition-[border-color,box-shadow] outline-none",
              "hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25",
              open && "border-ring ring-[3px] ring-ring/25",
            )}
          >
            <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{value.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{value.address}</span>
            </span>
          </button>
        </PopoverTrigger>

        <PopoverAnchor asChild>
          <div className="hidden" />
        </PopoverAnchor>

        <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="start">
          <div className="border-b p-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Tìm ${label.toLowerCase()}...`}
              aria-label={`Tìm ${label.toLowerCase()}`}
              data-testid={`${testId}-search`}
              className="h-9 w-full rounded-md border bg-background px-2.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </div>
          <ul id={listboxId} role="listbox" className="sunnee-scrollbar max-h-64 overflow-y-auto p-1">
            {results.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">Không tìm thấy địa điểm</li>
            )}
            {results.map((place) => (
              <li key={place.id} role="option" aria-selected={place.id === value.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...place });
                    setDraft("");
                    setOpen(false);
                  }}
                  data-testid={`${testId}-option-${place.id}`}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-accent",
                    place.id === value.id && "bg-accent",
                  )}
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{place.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{place.address}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function filterPlaces(query: string): Place[] {
  const q = deaccent(query).trim().toLowerCase();
  const all = SAMPLE_PLACES as readonly Place[];
  if (!q) return all.slice(0, 6);
  return all.filter((p) => deaccent(`${p.name} ${p.address}`).toLowerCase().includes(q)).slice(0, 8);
}

function deaccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Nút tìm + nút đảo chiều */
export function SearchActions({
  onSearch,
  onSwap,
  loading,
}: {
  onSearch: () => void;
  onSwap: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onSwap}
        aria-label="Đảo chiều điểm đi và điểm đến"
        data-testid="swap-endpoints"
        title="Đảo chiều"
        className="size-11 shrink-0"
      >
        <ArrowUpDown />
      </Button>
      <Button size="lg" onClick={onSearch} disabled={loading} data-testid="search-button" className="h-11 flex-1 sm:flex-none sm:px-8">
        <Search aria-hidden />
        {loading ? "Đang tìm..." : "Tìm giá"}
      </Button>
    </div>
  );
}