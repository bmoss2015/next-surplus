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

  // Gmail's documented opt-in: declare color-scheme: light dark + ship our own
  // @media (prefers-color-scheme: dark) rules. With this, Gmail Web stops the
  // aggressive auto-inversion and uses our overrides instead. The .keep-white
  // class on the header texts and button label stays pure white in dark mode.
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    .keep-white { color: #ffffff !important; }
    @media (prefers-color-scheme: dark) {
      .keep-white,
      a.keep-white,
      [data-ogsc] .keep-white {
        color: #ffffff !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,41,0.06),0 4px 12px rgba(15,23,41,0.04);overflow:hidden;">
          <tr>
            <td bgcolor="#0d4b3a" style="background-color:#0d4b3a;padding:24px 28px;">
              <div class="keep-white" style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:#ffffff;font-weight:600;"><font color="#ffffff">Moss Equity Partners</font></div>
              <div class="keep-white" style="font-size:18px;line-height:1.3;color:#ffffff;font-weight:600;margin-top:6px;"><font color="#ffffff">${safeActorFirst} mentioned you${safeOwner ? ` on the ${safeOwner} Lead` : ""}</font></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:#f8fafc;border-radius:10px;">
                <tr>
                  <td style="padding:18px 22px;font-size:14px;line-height:1.7;color:#0f1729;">
                    ${safeComment}
                  </td>
                </tr>
              </table>
              ${
                link
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="#0d4b3a" style="background-color:#0d4b3a;border-radius:6px;">
                    <a href="${safeLink}" class="keep-white" style="display:inline-block;padding:11px 22px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.2px;"><font color="#ffffff">Open The Discussion</font></a>
                  </td>
                </tr>
              </table>`
                  : ""
              }
              <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">You received this because you were @mentioned on a lead in the Moss Equity Operations Portal.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Moss Equity Portal <notifications@mossequitypartners.com>",
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
