import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, it } from "node:test";

import { GET as robotsGet } from "../../src/pages/robots.txt.ts";
import { GET as sitemapGet } from "../../src/pages/sitemap.xml.ts";

const site = new URL("https://andyvi.ru");
const canonicalRoutes = ["/", "/works", "/about", "/process", "/contacts", "/works/ai-avito-admin", "/works/erp4seller", "/works/interno"] as const;
const pageFiles = [
  ["src/pages/index.astro", "/"],
  ["src/pages/works.astro", "/works"],
  ["src/pages/about.astro", "/about"],
  ["src/pages/process.astro", "/process"],
  ["src/pages/contacts.astro", "/contacts"],
  ["src/pages/404.astro", "/404"],
] as const;

async function responseText(responseOrPromise: Response | Promise<Response>): Promise<string> {
  const response = await responseOrPromise;

  assert.equal(response.status, 200);
  return response.text();
}

describe("SEO static contract", () => {
  it("emits robots.txt with production crawl access and sitemap pointer", async () => {
    const response = await robotsGet({ site } as Parameters<typeof robotsGet>[0]);
    const body = await responseText(response);

    assert.equal(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
    assert.match(body, /^User-agent: \*/m);
    assert.match(body, /^Allow: \/$/m);
    assert.match(body, /^Sitemap: https:\/\/andyvi\.ru\/sitemap\.xml$/m);
    assert.doesNotMatch(body, /^Disallow: \/$/m);
  });

  it("blocks crawlers when the noindex deployment switch is enabled", async () => {
    const previousNoIndex = process.env.NO_INDEX;

    try {
      process.env.NO_INDEX = "true";
      const body = await responseText(robotsGet({ site } as Parameters<typeof robotsGet>[0]));

      assert.match(body, /^User-agent: \*/m);
      assert.match(body, /^Disallow: \/$/m);
      assert.doesNotMatch(body, /^Sitemap:/m);
    } finally {
      if (previousNoIndex === undefined) {
        delete process.env.NO_INDEX;
      } else {
        process.env.NO_INDEX = previousNoIndex;
      }
    }
  });

  it("emits a canonical production sitemap without 404 or query URLs", async () => {
    const response = await sitemapGet({ site } as Parameters<typeof sitemapGet>[0]);
    const body = await responseText(response);
    const locs = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

    assert.equal(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
    assert.match(body, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    assert.deepEqual(
      locs,
      canonicalRoutes.map((route) => new URL(route, site).toString()),
    );
    assert.equal(locs.some((loc) => loc.includes("?") || loc.includes("#") || loc.endsWith("/404")), false);
  });

  it("keeps route canonical metadata explicit and query-free", async () => {
    for (const [file, canonicalPath] of pageFiles) {
      const source = await readFile(join(process.cwd(), file), "utf8");

      assert.match(source, new RegExp(`canonicalPath="${canonicalPath.replace("/", "\\/")}"`));
      assert.doesNotMatch(canonicalPath, /[?#]/);
    }
  });

  it("keeps the branded 404 route crawl-safe but out of the sitemap", async () => {
    const source = await readFile(join(process.cwd(), "src/pages/404.astro"), "utf8");

    assert.match(source, /canonicalPath="\/404"/);
    assert.match(source, /currentPage="home"/);
    assert.match(source, /404 \/ lost signal/);
    assert.match(source, /href="\/works"/);
    assert.match(source, /href="\/process"/);
    assert.match(source, /href="\/contacts"/);
    assert.equal(canonicalRoutes.includes("/404" as (typeof canonicalRoutes)[number]), false);
  });

  it("provides the BaseLayout default Open Graph PNG at 1200x630", async () => {
    const layout = await readFile(join(process.cwd(), "src/layouts/BaseLayout.astro"), "utf8");
    const image = await readFile(join(process.cwd(), "public/og-image.png"));

    assert.match(layout, /ogImage = "\/og-image\.png"/);
    assert.equal(image.toString("ascii", 1, 4), "PNG");
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
  });
});
