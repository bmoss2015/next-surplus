const PROD_APP_URL = "https://app.nextsurplus.com";

function resolveLogoUrl(): string {
  const override = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL;
  if (override) return override.replace(/\/$/, "");
  return `${PROD_APP_URL}/images/email-logo.png`;
}

const LOGO_URL = resolveLogoUrl();

const PAGE_BG = "#f5f5f5";
const CARD_BG = "#ffffff";
const FOOTER_BG = "#fafafa";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#6b7280";
const TEXT_BODY = "#4b5563";
const BRAND_DARK = "#04261c";
const BRAND_MID = "#13644e";
const BRAND_LIGHT = "#4a9c75";
const BORDER = "#e5e7eb";

const FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function renderEmailShell({
  subject,
  bodyHtml,
  preheader,
  footerLine,
}: {
  subject: string;
  bodyHtml: string;
  preheader: string;
  footerLine?: string;
}): string {
  const safeSubject = escapeHtml(subject);
  const safePreheader = escapeHtml(preheader);
  const footer = footerLine ?? "Next Surplus";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${safeSubject}</title>
  <style>
    :root { color-scheme: light only; supported-color-schemes: light; }
    a { color: ${BRAND_MID}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT_STACK};color:${TEXT_PRIMARY};">
  <div style="display:none;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAGE_BG};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:${CARD_BG};border:1px solid ${BORDER};border-radius:6px;overflow:hidden;">
          <tr>
            <td height="4" style="height:4px;line-height:0;font-size:0;background-image:linear-gradient(90deg,${BRAND_DARK} 0%,${BRAND_MID} 50%,${BRAND_LIGHT} 100%);background-color:${BRAND_MID};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:30px 40px 0;">
              <img src="${LOGO_URL}" alt="Next Surplus" width="200" height="35" style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${TEXT_PRIMARY};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 40px;background-color:${FOOTER_BG};border-top:1px solid ${BORDER};font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${TEXT_SECONDARY};">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmailEyebrow(label: string): string {
  return `<div style="font-family:${FONT_STACK};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND_MID};">${escapeHtml(label)}</div>`;
}

export function renderEmailHeadline(text: string): string {
  return `<h1 style="margin:8px 0 0;font-family:${FONT_STACK};font-size:22px;font-weight:600;letter-spacing:-0.01em;color:${TEXT_PRIMARY};line-height:1.3;">${escapeHtml(text)}</h1>`;
}

export function renderEmailIntro(text: string): string {
  return `<p style="margin:12px 0 0;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${TEXT_BODY};">${text}</p>`;
}

export function renderEmailDataBlock(
  rows: Array<{ label: string; value: string }>
): string {
  const rowHtml = rows
    .map((r, i) => {
      const topPad = i === 0 ? "14px" : "6px";
      const bottomPad = i === rows.length - 1 ? "14px" : "6px";
      return `<tr><td style="padding:${topPad} 0 ${bottomPad};font-family:${FONT_STACK};font-size:12px;color:${TEXT_SECONDARY};width:120px;vertical-align:top;">${escapeHtml(r.label)}</td><td style="padding:${topPad} 0 ${bottomPad};font-family:${FONT_STACK};font-size:14px;color:${TEXT_PRIMARY};vertical-align:top;">${escapeHtml(r.value)}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 0;border-top:1px solid ${BORDER};">${rowHtml}</table>`;
}

export function renderEmailButton({
  href,
  label,
}: {
  href: string;
  label: string;
}): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
  <tr>
    <td style="background-image:linear-gradient(90deg,${BRAND_DARK} 0%,${BRAND_MID} 100%);background-color:${BRAND_MID};border-radius:4px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:4px;line-height:1.2;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const EMAIL_COLORS = {
  pageBg: PAGE_BG,
  cardBg: CARD_BG,
  footerBg: FOOTER_BG,
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  textBody: TEXT_BODY,
  brandDark: BRAND_DARK,
  brandMid: BRAND_MID,
  brandLight: BRAND_LIGHT,
  border: BORDER,
} as const;
