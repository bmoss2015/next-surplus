import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit, ipFromRequest } from "@/lib/security/rate-limit";
import { escapeHtml } from "@/lib/email-template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_INBOX = "support@nextsurplus.com";
const FROM_ADDRESS = "Next Surplus Feedback <feedback@nextsurplus.com>";
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(`feedback:${ip}`, 20, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let payload: { message?: unknown };
  try {
    payload = (await req.json()) as { message?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message) {
    return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` },
      { status: 400 }
    );
  }

  const admin = createServiceClient();
  const { data: org } = await admin
    .from("orgs")
    .select("name")
    .eq("id", profile.orgId)
    .maybeSingle();
  const orgName = (org?.name as string | null) ?? "Unknown org";

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[feedback] RESEND_API_KEY not set; feedback not sent");
    return NextResponse.json(
      { ok: false, error: "Feedback delivery is not configured yet." },
      { status: 500 }
    );
  }

  const subject = `Feedback from ${profile.fullName} at ${orgName}`;
  const bodyHtml = `
    <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
      <p><strong>From:</strong> ${escapeHtml(profile.fullName)} &lt;${escapeHtml(profile.email ?? "")}&gt;</p>
      <p><strong>Org:</strong> ${escapeHtml(orgName)} (id: ${escapeHtml(profile.orgId)})</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
      <pre style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif;font-size:14px;margin:0;">${escapeHtml(message)}</pre>
    </div>
  `;
  const bodyText = `From: ${profile.fullName} <${profile.email ?? ""}>\nOrg: ${orgName} (id: ${profile.orgId})\n\n${message}`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: SUPPORT_INBOX,
    replyTo: profile.email ?? undefined,
    subject,
    html: bodyHtml,
    text: bodyText,
  });
  if (error) {
    console.error("[feedback] resend send failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not deliver feedback. Please email support directly." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
