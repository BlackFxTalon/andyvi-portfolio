# Static SEO Report

status: PARTIAL

scope:
- src/pages/robots.txt.ts
- src/pages/sitemap.xml.ts
- src/pages/404.astro
- src/layouts/BaseLayout.astro default OG image contract
- public/og-image.png

evidence:
- Astro endpoint convention: Context7 `/withastro/docs`, API routes return `Response`; `site` config is used for absolute sitemap/canonical URLs.
- Current SEO source lookup: Firecrawl search found official Google Search Central pages for robots.txt, canonical URLs, sitemaps, title links, and snippets, plus `https://ogp.me/` for Open Graph basics.
- Research limitation: full-page scrape and search feedback were blocked by the Firecrawl usage limit, so this is a baseline technical SEO report rather than a complete current-practice research cache.
- Focused check: `node --test tests/seo/static.test.ts`.

findings:
- PASS: robots.txt allows production crawling and points to `https://andyvi.ru/sitemap.xml`.
- PASS: sitemap emits only canonical public routes: `/`, `/works`, `/about`, `/process`, `/contacts`.
- PASS: canonical route metadata is explicit and query-free in public page sources.
- PASS: branded 404 page has `/404` canonical metadata but is excluded from the sitemap.
- PASS: BaseLayout default Open Graph path `/og-image.png` resolves to a 1200x630 PNG.

openRisks:
- Lighthouse and rendered browser SEO checks are deferred to a preview/runtime lane.
- Schema.org structured data is not currently present in the checked static contract.
- Firecrawl current-research scrape was unavailable due usage limit.

nextAction: rerun focused SEO test after any route, BaseLayout metadata, robots, sitemap, or OG asset change.
