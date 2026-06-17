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
    a { color: #13644e; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:${FONT_STACK};color:#1a1a1a;">
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td bgcolor="#04261c" align="center" height="48" style="background-color:#04261c;height:48px;padding:10px 0;line-height:0;">
              <img src="${LOGO_URL}" alt="Next Surplus" width="160" height="28" style="display:block;border:0;outline:none;text-decoration:none;width:160px;height:28px;margin:0 auto;">
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:32px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:#1a1a1a;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="#f5f5f5" style="background-color:#f5f5f5;padding:20px 32px;border-top:1px solid #e5e7eb;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:#6b7280;">
              <a href="${APP_URL}" style="color:#6b7280;text-decoration:none;">Next Surplus</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderEmailButton({ href, label }: { href: string; label: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td bgcolor="#13644e" style="background-color:#13644e;border-radius:6px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;min-height:20px;padding:12px 24px;font-family:${FONT_STACK};font-size:15px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;line-height:20px;">${escapeHtml(label)}</a>
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
    ? `${actorFirstName} mentioned you in ${leadOwnerName}`
    : `${actorFirstName} mentioned you on a lead`;

  const safeOwner = escapeHtml(leadOwnerName);
  const safeActorName = escapeHtml(actorName);
  const safeComment = escapeHtml(commentText).replace(/\n/g, "<br/>");

  const preheader = leadOwnerName
    ? `${actorName} left a note for you on ${leadOwnerName}.`
    : `${actorName} left a note for you on a lead.`;

  const bodyHtml = `
    <p style="margin:0;font-size:15px;line-height:1.6;">${safeActorName} mentioned you${safeOwner ? ` in <strong>${safeOwner}</strong>` : ""}:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0 0;background-color:#f5f5f5;border-radius:6px;">
      <tr>
        <td style="padding:16px 20px;font-size:15px;line-height:1.6;color:#1a1a1a;">
          ${safeComment}
        </td>
      </tr>
    </table>
    ${link ? renderEmailButton({ href: link, label: "Open the discussion" }) : ""}
  `;

  const html = renderEmailShell({ subject, bodyHtml, preheader });

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
