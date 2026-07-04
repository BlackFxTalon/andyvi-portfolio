import { expect, type Page, type Request, type Response } from "@playwright/test";

export const productionRoutes = [
  { id: "home", path: "/", titlePattern: /AndyVi/ },
  { id: "works", path: "/works", titlePattern: /AndyVi/ },
  { id: "about", path: "/about", titlePattern: /AndyVi/ },
  { id: "process", path: "/process", titlePattern: /AndyVi/ },
  { id: "contacts", path: "/contacts", titlePattern: /AndyVi/ },
] as const;

export const responsiveViewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "desktop-1280", width: 1280, height: 720 },
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
] as const;

const ignoredNetworkHosts = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

function isInternalUrl(page: Page, url: string): boolean {
  return new URL(url).origin === new URL(page.url()).origin;
}

function shouldIgnoreFailedRequest(request: Request): boolean {
  const url = new URL(request.url());
  return ignoredNetworkHosts.has(url.hostname);
}

function shouldTrackBadResponse(page: Page, response: Response): boolean {
  if (!isInternalUrl(page, response.url())) return false;
  if (response.status() < 400) return false;

  const type = response.request().resourceType();
  return type !== "fetch" && type !== "xhr";
}

export function collectRuntimeProblems(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    if (shouldIgnoreFailedRequest(request)) return;
    failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`.trim());
  });

  page.on("response", (response) => {
    if (shouldTrackBadResponse(page, response)) {
      badResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  return {
    assertClean() {
      expect(
        { consoleErrors, pageErrors, failedRequests, badResponses },
        "no console errors, page errors, failed internal requests, or internal 4xx/5xx page assets",
      ).toEqual({
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        badResponses: [],
      });
    },
  };
}

export async function gotoAndAssertClean(page: Page, path: string) {
  const runtime = collectRuntimeProblems(page);
  const response = await page.goto(path);

  expect(response?.ok(), `${path} should respond with a successful document`).toBe(true);
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(page.locator("main#main-content")).toBeVisible();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  runtime.assertClean();
}

export async function assertRouteShell(page: Page, routeId: string) {
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator("body[data-page]")).toHaveAttribute("data-page", routeId);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator('[aria-current="page"]')).toHaveCount(2);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/andyvi\.ru\/?/);
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.ceil(root.scrollWidth - root.clientWidth);
  });

  expect(overflow, "page should not create horizontal document overflow").toBeLessThanOrEqual(1);
}

export async function visibleProjectTitles(page: Page): Promise<string[]> {
  return page.locator(".project-card:visible").evaluateAll((cards) =>
    cards.map((card) => card.getAttribute("data-title") ?? ""),
  );
}
