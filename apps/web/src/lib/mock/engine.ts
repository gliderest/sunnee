import { createHash } from "crypto";

import type { GeoPoint, Place, ProviderId, RideQuote, VehicleCategory } from "../types";
import { haversineKm } from "../geo";

/**
 * MOCK PROVIDER ENGINE — chỉ dùng cho frontend demo.
 *
 * Thay thế bằng Supabase/worker thật ở Phase 2: API route `/api/quotes` gọi
 * `generateQuotes()`; khi có worker, đổi sang đọc `ride_quotes` từ Supabase.
 * Giá ở đây là số giả để minh hoạ UI, KHÔNG phải giá thật của provider.
 */

interface ServiceSpec {
  provider: ProviderId;
  service: string;
  vehicle_category: VehicleCategory;
  /** giá cơ bản cho đoạn ~6km ban đêm */
  base: number;
  /** độ dốc giá theo km */
  perKm: number;
  /** phần thưởng đông/tối */
  surge: number;
  speedKmh: number;
}

/** Danh mục service mà provider trả về — mô phỏng đúng nhóm normalize trong spec */
const SERVICES: ServiceSpec[] = [
  { provider: "grab", service: "GrabBike", vehicle_category: "bike", base: 22_000, perKm: 5_400, surge: 0.15, speedKmh: 26 },
  { provider: "grab", service: "GrabCar", vehicle_category: "car_4", base: 68_000, perKm: 13_500, surge: 0.12, speedKmh: 24 },
  { provider: "grab", service: "GrabCar 7", vehicle_category: "car_7", base: 96_000, perKm: 17_500, surge: 0.14, speedKmh: 23 },
  { provider: "grab", service: "GrabCar Premium", vehicle_category: "premium", base: 128_000, perKm: 21_000, surge: 0.18, speedKmh: 22 },

  { provider: "be", service: "beBike", vehicle_category: "bike", base: 20_500, perKm: 5_150, surge: 0.12, speedKmh: 25 },
  { provider: "be", service: "beCarX", vehicle_category: "car_4", base: 64_000, perKm: 12_900, surge: 0.1, speedKmh: 24 },
  { provider: "be", service: "beCarY", vehicle_category: "premium", base: 132_000, perKm: 21_800, surge: 0.16, speedKmh: 22 },

  { provider: "xanh_sm", service: "Xe máy", vehicle_category: "bike", base: 19_800, perKm: 4_950, surge: 0.1, speedKmh: 24 },
  { provider: "xanh_sm", service: "XanhSM 4 chỗ", vehicle_category: "car_4", base: 65_500, perKm: 13_100, surge: 0.11, speedKmh: 25 },
  { provider: "xanh_sm", service: "XanhSM 7 chỗ", vehicle_category: "car_7", base: 99_000, perKm: 17_900, surge: 0.13, speedKmh: 23 },

  { provider: "gogo", service: "GogoBike", vehicle_category: "bike", base: 21_200, perKm: 5_250, surge: 0.13, speedKmh: 26 },
  { provider: "gogo", service: "GogoCar", vehicle_category: "car_4", base: 66_500, perKm: 13_300, surge: 0.12, speedKmh: 24 },
  { provider: "gogo", service: "GogoCar XL", vehicle_category: "car_7", base: 102_000, perKm: 18_400, surge: 0.15, speedKmh: 22 },
];

/** Biến đổi chuỗi -> số 0..1, ổn định theo seed */
function hashUnit(seed: string): number {
  const h = createHash("sha256").update(seed).digest();
  return h.readUInt32BE(0) / 0xffffffff;
}

function roundTo(x: number, step: number): number {
  return Math.round(x / step) * step;
}

/**
 * Giá mô phỏng:
 *   giá = (base + perKm * km) * (1 + surge) * noise
 * `tick` tăng mỗi lần refresh -> noise thay đổi -> thứ tự giá thực sự nhảy,
 * đủ để kiểm chứng GSAP Flip reorder.
 */
export function generateQuotes(from: GeoPoint, to: GeoPoint, tick = 0): RideQuote[] {
  const straightKm = haversineKm(from, to);
  const km = straightKm * 1.25; // hệ số uốn đường thực
  const now = new Date();

  return SERVICES.map((spec) => {
    const key = `${spec.provider}:${spec.service}:${from.lat.toFixed(3)},${from.lng.toFixed(3)}->${to.lat.toFixed(3)},${to.lng.toFixed(3)}`;

    // nhiễu "giờ cao điểm" ổn định theo giờ hiện tại
    const hour = now.getHours() + now.getMinutes() / 60;
    const rush = hour >= 7 && hour <= 9 ? 1.16 : hour >= 11 && hour <= 13 ? 1.05 : hour >= 17 && hour <= 19 ? 1.22 : 1;

    // nhiễu ngẫu nhiên đổi theo tick -> giá nhấp nháy giữa các lần refresh
    const noise = 0.94 + hashUnit(`${key}:t${tick}`) * 0.14;
    const etaNoise = 0.88 + hashUnit(`${key}:e${tick}`) * 0.3;

    const raw = (spec.base + spec.perKm * km) * (1 + spec.surge) * rush * noise;
    const price = roundTo(raw, km > 25 ? 5000 : km > 10 ? 1000 : 500);

    const eta = Math.max(1, Math.round((km / spec.speedKmh) * 60 * etaNoise));

    // availability: đa số có, một số provider có thể tạm hết xe
    const availabilityRoll = hashUnit(`${key}:a${tick}`);
    const availability = availabilityRoll > 0.16;

    return {
      id: `${spec.provider}::${spec.service}`,
      provider: spec.provider,
      service: spec.service,
      vehicle_category: spec.vehicle_category,
      price,
      eta_minutes: eta,
      availability,
      collected_at: now.toISOString(),
      distance_km: Number(km.toFixed(1)),
    };
  });
}

/** Tick đếm tăng mỗi lần refresh trong vòng đời server (đủ để giá đổi). */
let serverTick = 0;
export function nextTick(): number {
  return serverTick++;
}

export function currentTick(): number {
  return serverTick;
}

export function describePickup(p: Place): string {
  return p.name;
}