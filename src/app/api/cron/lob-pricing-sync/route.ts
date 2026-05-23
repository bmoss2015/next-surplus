import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  fetchPublishedLobPricing,
  hasPricingDrifted,
} from "@/lib/mail/fetch-lob-pricing";
import type { LobPricing } from "@/lib/mail/types";

export const dynamic = "force-dynamic";

// Weekly cron (Mondays 04:00 UTC per vercel.json) that fetches Lob's
// published Developer-tier rates, snapshots them onto every org's
// lob_published_pricing_cents column, and:
//
//   - If org.lob_pricing_auto_sync === true → updates the org's
//     lob_pricing_cents to match published. The org has opted into
//     "always pay list price; track Lob automatically".
//
//   - If org.lob_pricing_auto_sync === false (default) and the
//     published rates drifted from the org's configured rates →
//     inserts a notification for every admin in the org so they can
//     review and update lob_pricing_cents themselves via Settings.
//
// Auth: Vercel signs cron requests with CRON_SECRET. We check the
// Authorization header against process.env.CRON_SECRET before running.
//
// Bree's "manual updates are 100% not acceptable" requirement is
// satisfied here: the rates flow into the system without anyone
// editing JSON. Orgs with custom enterprise contracts can leave
// auto_sync off and get alerted on drift instead.

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  if (expected && authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fetchRes = await fetchPublishedLobPricing();
  if (!fetchRes.ok) {
    return NextResponse.json(
      { ok: false, stage: "fetch", error: fetchRes.error },
      { status: 502 }
    );
  }
  const { pricing: published, fetched_at } = fetchRes;

  const admin = createServiceClient();

  // Mirror the published rates onto the SaaS-wide singleton so
  // src/lib/mail/actions.ts has a single source of truth for wholesale
  // at send time. The per-org snapshots below are still updated so the
  // existing Provider Costs panel keeps working.
  await admin
    .from("app_pricing_config")
    .update({
      wholesale_pricing_cents: published,
      wholesale_last_checked_at: fetched_at,
    })
    .eq("id", 1);

  const { data: orgs, error: orgErr } = await admin
    .from("orgs")
    .select("id, lob_pricing_cents, lob_published_pricing_cents, lob_pricing_auto_sync");
  if (orgErr) {
    return NextResponse.json(
      { ok: false, stage: "orgs", error: orgErr.message },
      { status: 500 }
    );
  }

  type Outcome = {
    org_id: string;
    auto_synced: boolean;
    drift_alert: boolean;
  };
  const outcomes: Outcome[] = [];

  for (const org of orgs ?? []) {
    const orgId = org.id as string;
    const current = (org.lob_pricing_cents as LobPricing | null) ?? null;
    const lastPublished = (org.lob_published_pricing_cents as LobPricing | null) ?? null;
    const autoSync = Boolean(org.lob_pricing_auto_sync);

    // Always snapshot the latest published rates onto the org so the
    // Settings UI can show "Lob published rate" alongside "your rate".
    const updates: Record<string, unknown> = {
      lob_published_pricing_cents: published,
      lob_pricing_last_checked_at: fetched_at,
    };

    let autoSynced = false;
    let driftAlert = false;
    if (current && hasPricingDrifted(current, published)) {
      if (autoSync) {
        updates.lob_pricing_cents = published;
        autoSynced = true;
      } else {
        driftAlert = true;
      }
    }
    // If the published rates themselves changed since last fetch and
    // this org isn't auto-syncing, also flag drift (so admin gets
    // notified even when their configured rate happens to still match
    // the new published rate — they probably want to see what changed).
    if (
      !autoSynced &&
      !driftAlert &&
      lastPublished &&
      hasPricingDrifted(lastPublished, published)
    ) {
      driftAlert = true;
    }

    await admin.from("orgs").update(updates).eq("id", orgId);

    if (driftAlert) {
      // Notify every admin in the org. Body links them to Settings to
      // review the drift and either accept (update lob_pricing_cents)
      // or dismiss (mark "I'm on a custom contract, ignore").
      const { data: admins } = await admin
        .from("profiles")
        .select("id")
        .eq("org_id", orgId)
        .eq("role", "admin");
      const rows = (admins ?? []).map((a) => ({
        org_id: orgId,
        recipient_id: a.id as string,
        actor_id: null,
        type: "lob_pricing_drift",
        body_preview:
          "Lob published pricing changed. Review your mail cost rates in Settings.",
      }));
      if (rows.length > 0) {
        await admin.from("notifications").insert(rows);
      }
    }

    outcomes.push({ org_id: orgId, auto_synced: autoSynced, drift_alert: driftAlert });
  }

  return NextResponse.json({
    ok: true,
    fetched_at,
    published,
    org_count: outcomes.length,
    auto_synced_count: outcomes.filter((o) => o.auto_synced).length,
    drift_alert_count: outcomes.filter((o) => o.drift_alert).length,
    outcomes,
  });
}
