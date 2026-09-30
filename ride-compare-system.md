# Ride Compare VN — System Overview

## Goal
Web app so sánh **giá gọi xe theo thời gian thực tại Việt Nam**.
User nhập điểm đi/đến → hệ thống lấy báo giá từ nhiều provider → gom theo loại phương tiện → **sắp xếp rẻ nhất trước**.
Giá tự cập nhật khoảng **mỗi 60 giây khi user đang xem kết quả**.

## Core Flow
```text
User
 ↓
Next.js Frontend
 ↓
Route API
 ↓
Supabase
 ↓
Scrape Job
 ↓
Node.js + Playwright Worker
 ├─ Provider A
 ├─ Provider B
 └─ Provider C
 ↓
Normalize Quotes
 ↓
Supabase PostgreSQL
 ↓
Supabase Realtime
 ↓
Frontend cập nhật + reorder
```

## Important Rules
- **Không dùng map để tính giá.**
- Giá cước lấy trực tiếp từ provider/source được phép sử dụng.
- **Leaflet chỉ để hiển thị route/quãng đường cho user.**
- OSRM chỉ phục vụ route visualization/distance display, không tham gia fare calculation.
- Hiển thị tất cả service/vehicle type mà provider trả về.
- Normalize về các nhóm chung: `bike`, `car_4`, `car_7`, `premium`, ...
- Sort `price ASC` **trong từng nhóm phương tiện**.
- Refresh giá mỗi 60 giây trong phiên theo dõi.
- Dữ liệu giá phải có `collected_at` để biết độ mới.

## Frontend
- **Next.js + TypeScript**
- Tailwind CSS + shadcn/ui
- **GSAP** cho animation; GSAP Flip cho reorder card
- Zustand
- Leaflet + OpenStreetMap
- OSRM cho route geometry/display

## Backend / Data
- **Supabase PostgreSQL** — users, providers, routes, quotes, history, jobs
- **Supabase Auth** — login app
- **Supabase Realtime** — push quote updates
- Next.js Route Handlers — API
- Zod — validation

## Scraper Worker
- **Node.js + Playwright**
- Chạy riêng ngoài Vercel (local worker trong MVP để giữ chi phí $0)
- Provider Adapter Pattern:

```ts
interface RideProvider {
  getQuotes(input: {
    pickup: Location;
    destination: Location;
  }): Promise<RideQuote[]>;
}
```

Suggested structure:
```text
scraper/
├─ core/
│  ├─ provider.ts
│  ├─ normalizer.ts
│  └─ types.ts
├─ providers/
│  ├─ grab/
│  ├─ be/
│  └─ xanh-sm/
└─ worker.ts
```

## Main Tables
```text
profiles
providers
vehicle_categories
provider_services
routes
scrape_jobs
ride_quotes
quote_history
```

## Quote Schema
```json
{
  "provider": "grab",
  "service": "GrabCar",
  "vehicle_category": "car_4",
  "price": 79000,
  "eta_minutes": 4,
  "availability": true,
  "collected_at": "..."
}
```

## Realtime Update
```text
Frontend → request/refresh route
        ↓
Supabase scrape_jobs
        ↓
Worker collects quotes
        ↓
Save quote + history
        ↓
Supabase Realtime
        ↓
Frontend animation + re-sort
```

## Free-first Deployment
```text
Vercel Hobby     → Next.js frontend/API
Supabase Free    → DB/Auth/Realtime
GitHub           → source + CI/CD
Local PC         → Playwright worker
```

> MVP target: **Hà Nội**, sau đó mở rộng các thành phố khác.
> Automated scraping phải tuân thủ API/access policy/Terms của từng provider.
