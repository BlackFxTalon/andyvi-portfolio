import { expect, test } from "@playwright/test";
import { gotoAndAssertClean, visibleProjectTitles } from "./helpers";

test.describe("works route interactions", () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndAssertClean(page, "/works");
  });

  test("filters by search, category, technology, and empty state", async ({ page }) => {
    await expect(page.locator(".project-card:visible")).toHaveCount(4);

    await page.locator("#projectSearch").fill("AUTOAPP");
    await expect(page.locator(".project-card:visible")).toHaveCount(1);
    await expect(page.locator('.project-card:visible[data-title="AUTOAPP"]')).toBeVisible();
    await expect(page.locator("#resultsStatus")).toHaveText("Shown 1 project");

    await page.locator("#projectSearch").fill("");
    await page.locator('button[data-category="crm"]').click();
    await expect(page.locator(".project-card:visible")).toHaveCount(2);
    await expect(page.locator('.project-card:visible[data-category="crm"]')).toHaveCount(2);

    await page.locator("#filterToggle").click();
    await expect(page.locator("#advancedFilters")).toHaveClass(/is-open/);
    await page.locator(".tag-check", { has: page.locator('input[data-tech-filter][value="Chart.js"]') }).click();
    await expect(page.locator(".project-card:visible")).toHaveCount(1);
    await expect(page.locator('.project-card:visible[data-title="ERP4Seller"]')).toBeVisible();

    await page.locator("#projectSearch").fill("no matching project");
    await expect(page.locator(".project-card:visible")).toHaveCount(0);
    await expect(page.locator("#emptyState")).toBeVisible();
    await expect(page.locator("#resultsStatus")).toHaveText("Shown 0 projects");
  });

  test("sorts projects by year without losing the visible set", async ({ page }) => {
    const initialTitles = await visibleProjectTitles(page);
    expect(initialTitles).toHaveLength(4);
    expect(initialTitles.slice(0, 2)).toEqual(["AUTOAPP", "ERP4Seller"]);

    await page.locator("#sortBox").click();
    await expect(page.locator("#sortBox")).toHaveAttribute("aria-label", "Sort projects: oldest first");
    await expect(page.locator("#sortBox")).toHaveAttribute("aria-pressed", "true");

    const years = await page.locator(".project-card:visible").evaluateAll((cards) =>
      cards.map((card) => Number(card.getAttribute("data-year"))),
    );
    expect(years).toEqual([2023, 2024, 2025, 2026]);
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
