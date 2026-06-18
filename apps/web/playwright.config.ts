import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 90_000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    hasTouch: true,
    isMobile: true,
    viewport: {
      height: 800,
      width: 360
    }
  },
  projects: [
    {
      name: "chromium-mobile",
      use: {
        browserName: "chromium",
        hasTouch: true,
        isMobile: true,
        viewport: {
          height: 800,
          width: 360
        }
      }
    }
  ]
});
