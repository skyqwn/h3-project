import { test, expect } from "@playwright/test";
import ko from "../../messages/ko.json";
import en from "../../messages/en.json";

for (const [locale, copy] of [["ko", ko.about], ["en", en.about]] as const) {
  test(`${locale}: company content, images, FAQ, and navigation`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    // No prefetch or asset request in this test should create external state.
    await page.route("**/*", route => {
      const method = route.request().method();
      return ["GET", "HEAD"].includes(method) ? route.continue() : route.abort();
    });
    const prefix = locale === "en" ? "/en" : "";
    await page.goto(`${prefix}/about`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "H3-Tech" })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(`${copy.meta.title} | H3Tech`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", copy.meta.description);
    await expect(page.getByRole("link", { name: copy.intro.contact, exact: true })).toHaveAttribute("href", `${prefix}/contact`);
    await expect(page.getByRole("link", { name: copy.work.stories, exact: true })).toHaveAttribute("href", `${prefix}/blog`);
    await page.getByRole("link", { name: copy.intro.development, exact: true }).click();
    await expect(page).toHaveURL(/#ax-development$/);
    await expect(page.getByText(copy.vision.status, { exact: true })).toBeVisible();
    await expect.poll(() => page.locator("#ax-development").evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    for (const key of ["scope", "delivery", "ax", "preparation"] as const) {
      const question = page.locator("details").filter({ hasText: copy.faq[key].q });
      await question.locator("summary").click();
      await expect(question.locator("p")).toBeVisible();
      await expect(question.locator("p")).toHaveText(copy.faq[key].a);
      await question.locator("summary").click();
      await expect(question.locator("p")).not.toBeVisible();
    }
    for (const alt of [copy.work.fabrication.alt, copy.work.site.alt]) {
      const img = page.getByAltText(alt, { exact: true });
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    for (const heading of await page.locator("main h2").all()) await heading.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/[\u2014\u3161]/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `/private/tmp/h3-about-${locale}-${testInfo.project.name}.png`, fullPage: true });
  });
}
