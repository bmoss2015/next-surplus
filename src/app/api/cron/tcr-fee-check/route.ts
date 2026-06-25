// Monthly check of The Campaign Registry's published A2P 10DLC Standard
// Brand vetting fee. The portal hardcodes the fee in copy on the A2P
// wizard fee row and the brand-identity-change confirmation page. If TCR
// raises the fee, the wizard copy is out of date until someone notices.
// This cron pings TCR's public pricing page once a month and emails
// support@nextsurplus.com with whatever was found, so the team can update
// the hardcoded figure when it changes.

import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TCR_PRICING_URL = "https://www.campaignregistry.com/pricing";
const EXPECTED_FEE_CENTS = 4150; // $41.50 as of 2026-06

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let publishedFeeCents: number | null = null;
  let publishedFeeRaw: string | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(TCR_PRICING_URL, {
      headers: { "User-Agent": "Next Surplus TCR Fee Check" },
      cache: "no-store",
    });
    if (!res.ok) {
      fetchError = `TCR HTTP ${res.status}`;
    } else {
      const html = await res.text();
      const match = html.match(/Standard[^$]{0,400}\$(\d+(?:\.\d{2})?)/i);
      if (match) {
        publishedFeeRaw = `$${match[1]}`;
        publishedFeeCents = Math.round(parseFloat(match[1]) * 100);
      }
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "fetch failed";
  }

  const matches = publishedFeeCents === EXPECTED_FEE_CENTS;
  const direction =
    publishedFeeCents == null
      ? "Unknown"
      : publishedFeeCents > EXPECTED_FEE_CENTS
        ? "Increased"
        : publishedFeeCents < EXPECTED_FEE_CENTS
          ? "Decreased"
          : "Unchanged";

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  if (resend) {
    await resend.emails.send({
      from: "Next Surplus <support@nextsurplus.com>",
      to: "support@nextsurplus.com",
      subject: matches
        ? `TCR Standard Vetting Fee Unchanged ($${(EXPECTED_FEE_CENTS / 100).toFixed(2)})`
        : `TCR Standard Vetting Fee Changed To ${publishedFeeRaw ?? "Unknown"}`,
      html: tcrFeeEmailHtml({
        matches,
        direction,
        expectedDollars: (EXPECTED_FEE_CENTS / 100).toFixed(2),
        publishedRaw: publishedFeeRaw,
        fetchError,
      }),
    });
  }

  return NextResponse.json({
    ok: true,
    matches,
    direction,
    expected_cents: EXPECTED_FEE_CENTS,
    published_cents: publishedFeeCents,
    published_raw: publishedFeeRaw,
    fetch_error: fetchError,
  });
}

function tcrFeeEmailHtml(args: {
  matches: boolean;
  direction: string;
  expectedDollars: string;
  publishedRaw: string | null;
  fetchError: string | null;
}): string {
  const statusLine = args.fetchError
    ? `<div style="color:#b42318;font-weight:600;">Could not fetch TCR pricing page: ${args.fetchError}</div>`
    : args.matches
      ? `<div style="color:#0d4b3a;font-weight:600;">Fee unchanged at $${args.expectedDollars}.</div>`
      : `<div style="color:#b42318;font-weight:600;">Fee changed. Published: ${args.publishedRaw ?? "Unknown"}. Wizard still hardcodes $${args.expectedDollars}.</div>`;

  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;color:#0a0d14;line-height:1.5;max-width:560px;margin:24px auto;padding:0 16px;">
  <h2 style="font-size:18px;margin:0 0 8px;">Monthly TCR Vetting Fee Check</h2>
  <p style="font-size:14px;color:#5b606a;margin:0 0 16px;">Automated monthly check of The Campaign Registry's Standard Brand vetting fee. The figure is hardcoded in the A2P wizard and the rebrand confirmation page; this email surfaces any drift between the wizard copy and TCR's published rate.</p>
  ${statusLine}
  <div style="background:#fafbfc;border:1px solid #ebedf0;border-radius:7px;padding:16px;margin:16px 0;">
    <div style="font-size:13px;color:#5b606a;">Hardcoded in wizard</div>
    <div style="font-size:16px;font-weight:600;margin-bottom:12px;">$${args.expectedDollars}</div>
    <div style="font-size:13px;color:#5b606a;">Published by TCR today</div>
    <div style="font-size:16px;font-weight:600;margin-bottom:12px;">${args.publishedRaw ?? "Unknown"}</div>
    <div style="font-size:13px;color:#5b606a;">Direction</div>
    <div style="font-size:16px;font-weight:600;">${args.direction}</div>
  </div>
  <p style="font-size:14px;">If the fee changed, update the EXPECTED_FEE_CENTS constant in <code>src/app/api/cron/tcr-fee-check/route.ts</code> and the hardcoded $ figures in <code>src/app/share/a2p-wizard-final/page.tsx</code>.</p>
</body></html>`;
}
