import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "about.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 60_000,
  outputDir: "/private/tmp/h3-about-test-results",
  use: {
    baseURL: process.env.ABOUT_TEST_URL ?? "http://localhost:3000",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "iphone", use: { ...devices["iPhone 13"] } },
    { name: "android", use: { ...devices["Pixel 7"] } },
  ],
});
