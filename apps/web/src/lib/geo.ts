import type { GeoPoint, Place } from "./types";

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Khoảng cách đường thẳng (km). Chỉ dùng để hiển thị quãng đường, KHÔNG tính giá. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Đường thẳng có nhiễu nhẹ — fallback khi OSRM không trả lời.
 * OSRM chỉ phục vụ route visualization/distance display.
 */
export function fallbackGeometry(from: GeoPoint, to: GeoPoint, steps = 48): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from.lat + (to.lat - from.lat) * t;
    const lng = from.lng + (to.lng - from.lng) * t;
    // nhiễu hình sin để tuyến trông như đường phố, biên độ tỉ lệ với độ dài
    const amp = Math.min(0.02, haversineKm(from, to) * 0.12);
    const wobble = Math.sin(t * Math.PI * 3) * amp;
    const wobble2 = Math.cos(t * Math.PI * 5) * amp * 0.4;
    coords.push([lat + wobble2, lng + wobble]);
  }
  return coords;
}

export interface OsrmRoute {
  coordinates: [number, number][];
  distance_km: number;
  duration_minutes: number;
}

const OSRM_BASE = process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org";

/**
 * Gọi OSRM để lấy geometry + distance.
 * Timeout 2.5s, luôn fallback về đường thẳng nếu lỗi mạng.
 */
export async function fetchOsrmRoute(from: GeoPoint, to: GeoPoint): Promise<OsrmRoute & { source: "osrm" | "fallback" }> {
  const fallback = buildFallback(from, to);
  try {
    const url = `${OSRM_BASE}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, { signal: controller.signal, headers: { accept: "application/json" } });
    clearTimeout(timeout);
    if (!res.ok) return fallback;

    const json = (await res.json()) as {
      code?: string;
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const route = json.routes?.[0];
    if (json.code !== "Ok" || !route) return fallback;

    return {
      // OSRM trả [lng, lat] -> đảo về [lat, lng] cho Leaflet
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance_km: route.distance / 1000,
      duration_minutes: Math.max(1, Math.round(route.duration / 60)),
      source: "osrm",
    };
  } catch {
    return fallback;
  }
}

function buildFallback(from: GeoPoint, to: GeoPoint) {
  const straightKm = haversineKm(from, to);
  // hệ số uốn ~1.25 là giả định đường thực dài hơn đường thẳng
  const distance_km = straightKm * 1.25;
  // 22 km/h là tốc độ đô thị trung bình
  const duration_minutes = Math.max(2, Math.round((distance_km / 22) * 60));
  return { coordinates: fallbackGeometry(from, to), distance_km, duration_minutes, source: "fallback" as const };
}

export function placeLabel(p: Place): string {
  return `${p.name}, ${p.address}`;
}