// @ts-nocheck — runs on Deno (Supabase Edge Runtime), not type-checked by the
// repo's Next.js tsconfig (no Deno globals / remote module types here).
//
// Edge function: send an email when a teammate is @mentioned on a lead.
//
// Invoked (fire-and-forget) from the postComment server action with:
//   { recipientEmail, recipientName, actorName, leadId, leadAddress,
//     commentText, link }
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
  const leadAddress = String(payload.leadAddress ?? "").trim();
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

  const subject = `${actorName} mentioned you on a lead`;
  const safeComment = escapeHtml(commentText).replace(/\n/g, "<br/>");
  const html = `
    <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#0f1729;max-width:520px;margin:0 auto;">
      <h2 style="font-size:18px;margin:0 0 12px;color:#0a3d4a;">You Were Mentioned</h2>
      <p style="font-size:14px;margin:0 0 8px;">Hi ${escapeHtml(recipientName)},</p>
      <p style="font-size:14px;margin:0 0 12px;">
        <strong>${escapeHtml(actorName)}</strong> mentioned you in the discussion
        ${leadAddress ? `on the lead at <strong>${escapeHtml(leadAddress)}</strong>` : "on a lead"}.
      </p>
      <blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #1a8a9c;background:#f1fbfc;font-size:13px;color:#0f1729;">
        ${safeComment}
      </blockquote>
      ${
        link
          ? `<p style="margin:0 0 8px;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0d6c7d;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:9px 16px;border-radius:6px;">Open The Discussion</a></p>`
          : ""
      }
      <p style="font-size:11px;color:#6b7280;margin:16px 0 0;">Moss Equity Operations Portal</p>
    </div>`;

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
