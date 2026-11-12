import { expect, test } from "@playwright/test";

const widths = [320, 390, 768, 1024, 1280, 1440, 1920];
const routes = ["/", "/about", "/process", "/contacts"];

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
});

for (const width of widths) {
  for (const route of routes) {
    test(`${route} keeps content inside ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const selectors = route === "/contacts"
        ? "h1, .contact-panel, .contact-field__control, .submit-button"
        : route === "/about"
          ? "h1, .about-hero, .approach"
          : route === "/process"
            ? "h1, .process-steps, .bottom-zone"
            : "h1, #projectsCta";
      const boxes = await page.locator(selectors).evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { name: element.className, left: box.left, right: box.right };
        }),
      );
      expect(boxes.length).toBeGreaterThan(0);
      for (const box of boxes) {
        expect(box.left, String(box.name)).toBeGreaterThanOrEqual(-1);
        expect(box.right, String(box.name)).toBeLessThanOrEqual(width + 1);
      }
      const overflow = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        elements: Array.from(document.querySelectorAll("body *"))
          .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 12)
          .map((element) => `${element.tagName}.${element.className}`),
      }));
      expect(overflow.width, overflow.elements.join(", ")).toBeLessThanOrEqual(width);
    });
  }
}

for (const route of routes) {
  test(`${route} reflows at the effective width of 200% zoom`, async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 450 });
    await page.goto(route);
    const result = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(result.content).toBeLessThanOrEqual(result.viewport);
    if (route === "/contacts") {
      for (const field of await page.locator(".contact-field__control, .submit-button").all()) {
        const box = await field.boundingBox();
        expect(box?.x).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(641);
      }
    }
  });
}

