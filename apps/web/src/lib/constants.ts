import type { ProviderId, VehicleCategory } from "./types";

export const REFRESH_INTERVAL_SECONDS = 60;

export interface CategoryMeta {
  id: VehicleCategory;
  label: string;
  shortLabel: string;
  icon: string;
  /** Màu nhấn cho card rẻ nhất */
  accent: string;
}

export const VEHICLE_CATEGORIES: CategoryMeta[] = [
  { id: "bike", label: "Xe máy", shortLabel: "Máy", icon: "🛵", accent: "#f97316" },
  { id: "car_4", label: "Xe 4 chỗ", shortLabel: "4 chỗ", icon: "🚗", accent: "#3b82f6" },
  { id: "car_7", label: "Xe 7 chỗ", shortLabel: "7 chỗ", icon: "🚙", accent: "#8b5cf6" },
  { id: "premium", label: "Xe cao cấp", shortLabel: "Premium", icon: "✨", accent: "#eab308" },
];

export const CATEGORY_MAP: Record<VehicleCategory, CategoryMeta> = Object.fromEntries(
  VEHICLE_CATEGORIES.map((c) => [c.id, c]),
) as Record<VehicleCategory, CategoryMeta>;

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** màu thương hiệu */
  brand: string;
  brandSoft: string;
  initials: string;
}

export const PROVIDERS: ProviderMeta[] = [
  { id: "grab", label: "Grab", brand: "#00b14f", brandSoft: "rgba(0,177,79,0.12)", initials: "GR" },
  { id: "be", label: "be", brand: "#fbee25", brandSoft: "rgba(251,238,37,0.18)", initials: "BE" },
  { id: "xanh_sm", label: "Xanh SM", brand: "#0a8f5b", brandSoft: "rgba(10,143,91,0.12)", initials: "XS" },
  { id: "gogo", label: "GoGo", brand: "#ff6b00", brandSoft: "rgba(255,107,0,0.12)", initials: "GG" },
];

export const PROVIDER_MAP: Record<ProviderId, ProviderMeta> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
) as Record<ProviderId, ProviderMeta>;

/** Quyền hạn thứ tự hiển thị nhóm: rẻ → sang */
export const CATEGORY_ORDER: VehicleCategory[] = VEHICLE_CATEGORIES.map((c) => c.id);

/**
 * Điểm đi/đến mẫu — MVP target Hà Nội.
 * Backend thật sẽ thay bằng geocode (Nominatim/Google Places).
 */
export const SAMPLE_PLACES = [
  { id: "hanoi-opera", name: "Nhà hát lớn Hà Nội", address: "01 Tràng Tiền, Hoàn Kiếm, Hà Nội", lat: 21.0281, lng: 105.8342 },
  { id: "times-city", name: "Times City", address: "Hà Nội, Nguyễn Chánh, Nam Từ Liêm", lat: 21.0373, lng: 105.8320 },
  { id: "keangnam", name: "Landmark 72 Keangnam", address: "Phạm Duy Trinh, Cầu Giấy, Hà Nội", lat: 21.0278, lng: 105.7938 },
  { id: "aeon-mall", name: "Aeon Mall Long Biên", address: "123 Nguyễn Văn Cừ, Long Biên, Hà Nội", lat: 21.0385, lng: 105.8785 },
  { id: "vincom-royal", name: "Vincom Royal City", address: "Đại La, Thanh Xuân, Hà Nội", lat: 20.9918, lng: 105.8075 },
  { id: "vinhomes-oceans", name: "Vinhomes Ocean Park", address: "Vĩnh Yên, Vũ Yên, Hải Phòng", lat: 20.7899, lng: 106.7245 },
  { id: "baichung", name: "Bãi biển Bãi Cháy", address: "Bãi Cháy, Hạ Long, Quảng Ninh", lat: 20.9268, lng: 107.0950 },
  { id: "noi-bai", name: "Sân bay Nội Bài", address: "Sân bay Nội Bài, Sóc Sơn, Hà Nội", lat: 21.2212, lng: 105.8072 },
] as const;

/** Giá tham chiếu cho đoạn ngắn ở Hà Nội — chỉ dùng để MÔ PHỎNG, không dùng tính tiền thật. */
export const CITY_CENTER = { lat: 21.0281, lng: 105.8342 };