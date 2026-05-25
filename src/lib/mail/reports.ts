import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { MailStatus } from "./fetch";

export type MailMonthRow = {
  // ISO-8601 month key like "2026-05" — what we group on
  month: string;
  // Human label "May 2026"
  label: string;
  sent_total: number;
  delivered: number;
  returned: number;
  failed: number;
  by_class: {
    first_class: number;
    standard: number;
    certified: number;
  };
  // Customer revenue (sum of mail_jobs.cost_cents — what we billed the
  // customer for each piece).
  spent_cents: number;
  // Provider cost (sum of mail_jobs.provider_cost_cents — what Lob /
  // C2M actually charged us). Populated on rows recorded after the
  // pricing split landed; older rows return 0 for this column.
  provider_cost_cents: number;
  // Derived: spent_cents - provider_cost_cents. Stored as a separate
  // field so the UI doesn't have to compute it per render.
  margin_cents: number;
};

export type MailReportData = {
  months: MailMonthRow[];
  totals: {
    sent_total: number;
    delivered: number;
    returned: number;
    failed: number;
    spent_cents: number;
    provider_cost_cents: number;
    margin_cents: number;
  };
  // Cost transparency — we want the UI to be honest about which numbers
  // are pulled from the provider and which are placeholders.
  cost_sources: {
    has_lob_pieces: boolean;
    has_click2mail_pieces: boolean;
  };
};

export type MailReportRange = "30d" | "90d" | "ytd" | "12m" | "ly" | "all";

const RANGE_LABEL: Record<MailReportRange, string> = {
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  ytd: "Year To Date",
  "12m": "Last 12 Months",
  ly: "Last Year",
  all: "All Time",
};

export function mailReportRangeLabel(r: MailReportRange): string {
  return RANGE_LABEL[r];
}

// Aggregates mail_jobs into monthly rows for the report. Server fetches
// all rows in the window (cheap — mail_jobs is small per org) and
// reduces in memory. Sample data (provider_id LIKE 'sample_%') is
// excluded so the totals don't lie when the dashboard is seeded for UI
// testing.
export async function fetchMailReport(opts: {
  range?: MailReportRange;
}): Promise<MailReportData & { range: MailReportRange }> {
  const sb = await createClient();
  const range = opts.range ?? "30d";
  const { startDate, monthCount } = rangeBounds(range);

  // Skip sample-data rows so the report reflects real provider activity.
  // Old failed rows pre-Fix-66 also have no real cost data; we keep them
  // in counts but their cost_cents is 0 or hardcoded so they don't
  // distort spend numbers materially.
  let q = sb
    .from("mail_jobs")
    .select(
      "status, mail_class, cost_cents, provider_cost_cents, created_at, provider"
    )
    .not("provider_id", "ilike", "sample_%");
  if (startDate) q = q.gte("created_at", startDate.toISOString());
  const { data } = await q;

  // Build the month buckets we want to render.
  const now = new Date();
  const monthsToRender = monthCount ?? monthsBetween(
    startDate ?? earliestCreatedAt(data ?? []),
    now
  );
  const byMonth = new Map<string, MailMonthRow>();
  for (let i = monthsToRender - 1; i >= 0; i--) {
    const d = addMonths(now, -i);
    const key = monthKey(d);
    byMonth.set(key, {
      month: key,
      label: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
      sent_total: 0,
      delivered: 0,
      returned: 0,
      failed: 0,
      by_class: { first_class: 0, standard: 0, certified: 0 },
      spent_cents: 0,
      provider_cost_cents: 0,
      margin_cents: 0,
    });
  }

  let hasLob = false;
  let hasC2M = false;

  for (const row of data ?? []) {
    const created = new Date(row.created_at as string);
    const key = monthKey(created);
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    bucket.sent_total += 1;
    const st = row.status as MailStatus;
    if (st === "delivered") bucket.delivered += 1;
    else if (st === "returned") bucket.returned += 1;
    else if (st === "failed") bucket.failed += 1;
    const mc = row.mail_class as "first_class" | "standard" | "certified";
    bucket.by_class[mc] = (bucket.by_class[mc] ?? 0) + 1;
    bucket.spent_cents += (row.cost_cents as number | null) ?? 0;
    bucket.provider_cost_cents +=
      (row.provider_cost_cents as number | null) ?? 0;
    const provider = row.provider as string;
    if (provider === "lob") hasLob = true;
    if (provider === "click2mail") hasC2M = true;
  }

  const monthsArr = Array.from(byMonth.values());
  // Compute per-month margin now that both numerator and denominator are
  // populated.
  for (const m of monthsArr) {
    m.margin_cents = m.spent_cents - m.provider_cost_cents;
  }
  const totals = monthsArr.reduce(
    (acc, m) => {
      acc.sent_total += m.sent_total;
      acc.delivered += m.delivered;
      acc.returned += m.returned;
      acc.failed += m.failed;
      acc.spent_cents += m.spent_cents;
      acc.provider_cost_cents += m.provider_cost_cents;
      acc.margin_cents += m.margin_cents;
      return acc;
    },
    {
      sent_total: 0,
      delivered: 0,
      returned: 0,
      failed: 0,
      spent_cents: 0,
      provider_cost_cents: 0,
      margin_cents: 0,
    }
  );

  return {
    range,
    months: monthsArr,
    totals,
    cost_sources: {
      has_lob_pieces: hasLob,
      has_click2mail_pieces: hasC2M,
    },
  };
}

function rangeBounds(
  range: MailReportRange
): { startDate: Date | null; monthCount: number | null } {
  const now = new Date();
  if (range === "30d") return { startDate: addDays(now, -30), monthCount: 2 };
  if (range === "90d") return { startDate: addDays(now, -90), monthCount: 4 };
  if (range === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { startDate: start, monthCount: now.getMonth() + 1 };
  }
  if (range === "12m") return { startDate: addMonths(now, -11), monthCount: 12 };
  if (range === "ly") {
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear() - 1, 11, 31);
    void end;
    return { startDate: start, monthCount: 12 };
  }
  // all
  return { startDate: null, monthCount: null };
}

function earliestCreatedAt(
  rows: Array<{ created_at: string }>
): Date {
  if (rows.length === 0) return new Date();
  let earliest = new Date();
  for (const r of rows) {
    const d = new Date(r.created_at);
    if (d < earliest) earliest = d;
  }
  return earliest;
}

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
