// @ts-nocheck — runs on Deno (Supabase Edge Runtime), not type-checked by the
// repo's Next.js tsconfig (no Deno globals / remote module types here).
//
// Edge function: send an email when a teammate is @mentioned on a lead.
//
// Invoked (fire-and-forget) from the postComment server action with:
//   { recipientEmail, recipientName, actorName, actorFirstName, leadId,
//     leadOwnerName, commentText, link }
//
// Sends via Resend. If RESEND_API_KEY is not configured, returns 200 with
// { skipped: true } so a missing key never breaks comment posting.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// EMAIL_LOGO_URL / NEXTSURPLUS_APP_URL are optional Supabase secrets that let
// staging point at the staging origin and prod at app.nextsurplus.com. The
// fallback assumes prod since that's the most common host for this function.
const LOGO_URL =
  Deno.env.get("EMAIL_LOGO_URL") ??
  `${(Deno.env.get("NEXTSURPLUS_APP_URL") ?? "https://app.nextsurplus.com").replace(/\/$/, "")}/images/email-logo.png`;
const APP_URL = (Deno.env.get("NEXTSURPLUS_APP_URL") ?? "https://app.nextsurplus.com").replace(/\/$/, "");
const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function renderEmailShell({
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
  const footer = footerLine ?? `<a href="${APP_URL}" style="color:#6b7280;text-decoration:none;">Next Surplus</a>`;
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
    a { color: #13644e; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:${FONT_STACK};color:#1a1a1a;">
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <tr>
            <td height="4" style="height:4px;line-height:0;font-size:0;background-image:linear-gradient(90deg,#04261c 0%,#13644e 50%,#4a9c75 100%);background-color:#13644e;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:30px 40px 0;">
              <img src="${LOGO_URL}" alt="Next Surplus" width="200" height="35" style="display:block;border:0;outline:none;text-decoration:none;width:200px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#1a1a1a;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 40px;background-color:#fafafa;border-top:1px solid #e5e7eb;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:#6b7280;">
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

function renderEmailEyebrow(label: string): string {
  return `<div style="font-family:${FONT_STACK};font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#13644e;">${escapeHtml(label)}</div>`;
}

function renderEmailHeadline(text: string): string {
  return `<h1 style="margin:8px 0 0;font-family:${FONT_STACK};font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#1a1a1a;line-height:1.3;">${escapeHtml(text)}</h1>`;
}

function renderEmailIntro(text: string): string {
  return `<p style="margin:12px 0 0;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#4b5563;">${text}</p>`;
}

function renderEmailButton({ href, label }: { href: string; label: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
  <tr>
    <td style="background-image:linear-gradient(90deg,#04261c 0%,#13644e 100%);background-color:#13644e;border-radius:4px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:${FONT_STACK};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:4px;line-height:1.2;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const recipientEmail = String(payload.recipientEmail ?? "").trim();
  const recipientName = String(payload.recipientName ?? "there").trim();
  const actorName = String(payload.actorName ?? "A teammate").trim();
  const actorFirstNameRaw = String(payload.actorFirstName ?? "").trim();
  // Fall back to the first whitespace-delimited token of actorName when the
  // caller didn't supply a first name explicitly.
  const actorFirstName =
    actorFirstNameRaw || actorName.split(/\s+/)[0] || actorName;
  const leadOwnerName = String(payload.leadOwnerName ?? "").trim();
  const commentText = String(payload.commentText ?? "").trim();
  const rawLink = String(payload.link ?? "").trim();
  const appUrl = (Deno.env.get("APP_URL") ?? "").replace(/\/$/, "");
  const link =
    rawLink.startsWith("http") || !appUrl
      ? rawLink
      : `${appUrl}${rawLink.startsWith("/") ? "" : "/"}${rawLink}`;

  if (!recipientEmail) {
    return new Response(JSON.stringify({ error: "Missing recipientEmail" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const subject = leadOwnerName
    ? `${actorFirstName} Mentioned You in ${leadOwnerName}`
    : `${actorFirstName} Mentioned You on a Lead`;

  const safeOwner = escapeHtml(leadOwnerName);
  const safeActorName = escapeHtml(actorName);
  const safeComment = escapeHtml(commentText).replace(/\n/g, "<br/>");

  const preheader = leadOwnerName
    ? `${actorName} left a note for you on ${leadOwnerName}.`
    : `${actorName} left a note for you on a lead.`;

  const introCopy = leadOwnerName
    ? `${safeActorName} left a note on <strong>${safeOwner}</strong>:`
    : `${safeActorName} left a note for you:`;

  const bodyHtml = `
    ${renderEmailEyebrow("Mention")}
    ${renderEmailHeadline(subject)}
    ${renderEmailIntro(introCopy)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0 0;background-color:#f5f5f5;border-radius:4px;">
      <tr>
        <td style="padding:16px 20px;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:#1a1a1a;">
          ${safeComment}
        </td>
      </tr>
    </table>
    ${link ? renderEmailButton({ href: link, label: "Open the Discussion" }) : ""}
  `;

  const footerLine = `You received this because ${safeActorName} mentioned you on ${leadOwnerName ? `the ${safeOwner} lead` : "a lead"}.`;
  const html = renderEmailShell({ subject, bodyHtml, preheader, footerLine });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "Next Surplus <notifications@nextsurplus.com>",
        to: [recipientEmail],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: "Resend request failed", detail: text }),
        { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }
    const data = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: true, id: (data as { id?: string }).id ?? null }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Send failed", detail: String(err) }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
