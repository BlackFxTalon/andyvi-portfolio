import { expect, test } from "@playwright/test";

test("home presents services and contact actions before the fold", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Сайты, веб-приложения и автоматизация");
  const contact = page.getByRole("link", { name: "Обсудить задачу" }).first();
  await expect(contact).toHaveAttribute("href", "/contacts");
  const contactBox = await contact.boundingBox();
  expect((contactBox?.y ?? 844) + (contactBox?.height ?? 0)).toBeLessThanOrEqual(844);
  await expect(page.getByRole("link", { name: "Посмотреть проекты" }).first()).toHaveAttribute("href", "/works");
  await expect(page.getByText("Схема автоматизации", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Избранные работы" })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("home-mobile.png"), fullPage: true });
});

test("about presents the portrait alongside the biography", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
  await page.goto("/about");
  await expect(page.getByRole("img", { name: "Андрей Воронцов" })).toBeVisible();
  await expect(page.getByText("Андрей Воронцов", { exact: true })).toBeVisible();
});
