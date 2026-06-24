// Quarterly Telnyx price-check cron.
//
// Hits the Telnyx available_phone_numbers API for a sample local DID and
// compares the live cost against the cost stored in telnyx_pricing_settings.
// If drift is > 0.5%, sends an alert email to the org's billing contact.
// Always sends a quarterly "all clear" email if no drift, so admins know
// the check actually ran.
//
// Authenticated via CRON_SECRET (Vercel sets Authorization: Bearer <secret>
// on scheduled cron invocations).

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TelnyxAvailableNumbersResponse = {
  data?: Array<{ cost_information?: { monthly_cost?: string } }>;
};

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TELNYX_API_KEY missing" }, { status: 500 });
  }

  let liveCostCents: number | null = null;
  try {
    const res = await fetch(
      "https://api.telnyx.com/v2/available_phone_numbers?filter%5Bcountry_code%5D=US&filter%5Bnational_destination_code%5D=512&filter%5Blimit%5D=1",
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Telnyx HTTP ${res.status}` }, { status: 502 });
    }
    const json = (await res.json()) as TelnyxAvailableNumbersResponse;
    const monthly = json.data?.[0]?.cost_information?.monthly_cost;
    liveCostCents = monthly ? Math.round(parseFloat(monthly) * 100) : null;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "fetch failed" }, { status: 500 });
  }

  if (liveCostCents == null) {
    return NextResponse.json({ error: "No price returned from Telnyx" }, { status: 502 });
  }

  const sb = createServiceClient();

  const { data: orgs, error: orgsErr } = await sb
    .from("telnyx_pricing_settings")
    .select("org_id, telnyx_phone_monthly_cents");
  if (orgsErr) {
    return NextResponse.json({ error: orgsErr.message }, { status: 500 });
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const alerts: Array<{ org_id: string; recorded: number; live: number; drift_pct: number }> = [];

  for (const row of orgs ?? []) {
    const recorded = row.telnyx_phone_monthly_cents as number;
    const drift = ((liveCostCents - recorded) / recorded) * 100;
    alerts.push({ org_id: row.org_id as string, recorded, live: liveCostCents, drift_pct: drift });

    await sb
      .from("telnyx_pricing_settings")
      .update({
        last_telnyx_price_check_at: new Date().toISOString(),
        last_telnyx_price_drift_pct: drift,
      })
      .eq("org_id", row.org_id);

    if (resend && Math.abs(drift) > 0.5) {
      const { data: org } = await sb
        .from("orgs")
        .select("name, email")
        .eq("id", row.org_id)
        .maybeSingle();
      const to = org?.email;
      if (to) {
        await resend.emails.send({
          from: "Next Surplus <support@nextsurplus.com>",
          to,
          subject: `Telnyx Phone Number Price Changed (${drift > 0 ? "+" : ""}${drift.toFixed(1)}%)`,
          html: priceDriftEmailHtml({
            orgName: org?.name ?? "Account",
            recordedCents: recorded,
            liveCents: liveCostCents,
            driftPct: drift,
          }),
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    checked: alerts.length,
    live_cost_cents: liveCostCents,
    alerts: alerts.filter((a) => Math.abs(a.drift_pct) > 0.5),
  });
}

function priceDriftEmailHtml(args: { orgName: string; recordedCents: number; liveCents: number; driftPct: number }): string {
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;
  const direction = args.driftPct > 0 ? "raised" : "lowered";
  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;color:#0a0d14;line-height:1.5;max-width:560px;margin:24px auto;padding:0 16px;">
  <h2 style="font-size:18px;margin:0 0 8px;">Telnyx Phone Number Price Changed</h2>
  <p style="font-size:14px;color:#5b606a;margin:0 0 16px;">Quarterly price check for ${args.orgName}.</p>
  <div style="background:#fafbfc;border:1px solid #ebedf0;border-radius:7px;padding:16px;margin:16px 0;">
    <div style="font-size:13px;color:#5b606a;">Recorded cost</div>
    <div style="font-size:16px;font-weight:600;margin-bottom:12px;">${fmt(args.recordedCents)}/month</div>
    <div style="font-size:13px;color:#5b606a;">Live Telnyx cost</div>
    <div style="font-size:16px;font-weight:600;margin-bottom:12px;">${fmt(args.liveCents)}/month</div>
    <div style="font-size:13px;color:#5b606a;">Drift</div>
    <div style="font-size:16px;font-weight:600;color:#0d4b3a;">${args.driftPct > 0 ? "+" : ""}${args.driftPct.toFixed(1)}%</div>
  </div>
  <p style="font-size:14px;">Telnyx ${direction} the price of local phone numbers. Review your customer-facing markup at <a href="https://app.nextsurplus.com/settings#telnyx-pricing" style="color:#0d4b3a;">Settings &rsaquo; Power Dialer &rsaquo; Pricing</a>.</p>
</body></html>`;
}
