import { test, expect } from "@playwright/test";

test.describe("Страница входа", () => {
  test("загружается и отображает форму", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email|почта/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("textbox", { name: /пароль|password/i })).toBeVisible();
  });

  test("есть ссылка на регистрацию", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /регистрация|зарегистрир/i })).toBeVisible({ timeout: 5000 });
  });
});
