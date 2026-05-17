import { test, expect } from "@playwright/test";

test("locale switch preserves the current path", async ({ page }) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "회사 소개" })
  ).toBeVisible();

  // Switch to English — should land on /en/about, not /en.
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page).toHaveURL(/\/en\/about$/);
  await expect(
    page.getByRole("heading", { name: "About" })
  ).toBeVisible();

  // Back to Korean — path preserved, no /en prefix.
  await page.getByRole("button", { name: "KO" }).click();
  await expect(page).toHaveURL(/localhost:3000\/about$/);
});
