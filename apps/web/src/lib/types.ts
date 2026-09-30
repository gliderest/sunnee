/**
 * Domain types — theo `ride-compare-system.md`
 * Giá cước LUÔN lấy từ provider, không dùng bản đồ để tính giá.
 */

export type VehicleCategory =
  | "bike"
  | "car_4"
  | "car_7"
  | "premium";

export type ProviderId = "grab" | "be" | "xanh_sm" | "gogo";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Place extends GeoPoint {
  id: string;
  name: string;
  address: string;
}

/** Shape khớp với `ride_quotes` + schema trong tài liệu hệ thống. */
export interface RideQuote {
  /** id ổn định theo provider+service để GSAP Flip match node giữa các lần render */
  id: string;
  provider: ProviderId;
  /** Tên service gốc do provider trả về, ví dụ `GrabCar`, `BeCarX`, `XanhSM 7 chỗ` */
  service: string;
  vehicle_category: VehicleCategory;
  /** Giá VND */
  price: number;
  eta_minutes: number;
  availability: boolean;
  /** ISO timestamp — độ mới của dữ liệu */
  collected_at: string;
  /** Quãng đường hiển thị (km). Chỉ để hiển thị, KHÔNG tham gia tính giá. */
  distance_km: number;
}

export interface RouteLeg {
  from: Place;
  to: Place;
}

export interface RouteGeometry {
  /** Tọa độ dạng [lat, lng][] để vẽ polyline */
  coordinates: [number, number][];
  distance_km: number;
  duration_minutes: number;
  /** true nếu lấy từ OSRM, false nếu dùng đường thẳng dự phòng khi OSRM lỗi */
  source: "osrm" | "fallback";
}

export interface QuoteResult {
  quotes: RideQuote[];
  route: RouteGeometry;
  /** Thời điểm server sinh dữ liệu */
  generated_at: string;
}

export interface CategoryGroup {
  category: VehicleCategory;
  quotes: RideQuote[];
  /** Báo giá rẻ nhất trong nhóm (đã sort price ASC) */
  cheapest: RideQuote;
}

export type SortMode = "price_asc" | "price_desc" | "eta_asc";

export interface SearchState {
  pickup: Place;
  destination: Place;
}