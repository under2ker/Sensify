import { test, expect } from "@playwright/test";

test.describe("Главная страница", () => {
  test("загружается и отображает бренд в шапке", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Sensify — на главную/i })).toBeVisible({ timeout: 15_000 });
  });

  test("отображает форму ввода", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByPlaceholder(/github\.com|Вставьте URL|вставьте статью/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("skip-link: фокус показывает «Перейти к содержимому»", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /перейти к содержимому/i });
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(page.locator("#main-content")).toBeFocused();
  });
});
