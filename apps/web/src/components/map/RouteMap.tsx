"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

import { CATEGORY_MAP } from "@/lib/constants";
import { formatDistance, formatEta, formatVND } from "@/lib/format";
import type { Place, RideQuote, RouteGeometry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RouteMapProps {
  route: RouteGeometry | null;
  pickup: Place;
  destination: Place;
  selectedQuote: RideQuote | null;
  className?: string;
}

/**
 * Leaflet chỉ để HIỂN THỊ route/quãng đường cho user.
 * Không dùng bản đồ để tính giá (rule trong spec).
 * OSRM chỉ cung cấp geometry + distance, giá luôn lấy từ provider.
 */
export function RouteMap({ route, pickup, destination, selectedQuote, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ route?: L.Polyline; markers: L.Marker[]; selected?: L.Circle }>({ markers: [] });

  // khởi tạo map 1 lần
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([pickup.lat, pickup.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    // vô hiệu hoá scroll-wheel zoom để không cuộn trang khi rê chuột trên map
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());

    // resize khi layout đổi (ví dụ đóng sidebar)
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [pickup.lat, pickup.lng]);

  // vẽ route + marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;

    layers.route?.remove();
    layers.route = undefined;
    layers.markers.forEach((m) => m.remove());
    layers.markers = [];
    layers.selected?.remove();
    layers.selected = undefined;

    if (route && route.coordinates.length > 1) {
      layers.route = L.polyline(route.coordinates, {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.85,
        lineJoin: "round",
      }).addTo(map);
    }

    const markerIcon = (color: string, glyph: string) =>
      L.divIcon({
        className: "",
        html: `<span style="
              display:grid;place-items:center;
              width:28px;height:28px;border-radius:999px;
              background:${color};color:#fff;font-size:13px;font-weight:800;
              border:2.5px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.28);
            ">${glyph}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

    const pickupMarker = L.marker([pickup.lat, pickup.lng], {
      icon: markerIcon("#ef4444", "●"),
      zIndexOffset: 1000,
    }).addTo(map);
    pickupMarker.bindPopup(`<strong>Điểm đi</strong><br/>${pickup.name}`, { closeButton: false });

    const destMarker = L.marker([destination.lat, destination.lng], {
      icon: markerIcon("#22c55e", "●"),
      zIndexOffset: 1000,
    }).addTo(map);
    destMarker.bindPopup(`<strong>Điểm đến</strong><br/>${destination.name}`, { closeButton: false });

    layers.markers = [pickupMarker, destMarker];

    // fit bounds theo route
    const points: [number, number][][] = [route ? route.coordinates : [], [[pickup.lat, pickup.lng], [destination.lat, destination.lng]]];
    const all = points.flat();
    if (all.length > 1) {
      map.fitBounds(L.latLngBounds(all), { padding: [42, 42], animate: true });
    }

    // vòng tròn highlight chuyến đang chọn
    if (selectedQuote) {
      const accent = CATEGORY_MAP[selectedQuote.vehicle_category].accent;
      layers.selected = L.circle([pickup.lat, pickup.lng], {
        radius: 1200,
        color: accent,
        weight: 2,
        opacity: 0.55,
        fillColor: accent,
        fillOpacity: 0.12,
      }).addTo(map);
    }
  }, [route, pickup, destination, selectedQuote]);

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        ref={containerRef}
        data-testid="route-map"
        role="application"
        aria-label="Bản đồ tuyến đường"
        className="flex-1 rounded-xl border border-border/70"
      />

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Stat label="Quãng đường" value={route ? formatDistance(route.distance_km) : "—"} testId="stat-distance" />
        <Stat label="Thời gian đi" value={route ? formatEta(route.duration_minutes) : "—"} testId="stat-duration" />
        <Stat label="Nguồn route" value={route?.source === "osrm" ? "OSRM" : "Ước tính"} testId="stat-route-source" />
        <Stat label="Giá thấp nhất" value={selectedQuote ? formatVND(selectedQuote.price) : "—"} testId="stat-cheapest" />
      </dl>
    </div>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-2.5 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold tabular-nums" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}