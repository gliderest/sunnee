import { CATEGORY_ORDER } from "./constants";
import type { CategoryGroup, RideQuote, SortMode, VehicleCategory } from "./types";

/**
 * Quy tắc nghiệp vụ cốt lõi (theo tài liệu hệ thống):
 *  - Gom quote theo nhóm phương tiện đã normalize: bike | car_4 | car_7 | premium
 *  - Sort price ASC TRONG TỪNG NHÓM
 *  - Không provider nào được loại khỏi nhóm (hiển thị tất cả service provider trả về)
 */

export function sortQuotes(quotes: RideQuote[], mode: SortMode = "price_asc"): RideQuote[] {
  const sorted = [...quotes];
  switch (mode) {
    case "price_desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "eta_asc":
      sorted.sort((a, b) => a.eta_minutes - b.eta_minutes || a.price - b.price);
      break;
    case "price_asc":
    default:
      // Ổn định: giá ASC, rồi ETA ASC, rồi tên provider để tránh nhảy thứ tự vô nghĩa
      sorted.sort(
        (a, b) => a.price - b.price || a.eta_minutes - b.eta_minutes || a.provider.localeCompare(b.provider),
      );
      break;
  }
  return sorted;
}

/**
 * Gom + sort thành từng nhóm phương tiện.
 * Nhóm không có quote sẽ bị loại khỏi kết quả.
 */
export function groupByCategory(quotes: RideQuote[], mode: SortMode = "price_asc"): CategoryGroup[] {
  const buckets = new Map<VehicleCategory, RideQuote[]>();

  for (const q of quotes) {
    const list = buckets.get(q.vehicle_category) ?? [];
    list.push(q);
    buckets.set(q.vehicle_category, list);
  }

  const groups: CategoryGroup[] = [];
  for (const category of CATEGORY_ORDER) {
    const bucket = buckets.get(category);
    if (!bucket || bucket.length === 0) continue;
    const sorted = sortQuotes(bucket, mode);
    groups.push({ category, quotes: sorted, cheapest: sorted[0] });
  }

  // Ưu tiên group có giá rẻ nhất thấp nhất (group rẻ nhất lên đầu)
  groups.sort((a, b) => a.cheapest.price - b.cheapest.price);
  return groups;
}

/** id provider+service để so khớp giữa 2 lần fetch (dùng cho Flip + delta) */
export function quoteKey(q: Pick<RideQuote, "provider" | "service">): string {
  return `${q.provider}::${q.service}`;
}

export interface QuoteDelta {
  key: string;
  previousPrice: number | null;
  delta: number;
  direction: "up" | "down" | "same";
  isNew: boolean;
  /** card này có lọt top-1 của nhóm ở lần trước không */
  wasCheapest: boolean;
  /** card này vừa giành ngôi vị rẻ nhất của nhóm ở lần này (dùng để nhấn mạnh) */
  becameCheapest: boolean;
}

/** So sánh 2 snapshot để tìm thay đổi giá — dùng cho highlight + GSAP Flip */
export function diffQuotes(previous: RideQuote[], next: RideQuote[]): Map<string, QuoteDelta> {
  const prevMap = new Map(previous.map((q) => [quoteKey(q), q]));
  const prevCheapestByCategory = cheapestPerCategory(previous);
  const nextCheapestByCategory = cheapestPerCategory(next);

  const deltas = new Map<string, QuoteDelta>();
  for (const q of next) {
    const key = quoteKey(q);
    const prev = prevMap.get(key);
    const isNew = !prev;
    const prevPrice = prev?.price ?? null;
    const delta = prevPrice === null ? 0 : q.price - prevPrice;
    const wasCheapest = prevCheapestByCategory.get(q.vehicle_category) === key;
    const isCheapestNow = nextCheapestByCategory.get(q.vehicle_category) === key;

    deltas.set(key, {
      key,
      previousPrice: prevPrice,
      delta,
      direction: delta === 0 ? "same" : delta > 0 ? "up" : "down",
      isNew,
      wasCheapest,
      becameCheapest: isCheapestNow && !wasCheapest,
    });
  }
  return deltas;
}

export function cheapestPerCategory(quotes: RideQuote[]): Map<VehicleCategory, string> {
  const map = new Map<VehicleCategory, string>();
  for (const group of groupByCategory(quotes, "price_asc")) {
    map.set(group.category, quoteKey(group.cheapest));
  }
  return map;
}

/** Thống kê tổng quan cho header */
export interface QuoteStats {
  total: number;
  cheapest: RideQuote | null;
  cheapestCategory: VehicleCategory | null;
  avgPrice: number;
  spread: number;
  providers: number;
}

export function computeStats(quotes: RideQuote[]): QuoteStats {
  if (quotes.length === 0) {
    return { total: 0, cheapest: null, cheapestCategory: null, avgPrice: 0, spread: 0, providers: 0 };
  }
  const available = quotes.filter((q) => q.availability);
  const pool = available.length > 0 ? available : quotes;
  const sorted = sortQuotes(pool, "price_asc");
  const prices = pool.map((q) => q.price);
  const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);

  return {
    total: quotes.length,
    cheapest: sorted[0],
    cheapestCategory: sorted[0].vehicle_category,
    avgPrice,
    spread: Math.max(...prices) - Math.min(...prices),
    providers: new Set(quotes.map((q) => q.provider)).size,
  };
}