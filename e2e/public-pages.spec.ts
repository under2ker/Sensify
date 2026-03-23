import { test, expect } from "@playwright/test";

const paths = ["/changelog", "/premium", "/about", "/developers"] as const;

test.describe("Публичные страницы", () => {
  for (const path of paths) {
    test(`${path}: OK и #main-content`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("#main-content")).toBeAttached();
    });
  }
});
