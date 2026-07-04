import { expect, test, type BrowserContext, type Page } from "@playwright/test";

type RuntimeIssue = {
  source: "console" | "pageerror" | "requestfailed" | "response";
  message: string;
};

const routes = [
  { path: "/", pageId: "home", canonicalPath: "/" },
  { path: "/works", pageId: "works", canonicalPath: "/works" },
  { path: "/about", pageId: "about", canonicalPath: "/about" },
  { path: "/process", pageId: "process", canonicalPath: "/process" },
  { path: "/contacts", pageId: "contacts", canonicalPath: "/contacts" },
] as const;

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

function isLocalRuntimeUrl(rawUrl: string): boolean {
  const url = new URL(rawUrl);
  return url.hostname === "127.0.0.1" || url.hostname === "localhost";
}

async function installDeterministicNetworkMocks(context: BrowserContext): Promise<void> {
  await context.route("https://fonts.googleapis.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      body: "/* deterministic e2e font fallback */",
    });
  });
  await context.route("https://fonts.gstatic.com/**", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
}

function collectRuntimeIssues(page: Page): RuntimeIssue[] {
  const issues: RuntimeIssue[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      issues.push({
        source: "console",
        message: message.text(),
      });
    }
  });

  page.on("pageerror", (error) => {
    issues.push({
      source: "pageerror",
      message: error.message,
    });
  });

  page.on("requestfailed", (request) => {
    if (!isLocalRuntimeUrl(request.url())) return;
    const failure = request.failure()?.errorText ?? "unknown failure";
    issues.push({
      source: "requestfailed",
      message: `${request.method()} ${new URL(request.url()).pathname}: ${failure}`,
    });
  });

  page.on("response", (response) => {
    if (!isLocalRuntimeUrl(response.url())) return;
    if (response.status() >= 400) {
      issues.push({
        source: "response",
        message: `${response.status()} ${response.request().method()} ${new URL(response.url()).pathname}`,
      });
    }
  });

  return issues;
}

async function expectRuntimeClean(issues: RuntimeIssue[]): Promise<void> {
  expect(issues).toEqual([]);
}

async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator("main#main-content")).toBeVisible();
}

async function expectBaseLandmarks(page: Page, pageId: string): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("body")).toHaveAttribute("data-page", pageId);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.locator("header#siteHeader")).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("a.skip-link")).toHaveAttribute("href", "#main-content");
  await expect(page.locator("link[rel='canonical']")).toHaveCount(1);
}

async function visibleProjectCards(page: Page) {
  return page.locator(".project-card:not([hidden])");
}

async function mockSuccessfulContactAction(page: Page): Promise<string[]> {
  const submittedFields: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.method() !== "POST" || !isLocalRuntimeUrl(request.url())) {
      await route.continue();
      return;
    }

    const postData = request.postData() ?? "";
    submittedFields.push(postData);

    await route.fulfill({
      status: 200,
      contentType: "application/json+devalue",
      body: '[{"ok":1,"status":2},true,"accepted"]',
    });
  });

  return submittedFields;
}

test.beforeEach(async ({ context }) => {
  await installDeterministicNetworkMocks(context);
});

test("renders the five route shells across the responsive matrix with basic landmarks", async ({ page }) => {
  const issues = collectRuntimeIssues(page);

  for (const viewport of viewports) {
    await test.step(`${viewport.name} route matrix`, async () => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of routes) {
        await test.step(`${viewport.name} ${route.path}`, async () => {
          await gotoReady(page, route.path);
          await expectBaseLandmarks(page, route.pageId);
          await expect(page).toHaveURL(new RegExp(`${route.canonicalPath === "/" ? "/$" : `${route.canonicalPath}/?$`}`));

          if (viewport.width >= 1280) {
            await expect(page.getByRole("navigation").first()).toBeVisible();
          } else {
            await expect(page.locator("[data-mobile-nav-toggle]")).toBeVisible();
          }
        });
      }
    });
  }

  await expectRuntimeClean(issues);
});

test("keeps desktop navigation and browser back-forward history coherent", async ({ page }) => {
  const issues = collectRuntimeIssues(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await gotoReady(page, "/");

  await page.locator('header a[href="/works"]').click();
  await expect(page).toHaveURL(/\/works\/?$/);
  await expect(page.locator("body")).toHaveAttribute("data-page", "works");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).toHaveAttribute("data-page", "home");

  await page.goForward();
  await expect(page).toHaveURL(/\/works\/?$/);
  await expect(page.locator("body")).toHaveAttribute("data-page", "works");

  await page.locator('header a[href="/contacts"]').click();
  await expect(page).toHaveURL(/\/contacts\/?$/);
  await expect(page.locator("body")).toHaveAttribute("data-page", "contacts");

  await expectRuntimeClean(issues);
});

test("filters Works by search/category/technology and opens a keyboard-closeable case modal", async ({ page }) => {
  const issues = collectRuntimeIssues(page);

  await gotoReady(page, "/works");
  await expect(page.locator(".project-card")).toHaveCount(4);
  await expect(page.locator("[data-works-status]")).toContainText(/Shown 4 projects|Показано 4/);

  await page.locator("[data-works-search]").fill("ERP4Seller");
  await expect(await visibleProjectCards(page)).toHaveCount(1);
  await expect(page.locator(".project-card:not([hidden])")).toHaveAttribute("data-title", "ERP4Seller");
  await expect(page.locator("[data-works-status]")).toContainText("Shown 1 project");

  await page.locator("[data-works-search]").fill("");
  await page.locator('button[data-category="crm"]').click();
  await expect(await visibleProjectCards(page)).toHaveCount(2);
  await expect(page.locator("[data-works-status]")).toContainText("Shown 2 projects");

  await page.locator('button[data-category="all"]').click();
  await page.locator("#filterToggle").click();
  await expect(page.locator("#advancedFilters")).toHaveClass(/is-open/);
  await page.locator('input[data-tech-filter][value="Vue"]').check({ force: true });
  await expect(await visibleProjectCards(page)).toHaveCount(3);
  await expect(page.locator("[data-works-status]")).toContainText("Shown 3 projects");

  const firstCard = page.locator(".project-card:not([hidden])").first();
  const expectedTitle = await firstCard.getAttribute("data-title");
  await firstCard.locator('[data-action="open-case"]').click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(page.locator("[data-case-title]")).toHaveText(expectedTitle ?? "");
  await expect(page.locator("[data-case-close]")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await expectRuntimeClean(issues);
});

test("submits Contacts through the JavaScript action path with a deterministic browser mock", async ({ page }) => {
  const issues = collectRuntimeIssues(page);
  const submittedFields = await mockSuccessfulContactAction(page);

  await gotoReady(page, "/contacts");
  const form = page.locator("[data-contact-form]");
  await expect(form).toHaveAttribute("method", /post/i);
  await expect(form).toHaveAttribute("action", /\?_action=contact\.send/);

  await page.locator("#contact-name").fill("E2E User");
  await page.locator("#contact-email").fill("e2e@example.com");
  await page.locator("#contact-message").fill("I need a deterministic browser contact test.");
  await page.locator("[data-submit-button]").click();

  await expect(form).toHaveAttribute("data-state", "success");
  await expect(page.locator("[data-contact-status]")).toBeVisible();
  await expect(page.locator("[data-contact-status]")).toHaveClass(/is-success/);
  await expect(page.locator("#contact-name")).toHaveValue("");
  expect(submittedFields.join("\n")).toContain("E2E User");
  expect(submittedFields.join("\n")).toContain("e2e@example.com");

  await expectRuntimeClean(issues);
});

test("keeps the Contacts no-JavaScript fallback form postable without client interception", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: String(test.info().project.use.baseURL ?? "http://127.0.0.1:4321"),
    javaScriptEnabled: false,
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  await installDeterministicNetworkMocks(context);

  const page = await context.newPage();
  const issues = collectRuntimeIssues(page);

  try {
    await gotoReady(page, "/contacts");
    const form = page.locator("[data-contact-form]");
    await expect(form).toHaveAttribute("method", /post/i);
    await expect(form).toHaveAttribute("action", /\?_action=contact\.send/);
    await expect(page.locator("[data-submit-button]")).not.toBeDisabled();
    await expect(page.locator("[data-contact-status]")).toBeHidden();
    expect(
      await page.evaluate(() => document.querySelector("[data-contact-form]")?.getAttribute("aria-busy")),
    ).toBeNull();

    await expectRuntimeClean(issues);
  } finally {
    await context.close();
  }
});

test("honors reduced motion for frame transitions and interactive controls", async ({ page }) => {
  const issues = collectRuntimeIssues(page);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReady(page, "/works");

  const motionState = await page.evaluate(() => {
    const modal = document.querySelector<HTMLElement>("[data-case-modal]");
    return {
      mediaMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      modalTransition: modal ? getComputedStyle(modal).transitionDuration : "",
    };
  });

  expect(motionState.mediaMatches).toBe(true);
  expect(motionState.modalTransition).toMatch(/0s|0ms/);

  await expectRuntimeClean(issues);
});
