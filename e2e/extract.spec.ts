import { test, expect } from "@playwright/test";

test.describe("Extract (smoke)", () => {
  test("форма извлечения видна и доступна", async ({ page }) => {
    await page.goto("/");
    // Поле ввода URL/текста
    const input = page.getByRole("textbox").or(page.getByPlaceholder(/url|вставьте|ссылка|текст/i));
    await expect(input.first()).toBeVisible({ timeout: 5000 });
    // Кнопка извлечения
    const extractBtn = page.getByRole("button", { name: /извлечь|извлечение/i });
    await expect(extractBtn.first()).toBeVisible({ timeout: 3000 });
  });
});
