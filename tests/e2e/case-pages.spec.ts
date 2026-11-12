import { expect, test } from "@playwright/test";

for (const [slug, title] of [
  ["ai-avito-admin", "AI Avito Admin"],
  ["erp4seller", "ERP4Seller"],
  ["interno", "Интерно"],
] as const) {
  test(`${title} opens a separate, honest project page`, async ({ page }) => {
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/works");
    const card = page.locator(".project-card").filter({ hasText: title });
    await card.getByRole("link", { name: "Описание проекта" }).click();
    await expect(page).toHaveURL(new RegExp(`/works/${slug}/?$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("heading", { name: "Контекст" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Личный вклад" })).toBeVisible();
    await expect(page.getByText("Личный вклад уточняется.")).toBeVisible();
    await expect(page.getByText("Схема проекта", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Обсудить похожую задачу" })).toHaveAttribute("href", "/contacts");
  });
}
