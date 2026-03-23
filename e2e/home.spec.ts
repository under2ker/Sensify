import { test, expect } from "@playwright/test";

test.describe("Главная страница", () => {
  test("загружается и отображает заголовок", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("отображает форму ввода", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder(/url|вставьте|ссылка/i)).toBeVisible({ timeout: 5000 });
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
