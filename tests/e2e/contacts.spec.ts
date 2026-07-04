import { expect, test } from "@playwright/test";
import { gotoAndAssertClean } from "./helpers";

test.describe("contacts route progressive enhancement", () => {
  test("renders labelled fields and blocks invalid browser input before JS submit", async ({ page }) => {
    await gotoAndAssertClean(page, "/contacts");

    await expect(page.locator("[data-contact-form]")).toHaveAttribute("method", "POST");
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
    await expect(page.locator("#contact-message")).toBeVisible();
    await expect(page.locator("#contact-website")).toHaveAttribute("tabindex", "-1");

    await page.locator("#contact-email").fill("not-an-email");
    await page.locator("[data-submit-button]").click();

    await expect.poll(() => page.locator("#contact-email").evaluate((input) =>
      input instanceof HTMLInputElement ? input.validity.valid : true,
    )).toBe(false);
    await expect(page.locator("[data-contact-status]")).toBeHidden();
  });

  test("JS-enhanced submit reports network failure without dropping field values", async ({ page }) => {
    await gotoAndAssertClean(page, "/contacts");

    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() === "POST" && request.url().startsWith(new URL(page.url()).origin)) {
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await page.locator("#contact-name").fill("Test User");
    await page.locator("#contact-email").fill("test@example.com");
    await page.locator("#contact-message").fill("This is a deterministic Playwright contact failure path.");
    await page.locator("[data-submit-button]").click();

    await expect(page.locator("[data-contact-form]")).toHaveAttribute("data-state", "error");
    await expect(page.locator("[data-contact-form]")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator("[data-contact-status]")).toBeVisible();
    await expect(page.locator("[data-contact-status]")).toHaveAttribute("role", "alert");
    await expect(page.locator("#contact-email")).toHaveValue("test@example.com");
  });

  test("no-JS form posts to the server action boundary without requiring real SMTP", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    try {
      await page.goto(`${baseURL}/contacts`);

      const action = await page.locator("[data-contact-form]").getAttribute("action");
      expect(action, "contacts form should expose a server action URL").toBeTruthy();

      const actionUrl = new URL(action ?? "", page.url()).toString();
      await page.route(actionUrl, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "text/html; charset=utf-8",
          body: "<!doctype html><main id=\"main-content\">no-js post intercepted</main>",
        });
      });

      await page.locator("#contact-name").fill("No JS User");
      await page.locator("#contact-email").fill("nojs@example.com");
      await page.locator("#contact-message").fill("This no-JS path posts a deterministic intercepted request.");
      await page.locator("[data-submit-button]").click();

      await expect(page.locator("main#main-content")).toHaveText("no-js post intercepted");
    } finally {
      await context.close();
    }
  });
});
