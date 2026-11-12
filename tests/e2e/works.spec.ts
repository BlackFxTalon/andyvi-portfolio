import { expect, test } from "@playwright/test";
import { gotoAndAssertClean } from "./helpers";

test.describe("works route interactions", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndAssertClean(page, "/works");
  });

  test("shows the small catalog without unnecessary filters", async ({ page }) => {
    await expect(page.locator(".project-card:visible")).toHaveCount(5);
    await expect(page.locator("#projectSearch, #sortBox, #filterToggle")).toHaveCount(0);
  });

  test("opens case modal, traps Escape, and returns focus to opener", async ({ page }) => {
    const opener = page.locator('.project-card[data-title="AUTOAPP"] .card-open');
    await opener.focus();
    await opener.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(page.locator("#caseTitle")).toHaveText("AUTOAPP");
    await expect(page.locator("#caseClose")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#caseClose")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
