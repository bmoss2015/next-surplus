import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd());

async function loadEnv() {
  const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    env[k] = v;
  }
  return env;
}

const PREVIEW_BASE =
  process.env.PREVIEW_BASE ?? "https://app.nextsurplus.com";
const LOGO_URL = `${PREVIEW_BASE}/images/email-logo.png`;

const PAGE_BG = "#f5f5f5";
const CARD_BG = "#ffffff";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_BODY = "#4b5563";
const BRAND_DARK = "#04261c";
const BRAND_MID = "#13644e";
const BRAND_LIGHT = "#4a9c75";
const BORDER = "#e5e7eb";
const FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>Next Surplus logo preview</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:${FONT_STACK};color:${TEXT_PRIMARY}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAGE_BG};padding:40px 16px">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560"
       style="max-width:560px;width:100%;background:${CARD_BG};border:1px solid ${BORDER};border-radius:6px;overflow:hidden">
  <tr><td height="4" style="height:4px;line-height:0;font-size:0;background:linear-gradient(90deg,${BRAND_DARK} 0%,${BRAND_MID} 50%,${BRAND_LIGHT} 100%)">&nbsp;</td></tr>
  <tr><td style="padding:30px 40px 0">
    <img src="${LOGO_URL}" alt="Next Surplus" width="200" height="35"
         style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto">
  </td></tr>
  <tr><td style="padding:24px 40px 32px;font-size:14px;line-height:1.6;color:${TEXT_PRIMARY}">
    <h2 style="margin:0 0 12px;font-size:18px;color:${BRAND_DARK}">Logo preview from PR #168</h2>
    <p style="margin:0 0 12px;color:${TEXT_BODY}">
      This email is rendered with the new transparent <code>email-logo.png</code>
      pulled from the PR preview. No dark square behind the diamond, no rect
      background. Should look the same in light and dark Gmail themes.
    </p>
    <p style="margin:0 0 12px;color:${TEXT_BODY}">
      Asset URL:
      <a href="${LOGO_URL}" style="color:${BRAND_MID}">${LOGO_URL}</a>
    </p>
    <p style="margin:0;color:${TEXT_BODY}">
      PR: <a href="https://github.com/bmoss2015/next-surplus/pull/168" style="color:${BRAND_MID}">github.com/bmoss2015/next-surplus/pull/168</a>
    </p>
  </td></tr>
  <tr><td style="padding:18px 40px;background:#fafafa;border-top:1px solid ${BORDER};font-size:12px;color:${TEXT_BODY}">
    Next Surplus
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

async function main() {
  const env = await loadEnv();
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing from .env.local");

  const from = process.env.TEST_FROM ?? "Next Surplus <onboarding@resend.dev>";
  const to = process.env.TEST_TO ?? "bree@mossequitypartners.com";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Next Surplus — transparent logo preview (PR #168)",
      html,
    }),
  });

  const body = await res.text();
  console.log(res.status, body);
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
