import { expect, test } from "@playwright/test";

test.describe("Sunnee — luồng tìm kiếm", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("results-board")).toBeVisible({ timeout: 30_000 });
  });

  test("đổi điểm đến rồi tìm lại giá", async ({ page }) => {
    const before = await page.locator("[data-price]").first().getAttribute("data-price");

    await page.getByTestId("destination-input").click();
    await page.getByTestId("destination-input-search").fill("noi bai");
    await page.getByTestId("destination-input-option-noi-bai").click();
    await expect(page.getByTestId("destination-input")).toContainText("Nội Bài");

    await page.getByTestId("search-button").click();
    await expect(page.getByTestId("results-board")).toBeVisible({ timeout: 30_000 });

    const after = await page.locator("[data-price]").first().getAttribute("data-price");
    // tuyến dài hơn -> giá cao hơn
    expect(Number(after)).toBeGreaterThan(Number(before));
  });

  test("bấm tuyến nhanh thay đổi cả hai đầu", async ({ page }) => {
    await page.getByTestId("preset-0-7").click();

    await expect(page.getByTestId("pickup-input")).toContainText("Nhà hát lớn Hà Nội");
    await expect(page.getByTestId("destination-input")).toContainText("Nội Bài");

    await page.getByTestId("search-button").click();
    await expect(page.getByTestId("results-board")).toBeVisible({ timeout: 30_000 });
  });

  test("đảo chiều điểm đi và điểm đến hoán đổi", async ({ page }) => {
    await expect(page.getByTestId("pickup-input")).toContainText("Nhà hát lớn Hà Nội");
    await expect(page.getByTestId("destination-input")).toContainText("Times City");

    await page.getByTestId("swap-endpoints").click();

    await expect(page.getByTestId("pickup-input")).toContainText("Times City");
    await expect(page.getByTestId("destination-input")).toContainText("Nhà hát lớn Hà Nội");

    // đảo chiều -> tự tìm lại
    await expect(page.getByTestId("results-board")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("destination-input")).toContainText("Nhà hát lớn Hà Nội");
  });

  test("tìm kiếm không dấu vẫn ra kết quả", async ({ page }) => {
    await page.getByTestId("pickup-input").click();
    await page.getByTestId("pickup-input-search").fill("vinhomes");
    await expect(page.getByTestId("pickup-input-option-vinhomes-oceans")).toBeVisible();
    await page.getByTestId("pickup-input-option-vinhomes-oceans").click();
    await expect(page.getByTestId("pickup-input")).toContainText("Vinhomes Ocean Park");
  });

  test("tìm từ khoá không khớp hiện thông báo rỗng", async ({ page }) => {
    await page.getByTestId("pickup-input").click();
    await page.getByTestId("pickup-input-search").fill("zzzzkhongco");
    await expect(page.getByText("Không tìm thấy địa điểm")).toBeVisible();
  });

  test("bản đồ hiển thị tuyến và thống kê quãng đường", async ({ page }) => {
    await expect(page.getByTestId("route-map")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("stat-distance")).not.toHaveText("—");

    // OSRM có thể bị chặn mạng -> route fallback vẫn phải ra số
    await expect(page.getByTestId("stat-duration")).not.toHaveText("—");
  });
});