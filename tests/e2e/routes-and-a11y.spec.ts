import { expect, test } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  assertRouteShell,
  gotoAndAssertClean,
  productionRoutes,
  responsiveViewports,
} from "./helpers";

test.describe("production routes", () => {
  for (const route of productionRoutes) {
    test(`${route.id} renders with clean runtime signals`, async ({ page }) => {
      await gotoAndAssertClean(page, route.path);

      await expect(page).toHaveTitle(route.titlePattern);
      await assertRouteShell(page, route.id);
    });
  }

  test("desktop navigation supports active route, back, and forward", async ({ page }) => {
    await gotoAndAssertClean(page, "/");

    await page.locator('[data-nav-item="works"]').first().click();
    await expect(page).toHaveURL(/\/works$/);
    await assertRouteShell(page, "works");

    await page.locator('[data-nav-item="process"]').first().click();
    await expect(page).toHaveURL(/\/process$/);
    await assertRouteShell(page, "process");

    await page.goBack();
    await expect(page).toHaveURL(/\/works$/);
    await assertRouteShell(page, "works");

    await page.goForward();
    await expect(page).toHaveURL(/\/process$/);
    await assertRouteShell(page, "process");
  });

  test("mobile navigation opens, routes, and closes through Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndAssertClean(page, "/");

    const toggle = page.locator("[data-mobile-nav-toggle]");
    const menu = page.locator("[data-mobile-nav]");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toHaveAttribute("data-state", "open");

    await menu.locator('[data-nav-item="contacts"]').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await assertRouteShell(page, "contacts");

    await toggle.click();
    await expect(menu).toHaveAttribute("data-state", "open");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("data-state", "closed");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("responsive route matrix preserves landmarks and avoids horizontal overflow", async ({ page }) => {
    test.slow();

    for (const viewport of responsiveViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of productionRoutes) {
        await page.goto(route.path);
        await expect(page.locator("main#main-content")).toHaveCount(1);
        await expect(page.locator("h1")).toBeVisible();
        await assertNoHorizontalOverflow(page);
      }
    }
  });

  test("simple accessibility landmarks and focus order are present", async ({ page }) => {
    await gotoAndAssertClean(page, "/works");

    await expect(page.locator(".skip-link")).toHaveAttribute("href", "#main-content");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("main#main-content")).toBeFocused();

    await expect(page.getByRole("navigation").first()).toBeVisible();
    await expect(page.locator("nav")).toHaveCount(2);
    await expect(page.locator("button[aria-haspopup='dialog']")).toHaveCount(4);

    const headingLevels = await page.locator("h1,h2,h3,h4,h5,h6").evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1))),
    );
    expect(headingLevels[0]).toBe(1);
    for (let index = 1; index < headingLevels.length; index += 1) {
      const previous = headingLevels[index - 1] ?? 1;
      const current = headingLevels[index] ?? previous;
      expect(current - previous).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("reduced motion", () => {
  test("reduced motion media query is honored on interactive route", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoAndAssertClean(page, "/works");

    await expect.poll(() => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    await page.locator(".card-open").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const modalTransitionDuration = await page.locator("#caseModal").evaluate((modal) =>
      getComputedStyle(modal).transitionDuration,
    );
    expect(modalTransitionDuration).toBe("0s");
  });
});
