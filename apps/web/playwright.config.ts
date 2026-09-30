import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * Máy dev đã có Google Chrome nên mặc định dùng `channel: "chrome"` — khỏi phải
 * tải Chromium 195MB. Trên CI (nơi không có Chrome), đặt env
 * `PLAYWRIGHT_CHANNEL=` (rỗng) để dùng chromium tải sẵn.
 */
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "chrome";
const browserChannel = channel.trim() === "" ? undefined : (channel as "chrome");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: browserChannel, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: browserChannel },
    },
  ],

  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});