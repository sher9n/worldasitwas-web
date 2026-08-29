import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { createGzip, createBrotliCompress, constants as zlibConstants } from "node:zlib";
import { timingSafeEqual } from "node:crypto";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { pool, dbReady, validEmail, addToWaitlist, waitlistSummary } from "./db.js";

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

// ---------------------------------------------------------------- waitlist API

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const bucket = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  bucket.push(now);
  hits.set(ip, bucket);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return bucket.length > MAX_PER_WINDOW;
}

function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket.remoteAddress || "unknown";
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readBody(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleJoin(req, res) {
  if (!pool || !(await dbReady)) {
    return json(res, 503, { ok: false, error: "The waitlist is not available right now." });
  }
  if (rateLimited(clientIp(req))) {
    return json(res, 429, { ok: false, error: "Too many attempts. Try again in a few minutes." });
  }

  let body;
  try {
    body = JSON.parse(await readBody(req) || "{}");
  } catch {
    return json(res, 400, { ok: false, error: "We could not read that. Please try again." });
  }

  // a bot fills every field it finds; a person never sees this one
  if (body.company) return json(res, 200, { ok: true, added: false });

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!validEmail(email)) {
    return json(res, 400, { ok: false, error: "That does not look like an email address." });
  }

  const allowed = ["ios", "android", "either"];
  const platformChosen = allowed.includes(body.platform);
  const platform = platformChosen ? body.platform : "either";

  const requestedCity = typeof body.city === "string"
    ? body.city.trim().replace(/\s+/g, " ").slice(0, 80)
    : "";

  try {
    const { added } = await addToWaitlist({
      email, platform, platformChosen, requestedCity: requestedCity || null, source: "site",
    });
    // never log the address itself
    console.log(`[waitlist] sign-up accepted (new=${added}, platform=${platform}, city=${requestedCity ? "yes" : "no"})`);
    return json(res, 200, { ok: true, added });
  } catch (err) {
    console.error("[waitlist] insert failed:", err.message);
    return json(res, 500, { ok: false, error: "Something broke on our side. Please try again." });
  }
}

async function handleExport(req, res, url) {
  const key = process.env.WAITLIST_ADMIN_KEY;
  const given = url.searchParams.get("key") || String(req.headers["x-admin-key"] || "");
  if (!key || given.length !== key.length || !timingSafeEqual(Buffer.from(given), Buffer.from(key))) {
    return json(res, 404, { ok: false, error: "Not found" });
  }
  if (!pool || !(await dbReady)) return json(res, 503, { ok: false, error: "No database" });

  const summary = await waitlistSummary();
  if (url.searchParams.get("format") === "csv") {
    const rows = ["email,platform,requested_city,source,created_at"];
    for (const r of summary.recent) {
      rows.push([r.email, r.platform || "", r.requested_city || "", r.source || "", r.created_at.toISOString()]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    const csv = rows.join("\n");
    res.writeHead(200, {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="waitlist.csv"',
      "cache-control": "no-store",
    });
    return res.end(csv);
  }
  return json(res, 200, { ok: true, ...summary });
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

  if (pathname === "/api/waitlist" && req.method === "POST") {
    handleJoin(req, res).catch((err) => {
      console.error("[waitlist] unhandled:", err.message);
      json(res, 500, { ok: false, error: "Something broke on our side." });
    });
    return;
  }

  if (pathname === "/api/waitlist" && (req.method === "GET" || req.method === "HEAD")) {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    handleExport(req, res, url).catch((err) => {
      console.error("[waitlist] export failed:", err.message);
      json(res, 500, { ok: false, error: "Export failed." });
    });
    return;
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
  if (!extname(filePath)) {
    if (sendFile(req, res, `${filePath}.html`)) return;
    // /v2 should serve /v2/index.html
    if (sendFile(req, res, join(filePath, "index.html"))) return;
  }
  if (sendFile(req, res, join(root, "404.html"), 404)) return;
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`worldasitwas-web serving ${root} on port ${port}`);
});
