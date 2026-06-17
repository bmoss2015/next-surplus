import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { renderEmailShell, escapeHtml } from "@/lib/email-template";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TEN_MONTHS_MS = 10 * 30 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  if (expected && authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const now = Date.now();

  const { data: candidates, error } = await admin
    .from("orgs")
    .select(
      "id, name, email, plan_tier, stripe_subscription_id, founder_notice_sent_at, created_at"
    )
    .eq("plan_tier", "beta_founder")
    .not("stripe_subscription_id", "is", null);

  if (error) {
    console.error("[founder-lock] org lookup failed:", error);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  let noticeSent = 0;

  for (const org of candidates ?? []) {
    if (org.founder_notice_sent_at) continue;
    const startMs = org.created_at ? new Date(org.created_at).getTime() : null;
    if (!startMs) continue;
    const ageMs = now - startMs;

    if (ageMs >= TEN_MONTHS_MS) {
      try {
        await sendFounderNotice(org);
        await admin
          .from("orgs")
          .update({ founder_notice_sent_at: new Date(now).toISOString() })
          .eq("id", org.id);
        noticeSent++;
      } catch (e) {
        console.error("[founder-lock] notice failed:", org.id, e);
      }
    }
  }

  return NextResponse.json({
    scanned: candidates?.length ?? 0,
    noticeSent,
  });
}

async function sendFounderNotice(org: {
  id: string;
  name: string;
  email: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !org.email) return;

  const resend = new Resend(apiKey);
  const subject = "Heads Up: Your Founders Rate Window Is Ending";
  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;font-weight:600;color:#1a1a1a;">${escapeHtml(subject)}</h1>
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">You've been on the Founders Rate for ten months. Reach out before month twelve if you'd like to confirm renewal terms for ${escapeHtml(org.name)}.</p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">No action required, your access continues uninterrupted.</p>
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5a5a5a;">Manage billing anytime from Settings &rsaquo; Billing.</p>
  `;

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Next Surplus <noreply@nextsurplus.com>",
    to: org.email,
    subject,
    html: renderEmailShell({ subject, bodyHtml }),
  });
}
