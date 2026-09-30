# 🚗 Sunnee — So sánh giá gọi xe thời gian thực

> MVP target: **Hà Nội** · Kiến trúc chi tiết: [`ride-compare-system.md`](./ride-compare-system.md)

Web app so sánh giá gọi xe: user nhập điểm đi / điểm đến → hệ thống gom báo giá từ nhiều
provider → **gom theo loại phương tiện** → **sắp xếp rẻ nhất trước** → tự cập nhật **mỗi 60 giây**.

---

## Trạng thái hiện tại

| Hạng mục | Trạng thái |
|---|---|
| Frontend (Next.js + TS + Tailwind + shadcn/ui) | ✅ Hoàn thành |
| Zustand store + auto-refresh 60s | ✅ Hoàn thành |
| GSAP Flip reorder + animation giá | ✅ Hoàn thành |
| Leaflet + OSRM route visualization | ✅ Hoàn thành |
| Playwright E2E (desktop + mobile) | ✅ Hoàn thành |
| API route (mock provider engine) | ✅ Hoàn thành (giá **giả**, mô phỏng) |
| Supabase (DB / Auth / Realtime) | ⬜ Phase 2 |
| Scraper worker (Node + Playwright) | ⬜ Phase 2 |

> ⚠️ **Giá hiện tại là dữ liệu MOCK** do `src/lib/mock/engine.ts` sinh ra để minh hoạ giao diện
> và kiểm chứng animation reorder. **Không phải giá thật** của Grab / be / Xanh SM / GoGo.
> Không có request nào tới provider ở trạng thái này.

---

## Cấu trúc dự án

```text
sunnee/
├─ .venv/                     # Python env của project (KHÔNG dùng python global)
├─ .vscode/settings.json      # trỏ VS Code vào .venv
├─ apps/
│  └─ web/                    # Next.js 15 App Router  → deploy Vercel
│     ├─ playwright.config.ts
│     ├─ e2e/                 # test Playwright
│     │  ├─ quotes.spec.ts    #   sort trong nhóm, lọc, chọn chuyến
│     │  ├─ search-flow.spec.ts#   đổi điểm, đảo chiều, gợi ý địa điểm
│     │  └─ api.spec.ts       #   shape dữ liệu API, validation
│     └─ src/
│        ├─ app/              # routes + API handlers (Next.js Route Handlers)
│        │  ├─ page.tsx       #   trang chính
│        │  ├─ layout.tsx     #   header/footer, font, metadata
│        │  ├─ globals.css    #   design tokens (light/dark) + Tailwind v4
│        │  └─ api/
│        │     ├─ quotes/     #   GET báo giá + route
│        │     └─ places/     #   GET gợi ý địa điểm
│        ├─ components/
│        │  ├─ ui/            # shadcn-style primitives (button, card, badge…)
│        │  ├─ layout/        # header Sunnee
│        │  ├─ search/        # form điểm đi / điểm đến + combobox gợi ý
│        │  ├─ filters/       # lọc provider / loại xe / sắp xếp
│        │  ├─ freshness/     # đếm ngược 60s + nút làm mới
│        │  ├─ results/       # board, card, skeleton, empty state
│        │  └─ map/           # Leaflet (ssr:false)
│        ├─ hooks/
│        │  ├─ useAutoRefresh.ts  # refresh mỗi 60s, tạm dừng khi tab ẩn
│        │  └─ useFlipReorder.ts  # GSAP Flip cho reorder card
│        ├─ lib/
│        │  ├─ types.ts       # RideQuote, VehicleCategory, RouteGeometry…
│        │  ├─ constants.ts   # provider, nhóm xe, địa điểm mẫu
│        │  ├─ normalize.ts   # ⭐ group + sort + diff giữa 2 lần refresh
│        │  ├─ geo.ts         # haversine, OSRM route (fallback đường thẳng)
│        │  ├─ format.ts      # format VND / km / thời gian
│        │  └─ mock/engine.ts# ⭐ provider engine giả lập (thay bằng scraper)
│        └─ store/
│           └─ useRideStore.ts# ⭐ Zustand: input, data, filters, actions
│
├─ scraper/                   # ⬜ PHASE 2 — Node + Playwright worker
│  ├─ core/
│  │  ├─ provider.ts          #   interface RideProvider
│  │  ├─ normalizer.ts        #   chuẩn hoá về bike/car_4/car_7/premium
│  │  └─ types.ts
│  ├─ providers/
│  │  ├─ grab/
│  │  ├─ be/
│  │  └─ xanh-sm/
│  └─ worker.ts               #   job loop ghi vào Supabase
│
└─ packages/                  # ⬜ PHASE 2 — types dùng chung web ↔ worker
```

### Vì sao tách `apps/web` và `scraper/`?

`scraper/` **không** chạy trên Vercel (Playwright cần Chromium + RAM, Vercel Hobby không phù hợp).
Tách riêng để deploy web lên Vercel còn worker chạy trên máy local hoặc VPS rẻ, đúng nguyên tắc
---

## Chạy dự án

### Yêu cầu

- **Node.js ≥ 20** (khuyến nghị 22)
- **Python 3.12+** — chỉ dùng qua `.venv` của project
- Playwright browser (cho test E2E)

### 1️⃣ Python — luôn dùng `.venv`, không dùng python global

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Windows CMD
.\.venv\Scripts\activate.bat

# macOS / Linux
source .venv/bin/activate
```

Kiểm tra đã dùng đúng env:

```bash
python -c "import sys; print(sys.executable)"
# -> d:\my code\sunnee\.venv\Scripts\python.exe
```

Tạo lại `.venv` nếu máy mới:

```bash
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
```

> `.venv/` đã được thêm vào `.gitignore`. VS Code tự trỏ interpreter qua
> `.vscode/settings.json` → mở Terminal trong VS Code là đã có sẵn env.

### 2️⃣ Web

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

| Script | Mục đích |
|---|---|
| `npm run dev` | Dev server (Fast Refresh) |
| `npm run build` | Production build |
| `npm run start` | Chạy bản build (dùng cho E2E) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Chạy Playwright |
| `npm run test:e2e:ui` | Playwright UI mode (xem test chạy từng bước) |
| `npm run test:e2e:report` | Mở HTML report |

### 3️⃣ Test E2E

```bash
cd apps/web
npx playwright install chromium   # chỉ cần 1 lần
npm run test:e2e                 # tự start server + chạy test
npm run test:e2e:report          # mở HTML report
```

Test chạy trên **2 project**: `desktop` (1440×900) và `mobile` (Pixel 7) → kiểm tra responsive.

---

## Kiến trúc frontend

```text
User nhập điểm đi / điểm đến
        ↓
Zustand store (useRideStore)
        ↓  fetch /api/quotes
Next.js Route Handler  ──►  OSRM (route geometry)  ← CHỈ để hiển thị
        ↓
normalize.ts — group theo loại xe + sort giá ASC trong nhóm
        ↓
ResultsBoard ──► GSAP Flip reorder khi thứ tự đổi
        ↓
QuoteCard — flash đỏ/xanh khi giá đổi
```

### Quy tắc nghiệp vụ đã cài đặt

| Rule | Thực hiện ở |
|---|---|
| Không dùng bản đồ để tính giá | Giá chỉ đến từ provider (`generateQuotes`). OSRM chỉ trả geometry + distance. |
| Gom về nhóm chung `bike` / `car_4` / `car_7` / `premium` | `types.ts` (`VehicleCategory`) + `mock/engine.ts` |
| Sort `price ASC` **trong từng nhóm** | `normalize.ts` → `groupByCategory()` |
| Hiển thị **tất cả** service provider trả về | Không lọc bỏ provider nào trong group |
| Refresh **60s** khi đang xem kết quả | `hooks/useAutoRefresh.ts` |
| Dữ liệu phải có `collected_at` | `RideQuote.collected_at` (ISO) → UI hiện "vừa xong / N phút trước" |
---

## Animation (GSAP)

Danh sách animation cố tình **giữ ngắn gọn, chỉ phục vụ dữ liệu**:

| Hiệu ứng | Kỹ thuật | File |
|---|---|---|
| **Reorder card khi giá đổi** | `Flip.getState()` → `Flip.from()` | `hooks/useFlipReorder.ts` |
| Card mới xuất hiện / biến mất | `onEnter` / `onLeave` của Flip | `useFlipReorder.ts` |
| Nhấp nháy giá tăng/giảm | `gsap.fromTo` đổi màu + scale | `components/results/QuoteCard.tsx` |
| Vòng tròn đếm ngược 60s | tween `strokeDashoffset` | `components/freshness/RefreshBar.tsx` |

### Vài điểm kỹ thuật đáng chú ý

**1. Vì sao `Flip.getState()` nằm trong render phase?**
React chạy `useLayoutEffect` **sau khi** đã mutate DOM → lúc đó layout cũ không còn.
Vì vậy `useFlipReorder` capture state trong render (DOM lúc đó còn là layout cũ),
rồi phát `Flip.from()` trong `useGSAP` (chạy sau commit). Nếu React huỷ render đó,
`captured.key !== orderKey` sẽ bỏ qua tween.

**2. `data-flip-id`**
Mỗi card có `data-flip-id={provider::service}` — id **ổn định** giữa các lần refresh, để GSAP
match đúng node cần di chuyển thay vì coi như node mới.

**3. `prefers-reduced-motion`**
Mọi animation bọc trong `gsap.matchMedia()` → user giảm chuyển động thì tự động bỏ animation.

**4. Không animate layout**
Dùng transform alias (`x`, `y`, `scale`, `autoAlpha`) thay vì `width`/`height`/`top`/`left`.

---

## Bảng dữ liệu (Phase 2)

`profiles` · `providers` · `vehicle_categories` · `provider_services` · `routes` ·
`scrape_jobs` · `ride_quotes` · `quote_history`

---

## Kế hoạch Phase 2

- [ ] Supabase schema + RLS
- [ ] Supabase Auth (đăng nhập)
- [ ] `scraper/` worker + provider adapter (Grab, be, Xanh SM)
- [ ] Đổi `mock/engine.ts` → đọc `ride_quotes` từ Supabase
- [ ] Supabase Realtime đẩy giá mới (thay polling)
- [ ] Nominatim / Google Places cho geocode
- [ ] CI/CD: Vercel + GitHub Actions chạy E2E

> ⚠️ Việc scrape tự động phải tuân thủ API / access policy / Terms của từng provider.
> Ưu tiên API chính thức trước khi cân nhắc scraping.

---

## Triển khai (free-first)

```text
Vercel Hobby   → apps/web (frontend + API)
Supabase Free  → DB / Auth / Realtime
GitHub         → source + CI/CD
Máy local      → scraper/ worker (Playwright)
```

---

## License

Private project.
**free-first** trong tài liệu hệ thống.