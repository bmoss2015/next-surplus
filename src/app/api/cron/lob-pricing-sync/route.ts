import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import {
  fetchPublishedLobPricing,
  hasPricingDrifted,
  pricingDiff,
  type LobPricingSection,
} from "@/lib/mail/fetch-lob-pricing";
import type { LobPricing } from "@/lib/mail/types";

export const dynamic = "force-dynamic";

// Weekly cron (Mondays 04:00 UTC per vercel.json) that fetches Lob's
// published Developer-tier rates from their stable pricing-details
// article and:
//
//   1. Refreshes app_pricing_config.wholesale_pricing_cents to match
//      the current effective rates. Mail send cost calc reads from
//      this row, so margin stays accurate without anyone editing JSON.
//
//   2. If Lob has announced future-effective rates on the same page,
//      emails ops with the diff and effective date so we know what's
//      coming before it hits our wholesale column.
//
//   3. On any failure (page fetch error, parse error, format change),
//      emails ops one alert. Failure does NOT write into the customer-
//      facing notifications bell. Ops health is internal.
//
// Auth: Vercel signs cron requests with CRON_SECRET. We check the
// Authorization header against process.env.CRON_SECRET before running.

const OPS_ALERT_TO =
  process.env.OPS_ALERT_EMAIL ?? "bree@mossequitypartners.com";
const OPS_ALERT_FROM =
  process.env.RESEND_FROM ?? "Next Surplus <noreply@nextsurplus.com>";

async function sendOpsAlert(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: OPS_ALERT_FROM,
      to: OPS_ALERT_TO,
      subject,
      html,
    });
  } catch {
    // Email-of-last-resort failed; nothing further to do, Vercel cron
    // log + non-200 response are the next signals.
  }
}

function dollars(cents: number | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(3)}`;
}

// Preserves the operator's current markup percentage against the new Lob
// cost. If they charge $2.50 when Lob charges $1.03 (markup 142.7%), and
// Lob's new cost is $1.06, the suggested new customer price is $2.57.
// Rounded to the nearest cent.
function suggestedCustomerCents(
  currentCustomerCents: number | undefined,
  oldLobCents: number | undefined,
  newLobCents: number | undefined
): number | undefined {
  if (
    currentCustomerCents == null ||
    oldLobCents == null ||
    newLobCents == null ||
    oldLobCents <= 0
  ) {
    return undefined;
  }
  const ratio = currentCustomerCents / oldLobCents;
  return Math.round(newLobCents * ratio);
}

const LABELED_KEYS: Array<{ key: keyof LobPricing; label: string }> = [
  { key: "letter_first_class_bw", label: "First Class B&W Letter" },
  { key: "letter_first_class_color", label: "First Class Color Letter" },
  { key: "letter_standard_bw", label: "Standard B&W Letter" },
  { key: "letter_standard_color", label: "Standard Color Letter" },
  { key: "letter_extra_page_bw", label: "Additional B&W Page" },
  { key: "letter_extra_page_color", label: "Additional Color Page" },
  { key: "letter_over_6_sheet_fee", label: "Letter Over 6 Sheet Fee" },
  { key: "letter_certified_bw", label: "Certified B&W Letter" },
  { key: "letter_certified_color", label: "Certified Color Letter" },
  { key: "check_base", label: "Check Base" },
  { key: "check_extra_attachment_page", label: "Check Attachment Page" },
];

function renderUpcomingWithSuggestionsHtml(
  effectiveDate: string,
  currentLob: LobPricing,
  upcomingLob: LobPricing,
  currentCustomer: LobPricing | null
): string {
  const rows = LABELED_KEYS
    .filter(({ key }) => {
      const a = currentLob[key] as number | undefined;
      const b = upcomingLob[key] as number | undefined;
      return a != null || b != null;
    })
    .map(({ key, label }) => {
      const oldLob = currentLob[key] as number | undefined;
      const newLob = upcomingLob[key] as number | undefined;
      const customer = (currentCustomer?.[key] as number | undefined) ?? undefined;
      const suggested = suggestedCustomerCents(customer, oldLob, newLob);
      const delta = customer != null && suggested != null ? suggested - customer : null;
      return `<tr>
        <td style="padding:6px 14px 6px 0;color:#0f1729;">${label}</td>
        <td style="padding:6px 14px;font-family:monospace;color:#666;">${dollars(oldLob)}</td>
        <td style="padding:6px 14px;font-family:monospace;color:#0d4b3a;font-weight:600;">${dollars(newLob)}</td>
        <td style="padding:6px 14px;font-family:monospace;color:#666;">${dollars(customer)}</td>
        <td style="padding:6px 14px;font-family:monospace;color:#0d4b3a;font-weight:600;">${dollars(suggested)}</td>
        <td style="padding:6px 0;font-family:monospace;color:${delta != null && delta > 0 ? "#b42318" : "#666"};">${delta != null ? (delta > 0 ? "+" : "") + dollars(Math.abs(delta)) : "—"}</td>
      </tr>`;
    })
    .join("");

  return `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#0f1729;">
    <p style="margin:0 0 12px 0;">Lob announced a Developer-tier rate change effective <strong>${effectiveDate}</strong>. The Suggested New Customer Rate column preserves your current markup percentage against the new Lob cost.</p>
    <table style="border-collapse:collapse;margin:8px 0;font-size:13px;">
      <thead><tr>
        <th style="text-align:left;padding:6px 14px 6px 0;font-size:11px;color:#666;font-weight:600;">Item</th>
        <th style="text-align:left;padding:6px 14px;font-size:11px;color:#666;font-weight:600;">Lob Now</th>
        <th style="text-align:left;padding:6px 14px;font-size:11px;color:#666;font-weight:600;">Lob ${effectiveDate}</th>
        <th style="text-align:left;padding:6px 14px;font-size:11px;color:#666;font-weight:600;">Your Current Rate</th>
        <th style="text-align:left;padding:6px 14px;font-size:11px;color:#666;font-weight:600;">Suggested New Rate</th>
        <th style="text-align:left;padding:6px 0;font-size:11px;color:#666;font-weight:600;">Change</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:16px 0 0 0;color:#666;font-size:12px;">Adjust the per-item customer rate at Owner &rsaquo; Letters &rsaquo; Customer Pricing.</p>
  </div>`;
}

function stableUpcomingKey(upcoming: { effective_date: string | null; pricing: LobPricing }): string {
  const p = upcoming.pricing;
  const keys = LABELED_KEYS.map(({ key }) => `${String(key)}:${p[key] ?? ""}`).join("|");
  return `${upcoming.effective_date ?? "no-date"}::${keys}`;
}

function renderDiffHtml(
  before: LobPricing,
  after: LobPricing,
  preheader: string
): string {
  const diff = pricingDiff(before, after);
  const rows = diff
    .map(
      (d) =>
        `<tr><td style="padding:4px 12px 4px 0;font-family:monospace;">${d.key}</td>` +
        `<td style="padding:4px 12px;font-family:monospace;color:#666;">${dollars(d.before)}</td>` +
        `<td style="padding:4px 0;font-family:monospace;color:#0a3d4a;font-weight:600;">${dollars(d.after)}</td></tr>`
    )
    .join("");
  return `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#0f1729;">
    <p style="margin:0 0 12px 0;color:#666;">${preheader}</p>
    <table style="border-collapse:collapse;margin:8px 0;">
      <thead><tr>
        <th style="text-align:left;padding:4px 12px 4px 0;font-size:12px;color:#666;">Rate Key</th>
        <th style="text-align:left;padding:4px 12px;font-size:12px;color:#666;">Before</th>
        <th style="text-align:left;padding:4px 0;font-size:12px;color:#666;">After</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sectionPreview(section: LobPricingSection, headerLabel: string): string {
  const p = section.pricing;
  const rows: Array<[string, number | undefined]> = [
    ["First Class B&W Letter", p.letter_first_class_bw],
    ["First Class Color Letter", p.letter_first_class_color],
    ["Standard B&W Letter", p.letter_standard_bw],
    ["Standard Color Letter", p.letter_standard_color],
    ["Additional B&W Page", p.letter_extra_page_bw],
    ["Additional Color Page", p.letter_extra_page_color],
    ["Letter Over 6 Sheet Fee", p.letter_over_6_sheet_fee],
    ["Certified Letter", p.letter_certified_bw],
    ["Check Base", p.check_base],
    ["Check Attachment Page", p.check_extra_attachment_page],
  ];
  const body = rows
    .map(
      ([label, cents]) =>
        `<tr><td style="padding:4px 16px 4px 0;">${label}</td>` +
        `<td style="padding:4px 0;font-family:monospace;">${dollars(cents)}</td></tr>`
    )
    .join("");
  return `<h3 style="margin:16px 0 8px 0;font-size:14px;">${headerLabel}</h3>
    <table style="border-collapse:collapse;font-size:13px;">${body}</table>`;
}

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
    await sendOpsAlert(
      "Next Surplus ops: published rate sync failed",
      `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#0f1729;">
        <p>The weekly published-rate sync could not parse the source page. Wholesale rates were not updated and may be stale until the parser is fixed.</p>
        <p style="margin:12px 0 0 0;font-family:monospace;font-size:12px;color:#a30015;">${fetchRes.error}</p>
        <p style="margin:16px 0 0 0;color:#666;font-size:12px;">Source: https://help.lob.com/print-and-mail/ready-to-get-started/pricing-details.md</p>
      </div>`
    );
    return NextResponse.json(
      { ok: false, stage: "fetch", error: fetchRes.error },
      { status: 502 }
    );
  }
  const { current, upcoming, fetched_at } = fetchRes;
  const published = current.pricing;

  const admin = createServiceClient();

  const { data: cfg } = await admin
    .from("app_pricing_config")
    .select("wholesale_pricing_cents, lob_last_announced_upcoming")
    .eq("id", 1)
    .maybeSingle();
  const previousWholesale = (cfg?.wholesale_pricing_cents as LobPricing | null) ?? null;
  const lastAnnouncedKey =
    (cfg?.lob_last_announced_upcoming as { key?: string } | null)?.key ?? null;

  await admin
    .from("app_pricing_config")
    .update({
      wholesale_pricing_cents: published,
      wholesale_last_checked_at: fetched_at,
    })
    .eq("id", 1);

  if (previousWholesale && hasPricingDrifted(previousWholesale, published)) {
    await sendOpsAlert(
      "Next Surplus ops: published wholesale rates changed",
      `<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#0f1729;">
        <p>Lob's currently-effective Developer rates differ from the stored wholesale config. The wholesale column has been auto-updated.</p>
        ${renderDiffHtml(
          previousWholesale,
          published,
          "Diff (cents):"
        )}
      </div>`
    );
  }

  const { data: orgs } = await admin
    .from("orgs")
    .select("id, lob_pricing_cents, lob_pricing_auto_sync");
  for (const org of orgs ?? []) {
    const updates: Record<string, unknown> = {
      lob_published_pricing_cents: published,
      lob_pricing_last_checked_at: fetched_at,
    };
    const orgCurrent = (org.lob_pricing_cents as LobPricing | null) ?? null;
    if (
      org.lob_pricing_auto_sync &&
      orgCurrent &&
      hasPricingDrifted(orgCurrent, published)
    ) {
      updates.lob_pricing_cents = published;
    }
    await admin.from("orgs").update(updates).eq("id", org.id as string);
  }

  // Pull current customer-facing rates from the first org so the email can
  // suggest new customer rates that preserve markup. Single-tenant for now
  // (Moss Equity); multi-org would loop per org.
  const { data: ownerOrg } = await admin
    .from("orgs")
    .select("lob_pricing_cents")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const currentCustomer = (ownerOrg?.lob_pricing_cents as LobPricing | null) ?? null;

  for (const future of upcoming) {
    if (future.missing.length > 0) continue;
    const announcementKey = stableUpcomingKey(future);
    if (announcementKey === lastAnnouncedKey) {
      // Same upcoming announcement already emailed in a prior run. Skip
      // so the cron doesn't spam every Monday until the effective date.
      continue;
    }
    await sendOpsAlert(
      `Next Surplus ops: Lob rate change effective ${future.effective_date}`,
      renderUpcomingWithSuggestionsHtml(
        future.effective_date ?? "TBD",
        published,
        future.pricing,
        currentCustomer
      )
    );
    await admin
      .from("app_pricing_config")
      .update({
        lob_last_announced_upcoming: { key: announcementKey, sent_at: new Date().toISOString() },
      })
      .eq("id", 1);
  }

  return NextResponse.json({
    ok: true,
    fetched_at,
    current,
    upcoming,
  });
}
