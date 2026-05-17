import { test, expect } from "@playwright/test";

test("Korean home renders hero + sections", async ({ page }) => {
  await page.goto("/");
  // The sr-only brand h1 is the page's primary heading.
  await expect(page.locator("h1.sr-only")).toHaveText("H3");
  // Hero headline (h2) carries the localized copy.
  await expect(
    page.getByRole("heading", { name: "기술이 만드는 다음 장면" })
  ).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

test("English home serves English copy", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "The next scene, engineered" })
  ).toBeVisible();
});

test("scrolling reveals later sections", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("footer")).toBeInViewport();
});
