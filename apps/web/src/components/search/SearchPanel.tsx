"use client";

import { Navigation } from "lucide-react";

import { LocationCombobox, SearchActions } from "@/components/search/LocationCombobox";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_PLACES } from "@/lib/constants";
import type { Place } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRideStore } from "@/store/useRideStore";

const PRESETS: { label: string; from: number; to: number }[] = [
  { label: "Nhà hát → Times City", from: 0, to: 1 },
  { label: "Hà Nội → Nội Bài", from: 0, to: 7 },
  { label: "Times City → Vincom Royal", from: 1, to: 4 },
  { label: "Hà Nội → Vịnh Hạ Long", from: 0, to: 6 },
  { label: "Landmark 72 → Aeon Long Biên", from: 2, to: 3 },
];

export function SearchPanel() {
  const pickup = useRideStore((s) => s.pickup);
  const destination = useRideStore((s) => s.destination);
  const setPickup = useRideStore((s) => s.setPickup);
  const setDestination = useRideStore((s) => s.setDestination);
  const swapEndpoints = useRideStore((s) => s.swapEndpoints);
  const search = useRideStore((s) => s.search);
  const status = useRideStore((s) => s.status);

  const loading = status === "loading";

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5" aria-label="Tìm chuyến xe">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
        <LocationCombobox
          label="Điểm đi"
          testId="pickup-input"
          value={pickup}
          onChange={setPickup}
          accent="#ef4444"
          icon={<Navigation className="size-3.5" />}
        />

        <div className="flex items-center justify-center lg:pb-1">
          <div className="hidden h-px w-4 bg-border lg:block" aria-hidden />
        </div>

        <LocationCombobox
          label="Điểm đến"
          testId="destination-input"
          value={destination}
          onChange={setDestination}
          accent="#22c55e"
          icon={<Navigation className="size-3.5" />}
        />

        <SearchActions onSearch={() => void search()} onSwap={swapEndpoints} loading={loading} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tuyến nhanh</span>
        {PRESETS.map((preset) => {
          const from = SAMPLE_PLACES[preset.from] as Place;
          const to = SAMPLE_PLACES[preset.to] as Place;
          const active = pickup.id === from.id && destination.id === to.id;
          return (
            <button
              key={preset.label}
              type="button"
              data-testid={`preset-${preset.from}-${preset.to}`}
              onClick={() => {
                setPickup({ ...from });
                setDestination({ ...to });
              }}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <Badge variant="muted" className="font-medium">
          Demo
        </Badge>
        Giá hiển thị do mock engine tạo để minh hoạ giao diện — không phải giá thật của provider.
      </p>
    </section>
  );
}