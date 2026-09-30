"use client";

import { ArrowDownUp, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PROVIDERS, VEHICLE_CATEGORIES } from "@/lib/constants";
import type { ProviderId, SortMode, VehicleCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRideStore } from "@/store/useRideStore";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "eta_asc", label: "Tài xế đến nhanh nhất" },
];

export function FilterBar() {
  const activeProviders = useRideStore((s) => s.activeProviders);
  const activeCategories = useRideStore((s) => s.activeCategories);
  const onlyAvailable = useRideStore((s) => s.onlyAvailable);
  const sortMode = useRideStore((s) => s.sortMode);
  const toggleProvider = useRideStore((s) => s.toggleProvider);
  const toggleCategory = useRideStore((s) => s.toggleCategory);
  const setOnlyAvailable = useRideStore((s) => s.setOnlyAvailable);
  const setSortMode = useRideStore((s) => s.setSortMode);
  const resetFilters = useRideStore((s) => s.resetFilters);

  const dirty =
    activeProviders.length !== PROVIDERS.length ||
    activeCategories.length !== VEHICLE_CATEGORIES.length ||
    onlyAvailable ||
    sortMode !== "price_asc";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {/* provider chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Provider</span>
          {PROVIDERS.map((p) => {
            const active = activeProviders.includes(p.id as ProviderId);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProvider(p.id as ProviderId)}
                data-testid={`filter-provider-${p.id}`}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                  active ? "border-transparent text-white shadow-sm" : "border-border text-muted-foreground hover:bg-accent",
                )}
                style={active ? { backgroundColor: p.brand } : undefined}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
            <Switch checked={onlyAvailable} onCheckedChange={setOnlyAvailable} data-testid="filter-only-available" />
            Chỉ hiện xe còn trống
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ArrowDownUp className="size-3.5" aria-hidden />
            <span className="sr-only sm:not-sr-only">Sắp xếp</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              data-testid="sort-select"
              className="h-8 rounded-md border bg-background px-2 text-xs font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            disabled={!dirty}
            data-testid="reset-filters"
            title="Bỏ lọc"
          >
            <RotateCcw aria-hidden />
            <span className="hidden sm:inline">Bỏ lọc</span>
          </Button>
        </div>
      </div>

      {/* category chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-2.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Loại xe</span>
        {VEHICLE_CATEGORIES.map((c) => {
          const active = activeCategories.includes(c.id as VehicleCategory);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCategory(c.id as VehicleCategory)}
              data-testid={`filter-category-${c.id}`}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <span aria-hidden className="mr-1">
                {c.icon}
              </span>
              {c.label}
            </button>
          );
        })}
        {onlyAvailable && (
          <Badge variant="success" className="ml-auto font-medium">
            Đang lọc: còn xe
          </Badge>
        )}
      </div>
    </div>
  );
}