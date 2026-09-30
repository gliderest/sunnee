import { expect, test, type Page } from "@playwright/test";

/** Chờ danh sách báo giá xuất hiện (skeleton đã biến mất) */
async function waitForQuotes(page: Page) {
  await expect(page.getByTestId("results-board")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("results-skeleton")).toHaveCount(0);
}

test.describe("Sunnee — trang so sánh giá", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForQuotes(page);
  });

  test("tải trang và hiển thị khu vực chính", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("So sánh giá gọi xe");
    await expect(page.getByTestId("pickup-input")).toBeVisible();
    await expect(page.getByTestId("destination-input")).toBeVisible();
    await expect(page.getByTestId("search-button")).toBeVisible();
    await expect(page.getByTestId("stats-bar")).toBeVisible();
  });

  test("gom báo giá theo nhóm phương tiện và sort giá tăng dần trong từng nhóm", async ({ page }) => {
    for (const category of ["bike", "car_4", "car_7", "premium"]) {
      const group = page.getByTestId(`category-${category}`);
      if ((await group.count()) === 0) continue;

      const prices = await group.locator("[data-price]").evaluateAll((nodes) =>
        nodes.map((n) => Number(n.getAttribute("data-price"))),
      );

      expect(prices.length).toBeGreaterThan(0);
      // key assertion: giá tăng dần trong nhóm
      const sorted = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sorted);
    }
  });

  test("chỉ có một thẻ 'Rẻ nhất' ở đầu mỗi nhóm và đúng là giá thấp nhất", async ({ page }) => {
    const bike = page.getByTestId("category-bike");
    await expect(bike).toBeVisible();

    const prices = await bike
      .locator("[data-price]")
      .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute("data-price"))));
    const firstPrice = prices[0];

    // card đầu tiên phải là giá thấp nhất
    expect(Math.min(...prices)).toBe(firstPrice);

    // đúng 1 badge "Rẻ nhất", nằm ở card đầu tiên
    // dùng exact + scoped để không đụng với chữ "rẻ nhất" trong header nhóm
    const badges = bike.locator("[data-flip-id]").getByText(/^Rẻ nhất$/, { exact: true });
    await expect(badges).toHaveCount(1);
    await expect(bike.locator("[data-flip-id]").first().getByText(/^Rẻ nhất$/)).toBeVisible();
  });

  test("bấm nút chọn chuyến hiện chi tiết ở cột bản đồ", async ({ page }) => {
    await expect(page.getByTestId("selected-quote-detail")).toHaveCount(0);

    await page.locator("[data-testid^=quote-select-]").first().click();

    await expect(page.getByTestId("selected-quote-detail")).toBeVisible();
    await expect(page.getByText("Đã chọn")).toBeVisible();
  });

  test("nút làm mới thủ công cập nhật giá và giữ còn dữ liệu", async ({ page }) => {
    const before = await page.locator("[data-price]").evaluateAll((n) => n.map((e) => e.getAttribute("data-price")));

    await page.getByTestId("manual-refresh").click();
    await expect(page.getByTestId("manual-refresh")).toBeEnabled({ timeout: 15_000 });
    await waitForQuotes(page);

    const after = await page.locator("[data-price]").evaluateAll((n) => n.map((e) => e.getAttribute("data-price")));
    expect(after.length).toBeGreaterThan(0);
    // giá có thể trùng nhau, nhưng không được rỗng
    expect(after.every((p) => Number(p) > 0)).toBe(true);
    expect(before.length).toBe(after.length);
  });

  test("lọc theo provider chỉ còn provider đang bật", async ({ page }) => {
    const before = await page.locator("[data-provider]").evaluateAll((n) =>
      n.map((e) => e.getAttribute("data-provider")),
    );
    expect(before).toContain("grab");
    expect(before).toContain("be");

    await page.getByTestId("filter-provider-be").click();
    await page.getByTestId("filter-provider-xanh_sm").click();

    const after = await page.locator("[data-provider]").evaluateAll((n) =>
      n.map((e) => e.getAttribute("data-provider")),
    );
    expect(after.length).toBeGreaterThan(0);
    expect(new Set(after)).toEqual(new Set(["grab", "gogo"]));

    // bấm lại để bật -> khôi phục
    await page.getByTestId("filter-provider-be").click();
    await expect(page.locator("[data-provider=be]").first()).toBeVisible();
  });

  test("bộ lọc loại xe ẩn/hiện nhóm tương ứng", async ({ page }) => {
    await expect(page.getByTestId("category-bike")).toBeVisible();

    await page.getByTestId("filter-category-bike").click();
    await expect(page.getByTestId("category-bike")).toHaveCount(0);

    await page.getByTestId("filter-category-bike").click();
    await expect(page.getByTestId("category-bike")).toBeVisible();
  });

  test("lọc chỉ hiện xe còn trống bỏ card Tạm hết xe", async ({ page }) => {
    const before = await page.getByText("Tạm hết xe").count();

    await page.getByTestId("filter-only-available").click();
    await expect(page.getByText("Tạm hết xe")).toHaveCount(0);
    await expect(page.getByText("Còn xe").first()).toBeVisible();

    await page.getByTestId("filter-only-available").click();
    await expect(page.getByText("Tạm hết xe")).toHaveCount(before);
  });

  test("đổi cách sắp xếp giá cao xuống thấp", async ({ page }) => {
    await page.getByTestId("sort-select").selectOption("price_desc");

    const bike = page.getByTestId("category-bike");
    const prices = await bike.locator("[data-price]").evaluateAll((n) =>
      n.map((e) => Number(e.getAttribute("data-price"))),
    );
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });
});