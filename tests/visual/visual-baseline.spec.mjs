import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import {
  visualProjectRoot,
  visualDiffPolicy,
  visualMasks,
  visualRoutes,
  visualStability,
  visualViewports,
} from "./visual-baseline.contract.mjs";

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  if (!process.env.VISUAL_BASE_URL && !existsSync(`${visualProjectRoot}/dist/client/index.html`)) {
    throw new Error("dist/client/index.html is missing; run npm run build before visual baselines.");
  }
});

for (const route of visualRoutes) {
  for (const viewport of visualViewports) {
    test(`${route.id} ${viewport.id}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({
        colorScheme: visualStability.colorScheme,
        reducedMotion: visualStability.reducedMotion,
      });
      await page.addInitScript((fixedTimeIso) => {
        const fixedTime = Date.parse(fixedTimeIso);
        const RealDate = Date;
        class FixedDate extends RealDate {
          constructor(...args) {
            super(...(args.length ? args : [fixedTime]));
          }

          static now() {
            return fixedTime;
          }
        }
        FixedDate.UTC = RealDate.UTC;
        FixedDate.parse = RealDate.parse;
        window.Date = FixedDate;
        Math.random = () => 0.424242;
      }, visualStability.fixedTimeIso);

      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-delay: 0s !important;
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-delay: 0s !important;
            transition-duration: 0s !important;
          }

          html {
            caret-color: transparent !important;
          }
        `,
      });
      await page.evaluate(async () => {
        await document.fonts?.ready;
        window.scrollTo(0, 0);
      });

      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.locator("body")).not.toHaveClass(/is-page-exiting/);

      const maskLocators = visualMasks.defaultSelectors.map((selector) => page.locator(selector));
      await expect(page).toHaveScreenshot(`${route.id}/${viewport.id}.png`, {
        animations: visualStability.animations,
        caret: "hide",
        fullPage: visualDiffPolicy.fullPage,
        mask: maskLocators,
        maxDiffPixelRatio: visualDiffPolicy.maxDiffPixelRatio,
        scale: "css",
        threshold: visualDiffPolicy.threshold,
      });
    });
  }
}
