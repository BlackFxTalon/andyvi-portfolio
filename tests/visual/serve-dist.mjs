import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const root = resolve(projectRoot, "dist/client");
const port = Number.parseInt(process.env.VISUAL_PORT || "4174", 10);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(join(root, normalized));
  if (!candidate.startsWith(root)) return null;

  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const indexPath = join(candidate, "index.html");
    if (existsSync(indexPath)) return indexPath;
  }

  const htmlPath = `${candidate}.html`;
  if (existsSync(htmlPath)) return htmlPath;

  const nestedIndexPath = join(candidate, "index.html");
  if (existsSync(nestedIndexPath)) return nestedIndexPath;

  return null;
}

const server = createServer((req, res) => {
  if (!existsSync(root)) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("dist/client is missing; run npm run build before visual baselines.");
    return;
  }

  const filePath = resolveRequestPath(req.url || "/");
  if (!filePath) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "cache-control": "no-store",
    "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`visual static server: http://127.0.0.1:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
