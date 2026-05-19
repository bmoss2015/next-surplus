import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MailJobListRow = {
  id: string;
  batch_id: string;
  lead_id: string | null;
  recipient_name: string;
  recipient_address_line1: string;
  recipient_city: string;
  recipient_state: string;
  recipient_postal_code: string;
  mail_class: "standard" | "first_class" | "certified";
  provider: "click2mail" | "lob" | "stub";
  tracking_url: string | null;
  status: "queued" | "in_transit" | "delivered" | "returned" | "failed";
  include_check: boolean;
  check_amount_cents: number | null;
  cost_cents: number | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  created_at: string;
};

export type MailStats = {
  sent: number;
  in_transit: number;
  delivered: number;
  returned: number;
  failed: number;
  spent_cents: number;
};

export type MailDashboardData = {
  stats: MailStats;
  rows: MailJobListRow[];
};

export async function fetchMailDashboard(opts: {
  limit?: number;
  windowDays?: number;
}): Promise<MailDashboardData> {
  const sb = await createClient();
  const limit = opts.limit ?? 100;
  const windowDays = opts.windowDays ?? 30;
  const since = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // Stats (last N days)
  const [statSentRes, statInTransitRes, statDeliveredRes, statReturnedRes, statFailedRes, costRes] =
    await Promise.all([
      sb
        .from("mail_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since),
      sb
        .from("mail_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("status", "in_transit"),
      sb
        .from("mail_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("status", "delivered"),
      sb
        .from("mail_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("status", "returned"),
      sb
        .from("mail_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since)
        .eq("status", "failed"),
      sb
        .from("mail_jobs")
        .select("cost_cents")
        .gte("created_at", since),
    ]);

  const spent = (costRes.data ?? []).reduce(
    (sum, r) => sum + ((r.cost_cents as number | null) ?? 0),
    0
  );

  // Recent rows, returned items first then by newest.
  const { data, error } = await sb
    .from("mail_jobs")
    .select(
      "id, batch_id, lead_id, recipient_name, recipient_address_line1, recipient_city, recipient_state, recipient_postal_code, mail_class, provider, tracking_url, status, include_check, check_amount_cents, cost_cents, error_message, sent_at, delivered_at, returned_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows: MailJobListRow[] = (data ?? []).map((r) => {
    const status = r.status as MailJobListRow["status"];
    const provider = r.provider as MailJobListRow["provider"];
    const mc = r.mail_class as MailJobListRow["mail_class"];
    return {
      id: r.id as string,
      batch_id: r.batch_id as string,
      lead_id: (r.lead_id as string | null) ?? null,
      recipient_name: (r.recipient_name as string) ?? "",
      recipient_address_line1: (r.recipient_address_line1 as string) ?? "",
      recipient_city: (r.recipient_city as string) ?? "",
      recipient_state: (r.recipient_state as string) ?? "",
      recipient_postal_code: (r.recipient_postal_code as string) ?? "",
      mail_class: mc,
      provider,
      tracking_url: (r.tracking_url as string | null) ?? null,
      status,
      include_check: Boolean(r.include_check),
      check_amount_cents: (r.check_amount_cents as number | null) ?? null,
      cost_cents: (r.cost_cents as number | null) ?? null,
      error_message: (r.error_message as string | null) ?? null,
      sent_at: (r.sent_at as string | null) ?? null,
      delivered_at: (r.delivered_at as string | null) ?? null,
      returned_at: (r.returned_at as string | null) ?? null,
      created_at: (r.created_at as string) ?? new Date().toISOString(),
    };
  });

  // Sort: returned/failed first, then by created_at desc.
  rows.sort((a, b) => {
    const pri = (s: MailJobListRow["status"]) =>
      s === "returned" || s === "failed" ? 0 : 1;
    const pa = pri(a.status);
    const pb = pri(b.status);
    if (pa !== pb) return pa - pb;
    return b.created_at.localeCompare(a.created_at);
  });

  return {
    stats: {
      sent: statSentRes.count ?? 0,
      in_transit: statInTransitRes.count ?? 0,
      delivered: statDeliveredRes.count ?? 0,
      returned: statReturnedRes.count ?? 0,
      failed: statFailedRes.count ?? 0,
      spent_cents: spent,
    },
    rows,
  };
}
