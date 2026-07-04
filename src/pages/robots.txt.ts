import type { APIRoute } from "astro";

export const prerender = true;

const fallbackSite = "https://andyvi.ru/";
const truthyValues = new Set(["1", "true", "yes", "on"]);
const nonProductionContexts = new Set(["development", "preview", "staging"]);

function shouldBlockIndexing(): boolean {
  const explicitNoIndex =
    process.env.NO_INDEX ?? process.env.PUBLIC_NO_INDEX ?? process.env.PUBLIC_ROBOTS_NO_INDEX;
  const deployContext =
    process.env.PUBLIC_DEPLOY_CONTEXT ??
    process.env.DEPLOY_CONTEXT ??
    process.env.VERCEL_ENV ??
    process.env.CF_PAGES_BRANCH;

  return (
    truthyValues.has(explicitNoIndex?.toLowerCase() ?? "") ||
    nonProductionContexts.has(deployContext?.toLowerCase() ?? "")
  );
}

export const GET: APIRoute = ({ site }) => {
  const siteUrl = new URL(site?.toString() ?? fallbackSite);
  const body = shouldBlockIndexing()
    ? ["User-agent: *", "Disallow: /"]
    : ["User-agent: *", "Allow: /", `Sitemap: ${new URL("/sitemap.xml", siteUrl).toString()}`];

  return new Response(`${body.join("\n")}\n`, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
