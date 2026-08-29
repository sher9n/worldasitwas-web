import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { createGzip, createBrotliCompress, constants as zlibConstants } from "node:zlib";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT) || 3000;
const root = resolve(fileURLToPath(new URL("./public/", import.meta.url)));
const canonicalHost = process.env.CANONICAL_HOST || "worldasitwas.com";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function cacheControl(pathname) {
  if (pathname.startsWith("/plates/")) return "public, max-age=31536000, immutable";
  if (pathname.endsWith(".html") || pathname === "/") return "public, max-age=0, must-revalidate";
  return "public, max-age=3600";
}

// text compresses well; JPEG does not, so it is served as-is
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".txt", ".xml", ".svg"]);

function sendFile(req, res, filePath, status = 200) {
  let stat;
  try {
    stat = statSync(filePath);
    if (!stat.isFile()) throw new Error("not a file");
  } catch {
    return false;
  }
  const ext = extname(filePath).toLowerCase();
  const headers = {
    "content-type": types[ext] || "application/octet-stream",
    "cache-control": cacheControl(req.url.split("?")[0]),
    "x-content-type-options": "nosniff",
  };

  const accepts = String(req.headers["accept-encoding"] || "");
  let encoder = null;
  if (COMPRESSIBLE.has(ext) && stat.size > 1024) {
    if (/\bbr\b/.test(accepts)) {
      headers["content-encoding"] = "br";
      encoder = createBrotliCompress({
        params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5, [zlibConstants.BROTLI_PARAM_SIZE_HINT]: stat.size },
      });
    } else if (/\bgzip\b/.test(accepts)) {
      headers["content-encoding"] = "gzip";
      encoder = createGzip({ level: 6 });
    }
  }
  if (encoder) headers.vary = "Accept-Encoding";
  else headers["content-length"] = stat.size;

  res.writeHead(status, headers);
  if (req.method === "HEAD") return res.end(), true;

  const stream = createReadStream(filePath);
  stream.on("error", () => res.destroy());
  if (encoder) stream.pipe(encoder).pipe(res);
  else stream.pipe(res);
  return true;
}

const server = createServer((req, res) => {
  const host = (req.headers.host || "").split(":")[0];
  let pathname;
  try {
    pathname = decodeURIComponent(req.url.split("?")[0]);
  } catch {
    res.writeHead(400, { "content-type": "text/plain" });
    return res.end("Bad request");
  }

  if (pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    return res.end(JSON.stringify({ ok: true }));
  }

  // www -> apex, keep the path
  if (host === `www.${canonicalHost}`) {
    res.writeHead(301, { location: `https://${canonicalHost}${req.url}` });
    return res.end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { allow: "GET, HEAD" });
    return res.end();
  }

  // resolve inside /public only
  const rel = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = join(root, rel);
  if (!filePath.startsWith(root + sep) && filePath !== root) {
    res.writeHead(403);
    return res.end();
  }
  if (pathname.endsWith("/")) filePath = join(filePath, "index.html");

  if (sendFile(req, res, filePath)) return;
  if (!extname(filePath) && sendFile(req, res, `${filePath}.html`)) return;
  if (sendFile(req, res, join(root, "404.html"), 404)) return;
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`worldasitwas-web serving ${root} on port ${port}`);
});
