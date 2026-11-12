import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1440, 1920]) {
  test(`project cards have labelled diagrams and actions at ${width}px`, async ({ page }) => {
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/works");
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
