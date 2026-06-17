const LOGO_URL = "https://app.nextsurplus.com/images/email-logo.png";
const APP_URL = "https://app.nextsurplus.com";

const HEADER_BG = "#04261c";
const BODY_BG = "#ffffff";
const FOOTER_BG = "#f5f5f5";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_SECONDARY = "#6b7280";
const LINK = "#13644e";
const BORDER = "#e5e7eb";

const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function renderEmailShell({
  subject,
  bodyHtml,
  preheader,
}: {
  subject: string;
  bodyHtml: string;
  preheader: string;
}): string {
  const safeSubject = escapeHtml(subject);
  const safePreheader = escapeHtml(preheader);

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
    a { color: ${LINK}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${FOOTER_BG};font-family:${FONT_STACK};color:${TEXT_PRIMARY};">
  <div style="display:none;font-size:1px;color:${FOOTER_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${FOOTER_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:${BODY_BG};border-radius:8px;overflow:hidden;border:1px solid ${BORDER};">
          <tr>
            <td bgcolor="${HEADER_BG}" align="center" height="48" style="background-color:${HEADER_BG};height:48px;padding:10px 0;line-height:0;">
              <img src="${LOGO_URL}" alt="Next Surplus" width="160" height="28" style="display:block;border:0;outline:none;text-decoration:none;width:160px;height:28px;margin:0 auto;">
            </td>
          </tr>
          <tr>
            <td bgcolor="${BODY_BG}" style="background-color:${BODY_BG};padding:32px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${TEXT_PRIMARY};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="${FOOTER_BG}" style="background-color:${FOOTER_BG};padding:20px 32px;border-top:1px solid ${BORDER};font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${TEXT_SECONDARY};">
              <a href="${APP_URL}" style="color:${TEXT_SECONDARY};text-decoration:none;">Next Surplus</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmailButton({
  href,
  label,
}: {
  href: string;
  label: string;
}): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td bgcolor="${LINK}" style="background-color:${LINK};border-radius:6px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;min-height:20px;padding:12px 24px;font-family:${FONT_STACK};font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;line-height:20px;">${escapeHtml(label)}</a>
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
  headerBg: HEADER_BG,
  bodyBg: BODY_BG,
  footerBg: FOOTER_BG,
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  link: LINK,
  border: BORDER,
} as const;
