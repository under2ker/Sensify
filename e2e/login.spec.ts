import { test, expect } from "@playwright/test";

test.describe("Страница входа", () => {
  test("загружается и отображает форму", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("есть ссылка на регистрацию", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /регистрация|зарегистрир/i })).toBeVisible({ timeout: 5000 });
  });
});
