import { expect, test } from "@playwright/test";

for (const width of [320, 390, 1440, 1920]) {
  test(`project cards have labelled diagrams and actions at ${width}px`, async ({ page }) => {
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/works");
    await expect(page.getByRole("searchbox")).toHaveCount(0);
    const cards = page.locator(".project-card");
    await expect(cards).toHaveCount(5);
    for (const card of await cards.all()) {
      await expect(card.getByRole("img", { name: /^Схема проекта/ })).toBeVisible();
      await expect(card.locator(".card-open")).toBeVisible();
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
  await card.getByRole("link", { name: /Описание проекта/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ERP4Seller");
  await expect(page.locator(".case-page")).not.toContainText(/2025|Chart\.js|Pinia|Vue/);
});
