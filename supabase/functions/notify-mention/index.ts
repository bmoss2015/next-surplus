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

const LOGO_URL = "https://app.nextsurplus.com/images/email-logo.png";

function renderEmailShell({
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
    a { color: #13644e; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:Inter,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  ${safePreheader ? `<div style="display:none;font-size:1px;color:#f5f7fa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${safePreheader}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td bgcolor="#04261c" style="background-color:#04261c;padding:24px 28px;" align="left">
              <img src="${LOGO_URL}" alt="Next Surplus" width="160" style="display:block;border:0;outline:none;text-decoration:none;height:auto;">
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:28px;font-size:14px;line-height:1.7;color:#1a1a1a;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:0 28px 28px;border-top:1px solid #e5e7eb;">
              <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#5a5a5a;">Next Surplus</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    ? `${actorFirstName} mentioned you on the ${leadOwnerName} Lead`
    : `${actorFirstName} mentioned you on a lead`;

  const safeActorFirst = escapeHtml(actorFirstName);
  const safeOwner = escapeHtml(leadOwnerName);
  const safeComment = escapeHtml(commentText).replace(/\n/g, "<br/>");
  const safeLink = escapeHtml(link);

  const heading = `${safeActorFirst} mentioned you${safeOwner ? ` on the ${safeOwner} Lead` : ""}`;
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#1a1a1a;">${heading}</h1>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:#f8fafc;border-radius:10px;">
      <tr>
        <td style="padding:18px 22px;font-size:14px;line-height:1.7;color:#1a1a1a;">
          ${safeComment}
        </td>
      </tr>
    </table>
    ${
      link
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#13644e" style="background-color:#13644e;border-radius:6px;">
          <a href="${safeLink}" style="display:inline-block;padding:11px 22px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.2px;">Open The Discussion</a>
        </td>
      </tr>
    </table>`
        : ""
    }
    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#5a5a5a;">You received this because you were @mentioned on a lead in Next Surplus.</p>
  `;

  const html = renderEmailShell({ subject, bodyHtml });

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
