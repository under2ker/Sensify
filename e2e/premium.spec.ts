import { test, expect } from "@playwright/test";

test.describe("Страница премиум", () => {
  test("загружается и отображает тарифы", async ({ page }) => {
    await page.goto("/premium");
    await expect(page.getByRole("heading", { name: "Премиум", exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test("есть кнопки оплаты", async ({ page }) => {
    await page.goto("/premium");
    await expect(page.getByRole("button", { name: "Войти для оплаты" }).first()).toBeVisible({ timeout: 10_000 });
  });
});
