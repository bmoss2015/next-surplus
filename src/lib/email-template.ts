const LOGO_URL = "https://app.nextsurplus.com/images/email-logo.png";

const HEADER_BG = "#04261c";
const BODY_BG = "#ffffff";
const TEXT_INK = "#1a1a1a";
const LINK = "#13644e";
const MUTED = "#5a5a5a";

export function renderEmailShell({
  subject,
  bodyHtml,
  preheader,
}: {
  subject: string;
  bodyHtml: string;
  preheader?: string;
}): string {
  const safeSubject = escapeHtml(subject);
  const safePreheader = preheader ? escapeHtml(preheader) : "";

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
    a { color: ${LINK}; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:Inter,Helvetica,Arial,sans-serif;color:${TEXT_INK};">
  ${safePreheader ? `<div style="display:none;font-size:1px;color:#f5f7fa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:${BODY_BG};border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td bgcolor="${HEADER_BG}" style="background-color:${HEADER_BG};padding:24px 28px;" align="left">
              <img src="${LOGO_URL}" alt="Next Surplus" width="160" style="display:block;border:0;outline:none;text-decoration:none;height:auto;">
            </td>
          </tr>
          <tr>
            <td bgcolor="${BODY_BG}" style="background-color:${BODY_BG};padding:28px;font-size:14px;line-height:1.7;color:${TEXT_INK};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="${BODY_BG}" style="background-color:${BODY_BG};padding:0 28px 28px;border-top:1px solid #e5e7eb;">
              <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">Next Surplus</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  textInk: TEXT_INK,
  link: LINK,
  muted: MUTED,
} as const;
