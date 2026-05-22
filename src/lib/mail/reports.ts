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
  spent_cents: number;
};

export type MailReportData = {
  months: MailMonthRow[];
  totals: {
    sent_total: number;
    delivered: number;
    returned: number;
    failed: number;
    spent_cents: number;
  };
};

// Aggregates mail_jobs into monthly rows for the report. Server fetches
// all rows in the window (cheap — mail_jobs is small per org) and
// reduces in memory; the alternative would be a SQL view but the
// volume doesn't justify it yet.
export async function fetchMailReport(opts: {
  months?: number;
}): Promise<MailReportData> {
  const sb = await createClient();
  const months = opts.months ?? 12;
  const cutoff = startOfMonth(addMonths(new Date(), -(months - 1)));

  const { data } = await sb
    .from("mail_jobs")
    .select("status, mail_class, cost_cents, created_at")
    .gte("created_at", cutoff.toISOString());

  const byMonth = new Map<string, MailMonthRow>();
  // Seed with empty months so the chart has a continuous x-axis even
  // when nothing was sent in some months.
  for (let i = months - 1; i >= 0; i--) {
    const d = addMonths(new Date(), -i);
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
    });
  }

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
  }

  const monthsArr = Array.from(byMonth.values());
  const totals = monthsArr.reduce(
    (acc, m) => {
      acc.sent_total += m.sent_total;
      acc.delivered += m.delivered;
      acc.returned += m.returned;
      acc.failed += m.failed;
      acc.spent_cents += m.spent_cents;
      return acc;
    },
    { sent_total: 0, delivered: 0, returned: 0, failed: 0, spent_cents: 0 }
  );

  return { months: monthsArr, totals };
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
