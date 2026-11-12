import { expect, test } from "@playwright/test";

for (const width of [320, 390]) {
  test(`all approach descriptions have room at ${width}px`, async ({ page }) => {
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about");
    const cards = page.locator(".approach .step-card");
    await expect(cards).toHaveCount(5);
    for (const card of await cards.all()) {
      const description = card.locator("p");
      const box = await description.boundingBox();
      expect(box?.width).toBeGreaterThan(150);
      await expect(description).toBeVisible();
    }
  });
}
