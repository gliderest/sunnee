"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";
import type { Place, RideQuote, RouteGeometry } from "@/lib/types";

/**
 * Leaflet chỉ chạy được ở browser (cần window/document).
 * `ssr: false` + dynamic import để không vỡ lúc server render.
 */
const RouteMapInner = dynamic(
  () => import("@/components/map/RouteMap").then((m) => m.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    ),
  },
);

export function RouteMap(props: {
  route: RouteGeometry | null;
  pickup: Place;
  destination: Place;
  selectedQuote: RideQuote | null;
  className?: string;
}) {
  return <RouteMapInner {...props} />;
}