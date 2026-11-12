import type { APIRoute } from "astro";
import { cases } from "../data/cases.ts";

export const prerender = true;

const fallbackSite = "https://andyvi.ru/";
const canonicalRoutes = ["/", "/works", "/about", "/process", "/contacts", ...cases.map(({ slug }) => `/works/${slug}`)];

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const GET: APIRoute = ({ site }) => {
  const siteUrl = new URL(site?.toString() ?? fallbackSite);
  const urls = canonicalRoutes
    .map((route) => `  <url>\n    <loc>${escapeXml(new URL(route, siteUrl).toString())}</loc>\n  </url>`)
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
