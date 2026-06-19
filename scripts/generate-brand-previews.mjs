import puppeteer from "file:///C:/tmp/preview-gen/node_modules/puppeteer/lib/puppeteer/puppeteer.js";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const PUBLIC = path.join(ROOT, "public");
const PREVIEWS = path.join(PUBLIC, "previews");

const LOCKUP = `
  <svg viewBox="0 0 460 80" width="184" height="32" aria-label="Next Surplus" style="display:block">
    <polygon points="40,26 54,40 40,54 26,40" fill="#ffffff" />
    <polygon points="40,26 54,40 40,40" fill="#13644e" />
    <polygon points="40,40 54,40 40,54" fill="#4a9c75" />
    <text x="90" y="56" font-family="Inter, 'Plus Jakarta Sans', system-ui, sans-serif"
          font-size="42" font-weight="500" fill="#04261c"
          letter-spacing="-0.5" word-spacing="6">Next Surplus</text>
  </svg>`;

const SIGNUP_HTML = `
<!doctype html><html><head><meta charset="utf-8" />
<style>
  html,body{margin:0;padding:0;background:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#04261c}
  .panel{position:relative;width:560px;height:300px;background:#fff;padding:40px}
  .mark{position:absolute;left:40px;top:40px}
  .h1{margin:96px 0 0 0;font-size:22px;font-weight:600;letter-spacing:-0.02em}
  .sub{margin:8px 0 0 0;color:#6b7280;font-size:13px}
</style></head>
<body><div class="panel">
  <div class="mark">${LOCKUP}</div>
  <h1 class="h1">Create Your Account</h1>
  <p class="sub">$49/month. 14 day free trial.</p>
</div></body></html>`;

const LOGIN_HTML = `
<!doctype html><html><head><meta charset="utf-8" />
<style>
  html,body{margin:0;padding:0;background:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#04261c}
  .panel{width:420px;height:260px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:48px 32px}
  .mark{margin-bottom:40px}
  .h1{margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em}
</style></head>
<body><div class="panel">
  <div class="mark">${LOCKUP}</div>
  <h1 class="h1">Log In To Next Surplus</h1>
</div></body></html>`;

const FAVICON_HTML = `
<!doctype html><html><head><meta charset="utf-8" />
<style>
  html,body{margin:0;padding:0;background:#e5e7eb;font-family:Inter,system-ui,sans-serif;color:#04261c}
  .frame{width:520px;padding:24px}
  .tab{display:inline-flex;align-items:center;gap:8px;background:#fff;border-radius:8px 8px 0 0;padding:8px 14px;font-size:12.5px;color:#374151;box-shadow:0 -1px 0 #d1d5db inset}
  .tab img{width:16px;height:16px;display:block}
  .row{margin-top:18px;display:flex;gap:14px;align-items:center}
  .row img{display:block;background:#fff;border-radius:6px;padding:6px;box-shadow:0 0 0 1px #d1d5db}
  .lbl{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.14em}
</style></head>
<body><div class="frame">
  <div class="lbl">Browser Tab</div>
  <div style="margin-top:6px"><span class="tab"><img src="/favicon-32.png" /><span>Next Surplus</span></span></div>
  <div class="lbl" style="margin-top:24px">Touch Icons</div>
  <div class="row">
    <img src="/favicon-16.png" width="16" height="16" />
    <img src="/favicon-32.png" width="32" height="32" />
    <img src="/favicon-48.png" width="48" height="48" />
    <img src="/apple-touch-icon.png" width="60" height="60" />
    <img src="/android-chrome-192x192.png" width="72" height="72" />
  </div>
</div></body></html>`;

const EMAIL_HTML = `
<!doctype html><html><head><meta charset="utf-8" />
<style>
  html,body{margin:0;padding:0;background:#f3f4f6;font-family:Inter,system-ui,sans-serif;color:#04261c}
  .mail{width:560px;margin:24px;background:#fff;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 0 0 1px #e5e7eb}
  .head{padding:24px 28px;border-bottom:1px solid #f1f5f4}
  .head img{display:block;height:35px;width:auto}
  .body{padding:24px 28px;font-size:14px;color:#374151;line-height:1.55}
  .body h2{margin:0 0 8px 0;font-size:16px;color:#04261c}
</style></head>
<body><div class="mail">
  <div class="head"><img src="/images/email-logo.png" /></div>
  <div class="body">
    <h2>Welcome to Next Surplus</h2>
    <p>Confirming preview of the transparent email logo at its rendered size in a typical mail layout.</p>
  </div>
</div></body></html>`;

async function shot(browser, html, file, clip) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 800, deviceScaleFactor: 2 });
  await page.goto("data:text/html;base64," + Buffer.from(html).toString("base64"), {
    waitUntil: "networkidle0",
  });
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) =>
        img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true }))
      )
    );
  });
  const target = path.join(PREVIEWS, file);
  await page.screenshot({ path: target, omitBackground: false, clip });
  console.log("wrote", path.relative(ROOT, target));
  await page.close();
}

async function main() {
  await fs.mkdir(PREVIEWS, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "C:/Users/info/.cache/puppeteer/chrome/win64-149.0.7827.22/chrome-win64/chrome.exe",
  });
  try {
    const dataUri = async (p) =>
      "data:image/png;base64," + (await fs.readFile(p)).toString("base64");

    const ICONS = {
      "/favicon-16.png": await dataUri(path.join(PUBLIC, "favicon-16.png")),
      "/favicon-32.png": await dataUri(path.join(PUBLIC, "favicon-32.png")),
      "/favicon-48.png": await dataUri(path.join(PUBLIC, "favicon-48.png")),
      "/apple-touch-icon.png": await dataUri(path.join(PUBLIC, "apple-touch-icon.png")),
      "/android-chrome-192x192.png": await dataUri(
        path.join(PUBLIC, "android-chrome-192x192.png")
      ),
      "/images/email-logo.png": await dataUri(path.join(PUBLIC, "images", "email-logo.png")),
    };
    const inlineImages = (html) =>
      Object.entries(ICONS).reduce(
        (acc, [src, uri]) => acc.split(`src="${src}"`).join(`src="${uri}"`),
        html
      );

    await shot(browser, SIGNUP_HTML, "signup-logo.png", { x: 0, y: 0, width: 560, height: 300 });
    await shot(browser, LOGIN_HTML, "login-logo.png", { x: 0, y: 0, width: 420, height: 260 });
    await shot(browser, inlineImages(FAVICON_HTML), "favicon-preview.png", {
      x: 0,
      y: 0,
      width: 520,
      height: 240,
    });
    await shot(browser, inlineImages(EMAIL_HTML), "email-logo-preview.png", {
      x: 0,
      y: 0,
      width: 610,
      height: 260,
    });
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
