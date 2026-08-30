/* Re-shoot the app screens that play inside the hero phone.
   ---------------------------------------------------------------------------
   The phone on the front page is not a drawing of the product, it is a set of
   photographs of the live app. They go stale the moment the app changes, so
   this script takes them again, in both themes, and writes them straight into
   public/app/.

       node tools/shoot-app.mjs

   It drives a real Chrome over the DevTools protocol, because the app decides
   what to show from the device it is on: it renders a "made for a phone" gate
   to anything with a mouse, so the browser has to be emulating touch or the
   screenshots come back as that gate. Software WebGL is on for the same kind of
   reason: the map is MapLibre, and headless Chrome without it draws nothing.

   Two things are set in localStorage before the app loads. A remembered address
   skips the email door WITHOUT posting anything to /signup, so re-shooting never
   writes a row to the app's database; and the install prompt is marked dismissed,
   because "Keep this on your home screen" is not what a marketing page should be
   showing. Neither is a trick to get past anything: both are states a returning
   reader is already in.

   Needs Chrome and ImageMagick 7 (`magick`). No npm dependencies. */

import { spawn, execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "public", "app");
const TMP = join(tmpdir(), "waiw-shoot");
const APP = process.env.APP_URL || "https://app.worldasitwas.com/";
const CHROME = process.env.CHROME ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* The phone screen is 280 CSS px wide, so the files are shot at a 390px phone
   viewport at 2x and resized to 560, which is 2x the box they sit in. */
const VIEW = { width: 390, height: 844, scale: 2 };
const WIDE = 560;
const RADIUS = 29;            // the app's 20px sheet radius, at this scale
const CITIES = ["London", "Rome", "Stockholm", "Colombo"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function session(scheme) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const chrome = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--hide-scrollbars",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    `--remote-debugging-port=${port}`, `--user-data-dir=${TMP}/profile-${port}`,
    "about:blank",
  ], { stdio: "ignore" });

  let page;
  for (let i = 0; i < 80 && !page; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      page = list.find((t) => t.type === "page");
    } catch { /* chrome is still coming up */ }
    if (!page) await sleep(250);
  }
  if (!page) throw new Error("Chrome did not come up");

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const evaluate = async (expression) =>
    (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

  return {
    send, evaluate,
    shot: async (file) => {
      const s = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(file, Buffer.from(s.data, "base64"));
    },
    close: async () => { ws.close(); chrome.kill(); await sleep(600); },
  };
}

function magick(args) { execFileSync("magick", args, { stdio: "inherit" }); }

async function shootTheme(scheme) {
  const suffix = scheme === "light" ? "-light" : "";
  const s = await session(scheme);
  await s.send("Page.enable");
  await s.send("Runtime.enable");
  await s.send("Emulation.setEmulatedMedia",
    { features: [{ name: "prefers-color-scheme", value: scheme }] });
  await s.send("Emulation.setDeviceMetricsOverride",
    { width: VIEW.width, height: VIEW.height, deviceScaleFactor: VIEW.scale, mobile: true });
  await s.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await s.send("Emulation.setEmitTouchEventsForMouse",
    { enabled: true, configuration: "mobile" });
  await s.send("Page.addScriptToEvaluateOnNewDocument", { source: `try{
    localStorage.setItem("waiw.email", "shoot@worldasitwas.com");
    localStorage.setItem("waiw.install-dismissed", "1");
  }catch(e){}` });

  await s.send("Page.navigate", { url: APP });
  await sleep(11000);

  const gated = await s.evaluate(`document.body.innerText.includes("made for a phone")`);
  if (gated) throw new Error("the app served its desktop gate: touch emulation did not take");

  // one step out, so every built city sits on one screen
  await s.evaluate(`(() => { const b=document.querySelector(".maplibregl-ctrl-zoom-out");
    if (b) b.click(); })()`);
  await sleep(2200);
  const pins = await s.evaluate(
    `[...document.querySelectorAll(".maplibregl-marker")].map(e => e.textContent.trim())`);
  console.log(`  ${scheme}: map shows ${pins.join(", ")}`);

  await s.shot(`${TMP}/map${suffix}.png`);
  magick([`${TMP}/map${suffix}.png`, "-resize", `${WIDE}x`, "-strip",
          "-quality", "80", "-define", "webp:method=6", `${OUT}/app-map${suffix}.webp`]);

  for (const city of CITIES) {
    await s.evaluate(`(() => { const c=document.querySelector(".panel__close"); if (c) c.click(); })()`);
    await sleep(1400);
    // the app's own search, rather than hunting for a marker that may be off screen
    await s.evaluate(`(() => {
      const i = document.querySelector(".search input") || document.querySelector("input");
      if (!i) return;
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      set.call(i, ${JSON.stringify(city)});
      i.dispatchEvent(new Event("input", { bubbles: true }));
      const f = i.closest("form");
      if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    })()`);
    await sleep(2600);

    const box = await s.evaluate(`(() => { const p = document.querySelector(".panel");
      if (!p) return null;
      const b = p.getBoundingClientRect();
      return JSON.stringify({ name: (document.querySelector(".panel__name")||{}).textContent,
                              top: Math.round(b.top) }); })()`);
    if (!box) throw new Error(`${city}: the app opened no panel`);
    const { name, top } = JSON.parse(box);
    if (name !== city) throw new Error(`asked for ${city}, got ${name}`);

    const slug = city.toLowerCase();
    const raw = `${TMP}/${slug}${suffix}.png`;
    await s.shot(raw);

    /* Crop the sheet away from the map and round its top corners out to
       transparency, so it can slide over the map at any position without
       carrying a slice of the map in its corners. */
    const topPx = top * VIEW.scale;
    const height = VIEW.height * VIEW.scale - topPx;
    magick([raw, "-crop", `${VIEW.width * VIEW.scale}x${height}+0+${topPx}`, "+repage",
            "-resize", `${WIDE}x`, `${TMP}/sheet.png`]);
    const h = Number(execFileSync("magick", ["identify", "-format", "%h", `${TMP}/sheet.png`]));
    magick(["-size", `${WIDE}x${h}`, "xc:black", "-fill", "white",
            "-draw", `roundrectangle 0,0 ${WIDE - 1},${h + RADIUS} ${RADIUS},${RADIUS}`,
            `${TMP}/mask.png`]);
    magick([`${TMP}/sheet.png`, `${TMP}/mask.png`, "-alpha", "Off",
            "-compose", "CopyOpacity", "-composite", "-strip", "-quality", "82",
            "-define", "webp:method=6", `${OUT}/app-panel-${slug}${suffix}.webp`]);
    console.log(`  ${scheme}: ${city} sheet ${WIDE}x${h}`);
  }
  await s.close();
}

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });
try {
  for (const scheme of ["dark", "light"]) await shootTheme(scheme);
  console.log(`\nWritten to public/app/. Check the <img height> values in index.html still`);
  console.log(`match the sheet heights printed above, then look at the page.`);
} finally {
  // Chrome writes to its profile as it shuts down, so a failed sweep is not a failure
  try { rmSync(TMP, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); }
  catch { /* it lives in the OS temp dir; the OS will get it */ }
}
