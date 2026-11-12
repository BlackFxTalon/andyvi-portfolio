import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1440, 1920]) {
  test(`project cards have labelled diagrams and actions at ${width}px`, async ({ page }) => {
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/works");
    await expect(page.getByRole("searchbox")).toHaveCount(0);
    const cards = page.locator(".project-card");
    await expect(cards).toHaveCount(4);
    for (const card of await cards.all()) {
      await expect(card.getByRole("img", { name: /^Схема проекта/ })).toBeVisible();
      await expect(card.getByRole("button", { name: /Описание проекта/ })).toBeVisible();
      await expect(card.getByText("Публичная ссылка не указана")).toBeVisible();
      const box = await card.boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width + 1);
    }
  });
}

test("project details omit unconfirmed dates and technologies", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
  await page.goto("/works");
  const card = page.locator(".project-card").filter({ hasText: "ERP4Seller" });
  await expect(card.locator(".case-diagram")).toContainText("Маркетплейсы");
  await card.getByRole("button", { name: /Описание проекта/ }).click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal).toContainText("Личная роль, технологии и доступные материалы уточняются");
  await expect(modal).not.toContainText(/2025|Chart\.js|Pinia|Vue/);
});
