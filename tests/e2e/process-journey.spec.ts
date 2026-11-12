import { expect, test } from "@playwright/test";

test("explains collaboration and links to contacts", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
  await page.goto("/process");
  await expect(page.getByRole("heading", { name: "Обсуждение задачи" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Согласование объёма" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Разработка и проверка" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Подготовка запуска" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Связаться со мной" })).toHaveAttribute("href", "/contacts");
});

test("offers a contact from the about page", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
  await page.goto("/about");
  await expect(page.getByRole("link", { name: "Обсудить задачу" })).toHaveAttribute("href", "/contacts");
});

test("offers useful next steps on the 404 page", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ body: "" }));
  await page.goto("/404");
  await expect(page.getByText("Такой страницы нет. Посмотрите проекты или свяжитесь со мной.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Работы" }).last()).toHaveAttribute("href", "/works");
  await expect(page.getByRole("link", { name: "Контакты" }).last()).toHaveAttribute("href", "/contacts");
});
