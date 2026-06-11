import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { lobGetPiece } from "@/lib/mail/lob";

export const dynamic = "force-dynamic";

// Daily reconciliation cron. Lob's webhook delivery is reliable but not
// guaranteed — if a webhook is dropped or never fires, a mail_jobs row
// can sit in "queued" forever even though the piece has been delivered
// or returned. This cron picks up rows that have been queued for >= 24
// hours, queries Lob's GET /letters/{id} (or /checks/{id}) for the
// actual status, and updates our row to match.
//
// Self-heal philosophy: if Lob says delivered, we say delivered. If Lob
// says returned, we say returned. If Lob still says queued after 7
// days, the piece is genuinely stuck and we flip it to failed so the
// customer sees it on the Returned section and can Fix & Resend.
//
// Auth: same CRON_SECRET pattern as the pricing sync cron.

const STUCK_QUEUE_HOURS = 24;
const HARD_FAIL_DAYS = 7;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  if (expected && authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const stuckSince = new Date(
    Date.now() - STUCK_QUEUE_HOURS * 60 * 60 * 1000
  ).toISOString();
  const hardFailSince = new Date(
    Date.now() - HARD_FAIL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: candidates, error } = await admin
    .from("mail_jobs")
    .select("id, provider, provider_id, include_check, sent_at, status")
    .in("status", ["processing", "queued"])
    .eq("provider", "lob")
    .lte("sent_at", stuckSince)
    .not("provider_id", "is", null)
    .limit(200);
  if (error) {
    return NextResponse.json(
      { ok: false, stage: "query", error: error.message },
      { status: 500 }
    );
  }

  type Outcome = {
    job_id: string;
    new_status: string;
    reason: string;
  };
  const outcomes: Outcome[] = [];

  for (const row of candidates ?? []) {
    const providerId = row.provider_id as string;
    const isCheck = Boolean(row.include_check);
    const sentAt = row.sent_at as string | null;

    const res = await lobGetPiece({
      kind: isCheck ? "check" : "letter",
      provider_id: providerId,
    });

    if (!res.ok) {
      // Lob returned an error for this specific piece (deleted, bad
      // id, etc.). Skip and let the next run try again.
      outcomes.push({
        job_id: row.id as string,
        new_status: "queued",
        reason: `Lob lookup failed: ${res.error}`,
      });
      continue;
    }

    // If Lob still says queued after the hard-fail window, flip to
    // failed so the operator sees it in the Returned section. They can
    // Fix & Resend from there.
    if (
      res.status === "queued" &&
      sentAt &&
      sentAt <= hardFailSince
    ) {
      await admin
        .from("mail_jobs")
        .update({
          status: "failed",
          error_message: "Stuck in queue for over 7 days; check Lob dashboard.",
        })
        .eq("id", row.id as string);
      outcomes.push({
        job_id: row.id as string,
        new_status: "failed",
        reason: "stuck > 7 days",
      });
      continue;
    }

    if (res.status === row.status) {
      outcomes.push({
        job_id: row.id as string,
        new_status: res.status,
        reason: "no change",
      });
      continue;
    }

    // Lob has fresher state. Update us to match.
    const updates: Record<string, unknown> = { status: res.status };
    if (res.tracking_number) updates.tracking_number = res.tracking_number;
    if (res.tracking_url) updates.tracking_url = res.tracking_url;
    if (res.status === "delivered") {
      updates.delivered_at = new Date().toISOString();
    } else if (res.status === "returned") {
      updates.returned_at = new Date().toISOString();
    }
    await admin
      .from("mail_jobs")
      .update(updates)
      .eq("id", row.id as string);
    outcomes.push({
      job_id: row.id as string,
      new_status: res.status,
      reason: "synced from Lob",
    });
  }

  // Plan-cap warning. Lob Developer tier caps at 500 mailings/month.
  // We watch the global month-to-date count (across all customer orgs,
  // since they all share Bree's one Lob account) and email the owner
  // when usage crosses 75% / 90% / hits the cap. Sample-data rows are
  // excluded.
  try {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count: monthSends } = await admin
      .from("mail_jobs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .eq("provider", "lob")
      .not("provider_id", "ilike", "sample_%");

    const sends = monthSends ?? 0;
    const LOB_CAP = 500;
    const tier =
      sends >= LOB_CAP
        ? "cap_hit"
        : sends >= Math.round(LOB_CAP * 0.9)
          ? "ninety"
          : sends >= Math.round(LOB_CAP * 0.75)
            ? "seventyfive"
            : null;

    if (tier) {
      const { data: owners } = await admin
        .from("profiles")
        .select("id, org_id, email")
        .eq("role", "owner");
      const subjectByTier: Record<string, string> = {
        cap_hit: `Lob mailing cap hit (${sends} of ${LOB_CAP} this month)`,
        ninety: `Lob mailing cap 90% used (${sends} of ${LOB_CAP} this month)`,
        seventyfive: `Lob mailing cap 75% used (${sends} of ${LOB_CAP} this month)`,
      };
      const bodyByTier: Record<string, string> = {
        cap_hit: `You've hit Lob's Developer-tier monthly limit of ${LOB_CAP} mailings. New sends will fail until next month or until you upgrade to the Startup plan ($260/mo, 3000 mailings).`,
        ninety: `You've used ${sends} of your ${LOB_CAP} Lob mailings this month. Sends will start failing at ${LOB_CAP}. Plan for an upgrade if you expect more volume.`,
        seventyfive: `You've used ${sends} of your ${LOB_CAP} Lob mailings this month. Heads up — the cap is approaching.`,
      };

      const apiKey = process.env.RESEND_API_KEY;
      const from =
        process.env.RESEND_FROM ?? "notifications@mossequitypartners.com";
      if (apiKey && owners && owners.length > 0) {
        for (const o of owners) {
          const email = (o.email as string | null) ?? null;
          if (!email) continue;
          // Best-effort send; failures just log so the cron's other
          // work continues.
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from,
                to: email,
                subject: subjectByTier[tier],
                text: bodyByTier[tier],
              }),
            });
          } catch {
            // ignore — see comment above
          }
          // Also write a bell notification so it shows up in-app.
          await admin.from("notifications").insert({
            org_id: o.org_id as string,
            recipient_id: o.id as string,
            actor_id: null,
            type: "lob_cap_warning",
            body_preview: subjectByTier[tier],
          });
        }
      }
    }
  } catch {
    // Plan-cap check is a defensive add — never block the reconcile
    // cron's main job. If RESEND_API_KEY isn't set or owners can't be
    // read, just skip silently.
  }

  return NextResponse.json({
    ok: true,
    candidates_checked: candidates?.length ?? 0,
    outcomes,
  });
}
