import { expect, test } from "@playwright/test";

test.describe("Sunnee — API báo giá", () => {
  test("GET /api/quotes trả quote + route đúng cấu trúc", async ({ request }) => {
    const res = await request.get("/api/quotes?pickup=21.0281,105.8342&destination=21.0373,105.8320");

    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(Array.isArray(body.quotes)).toBe(true);
    expect(body.quotes.length).toBeGreaterThan(0);
    expect(body.route).toBeTruthy();
    expect(body.route.distance_km).toBeGreaterThan(0);
    expect(body.route.source).toMatch(/osrm|fallback/);

    const validCategories = ["bike", "car_4", "car_7", "premium"];
    for (const q of body.quotes) {
      expect(q).toMatchObject({
        provider: expect.any(String),
        service: expect.any(String),
        vehicle_category: expect.stringMatching(new RegExp(`^(${validCategories.join("|")})$`)),
      });
      expect(q.price).toBeGreaterThan(0);
      expect(typeof q.availability).toBe("boolean");
      // collected_at bắt buộc để biết độ mới dữ liệu
      expect(new Date(q.collected_at).toString()).not.toBe("Invalid Date");
    }
  });

  test("giá khác nhau giữa các tick -> minh hoạ realtime update", async ({ request }) => {
    const url = "/api/quotes?pickup=21.0281,105.8342&destination=21.0373,105.8320";
    const first = await (await request.get(`${url}&tick=1`)).json();
    const second = await (await request.get(`${url}&tick=2`)).json();

    const priceOf = (body: { quotes: { id: string; price: number }[] }, id: string) =>
      body.quotes.find((q) => q.id === id)?.price;

    const changed = first.quotes.some((q: { id: string; price: number }) => priceOf(second, q.id) !== q.price);
    expect(changed).toBe(true);
  });

  test("trả 400 khi thiếu tham số", async ({ request }) => {
    const res = await request.get("/api/quotes?pickup=abc&destination=21.0,105.0");
    expect(res.status()).toBe(400);
  });

  test("GET /api/places lọc theo từ khoá không dấu", async ({ request }) => {
    const res = await request.get("/api/places?q=times");
    expect(res.ok()).toBeTruthy();

    const { results } = await res.json();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain("Times");
  });

  test("GET /api/places trả 400 khi thiếu q", async ({ request }) => {
    expect((await request.get("/api/places")).status()).toBe(400);
  });
});