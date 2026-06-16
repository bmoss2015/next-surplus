import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, priceIdFor } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Daily cron at 12:00 UTC (08:00 ET) that handles two phase transitions
// for orgs locked into the founder rate:
//
//   1. Heads-up notice at the 10-month mark. We email the admin so they
//      have two months to decide before the price changes. Idempotent
//      via founder_notice_sent_at.
//   2. Promotion to standard at the 12-month mark. We swap the Stripe
//      subscription onto the standard monthly price (proration off, so
//      the change applies at the next renewal) and flip plan_tier to
//      'standard' in our DB.
//
// "founder" tier (legacy/comp/lifetime) is excluded by the WHERE clause
// on plan_tier = 'beta_founder' — those orgs never auto-promote.

const TEN_MONTHS_MS = 10 * 30 * 24 * 60 * 60 * 1000;
const TWELVE_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  if (expected && authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const stripe = getStripe();
  const now = Date.now();

  const { data: candidates, error } = await admin
    .from("orgs")
    .select(
      "id, name, email, plan_tier, stripe_customer_id, stripe_subscription_id, founder_notice_sent_at"
    )
    .eq("plan_tier", "beta_founder")
    .not("stripe_subscription_id", "is", null);

  if (error) {
    console.error("[founder-lock] org lookup failed:", error);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  let noticeSent = 0;
  let promoted = 0;

  for (const org of candidates ?? []) {
    if (!org.stripe_subscription_id) continue;
    let sub;
    try {
      sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
    } catch (e) {
      console.error("[founder-lock] stripe retrieve failed:", org.id, e);
      continue;
    }

    const startMs = sub.start_date * 1000;
    const ageMs = now - startMs;

    if (ageMs >= TWELVE_MONTHS_MS) {
      try {
        const itemId = sub.items.data[0]?.id;
        if (!itemId) continue;
        await stripe.subscriptions.update(sub.id, {
          items: [{ id: itemId, price: priceIdFor("standard", "monthly") }],
          proration_behavior: "none",
          metadata: { ...sub.metadata, founder_promoted_at: String(now) },
        });
        await admin
          .from("orgs")
          .update({ plan_tier: "standard" })
          .eq("id", org.id);
        promoted++;
      } catch (e) {
        console.error("[founder-lock] promote failed:", org.id, e);
      }
      continue;
    }

    if (ageMs >= TEN_MONTHS_MS && !org.founder_notice_sent_at) {
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
    promoted,
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
  const subject = "Heads Up: Your Founders Rate Ends In Two Months";
  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#0f1729;max-width:520px;margin:0 auto;padding:24px;">
  <h1 style="margin:0;font-size:22px;font-weight:600;color:#0d4b3a;">${subject}</h1>
  <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">You've been on the Founders Rate for ten months. At month twelve, ${org.name} moves to the standard monthly subscription at the next renewal.</p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">No action required. Your access continues uninterrupted; only the renewal price changes.</p>
  <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Manage billing anytime from Settings &rsaquo; Billing.</p>
</div>`;

  await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Next Surplus <noreply@nextsurplus.com>",
    to: org.email,
    subject,
    html,
  });
}
