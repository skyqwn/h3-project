import { test, expect } from "@playwright/test";

test("contact form renders all fields", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="company"]')).toBeVisible();
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
  // Honeypot is present but visually hidden.
  await expect(page.locator('input[name="honeypot"]')).toBeHidden();
  await expect(
    page.getByRole("button", { name: /보내기|Send/ })
  ).toBeVisible();
});

// Full submission (Turnstile + Resend) is intentionally not exercised
// here — it needs real test-mode keys. Add a mocked-action test once
// those are provisioned.
