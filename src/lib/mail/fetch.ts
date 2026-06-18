import "server-only";
import { createClient } from "@/lib/supabase/server";

// Mirror of MailStatus in types.ts — has to live here too because
// fetch.ts is "server-only" while types.ts is imported by client
// components, and TypeScript widens the type if the two definitions
// diverge. Keep both in sync; adding a new status means editing both
// files.
export type MailStatus =
  | "processing"
  | "queued"
  | "in_transit"
  | "delivered"
  | "returned"
  | "failed";

export type MailJobListRow = {
  id: string;
  batch_id: string;
  lead_id: string | null;
  recipient_name: string;
  recipient_address_line1: string;
  recipient_address_line2: string | null;
  recipient_city: string;
  recipient_state: string;
  recipient_postal_code: string;
  mail_class: "standard" | "first_class" | "certified";
  provider: "lob" | "stub";
  tracking_url: string | null;
  tracking_number: string | null;
  status: MailStatus;
  include_check: boolean;
  check_amount_cents: number | null;
  color: boolean;
  cost_cents: number | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  created_at: string;
  // Lead context surfaced under the recipient name in the row — case
  // identifier + estimated surplus give an operator immediate "what
  // deal is this on" recognition without leaving the dashboard.
  lead_label: string | null;
  lead_surplus_cents: number | null;
};

export type MailJobDetailRow = MailJobListRow & {
  body_html: string | null;
  bank_account_id: string | null;
  check_memo: string | null;
  from_name: string;
  from_address_line1: string;
  from_address_line2: string | null;
  from_city: string;
  from_state: string;
  from_postal_code: string;
};

export type MailStats = {
  // processing = at Lob being printed (status='processing' or legacy
  // 'queued' rows). in_flight = USPS-side (status='in_transit'). The
  // /mail dashboard surfaces both as separate KPIs.
  processing: number;
  in_flight: number;
  delivered: number;
  returned: number;
  spent_cents: number;
};

// Status filter the UI sends. "in_flight" maps to (queued OR in_transit);
// "returned" maps to (returned OR failed). No standalone failed filter
// in the UI.
export type MailStatusFilter = "all" | "in_flight" | "delivered" | "returned";

export type MailDashboardOpts = {
  limit?: number;
  windowDays?: number;
  search?: string | null;
  status?: MailStatusFilter;
  leadId?: string | null;
};

export type MailDashboardData = {
  stats: MailStats;
  rows: MailJobListRow[];
};

const STATUS_FILTERS: Record<MailStatusFilter, MailStatus[] | null> = {
  all: null,
  in_flight: ["processing", "queued", "in_transit"],
  delivered: ["delivered"],
  returned: ["returned", "failed"],
};

export async function fetchMailDashboard(
  opts: MailDashboardOpts = {}
): Promise<MailDashboardData> {
  const sb = await createClient();
  const limit = opts.limit ?? 200;
  const windowDays = opts.windowDays ?? 30;
  const since = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000
  ).toISOString();

  // Stats (always for the full window, regardless of search/status filter
  // so the totals don't lie based on what's filtered out). Sample-data
  // rows inserted by the /admin/mail-test harness ARE included so the
  // admin can see seeded data on the dashboard during testing. The
  // harness has a Cleanup button that removes them when the admin is
  // done. Letting them render keeps test runs honest.
  const baseStat = () =>
    sb
      .from("mail_jobs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
  const statsLeadEq = (q: ReturnType<typeof baseStat>) =>
    opts.leadId ? q.eq("lead_id", opts.leadId) : q;
  const [processingRes, inFlightRes, deliveredRes, returnedRes, costRes] = await Promise.all([
    statsLeadEq(baseStat()).in("status", ["processing", "queued"]),
    statsLeadEq(baseStat()).eq("status", "in_transit"),
    statsLeadEq(baseStat()).eq("status", "delivered"),
    statsLeadEq(baseStat()).in("status", ["returned", "failed"]),
    (opts.leadId
      ? sb
          .from("mail_jobs")
          .select("cost_cents")
          .gte("created_at", since)
          .eq("lead_id", opts.leadId)
      : sb
          .from("mail_jobs")
          .select("cost_cents")
          .gte("created_at", since)),
  ]);
  const spent = (costRes.data ?? []).reduce(
    (sum, r) => sum + ((r.cost_cents as number | null) ?? 0),
    0
  );

  // List query — filters apply here only (stats stay un-filtered).
  let q = sb
    .from("mail_jobs")
    .select(
      "id, batch_id, lead_id, recipient_name, recipient_address_line1, recipient_address_line2, recipient_city, recipient_state, recipient_postal_code, mail_class, provider, tracking_url, tracking_number, status, include_check, check_amount_cents, color, cost_cents, error_message, sent_at, delivered_at, returned_at, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (opts.leadId) q = q.eq("lead_id", opts.leadId);
  const statusList = STATUS_FILTERS[opts.status ?? "all"];
  if (statusList) q = q.in("status", statusList);
  const search = (opts.search ?? "").trim();
  if (search.length > 0) {
    const term = `%${search.replace(/[%_]/g, "")}%`;
    // ilike across recipient name / city / state — the three fields a
    // human types when searching mail. Postal code search would need a
    // separate column or string-cast; not worth the extra query for now.
    q = q.or(
      `recipient_name.ilike.${term},recipient_city.ilike.${term},recipient_state.ilike.${term}`
    );
  }
  const { data, error } = await q;
  if (error) throw error;

  const rows: MailJobListRow[] = (data ?? []).map(mapRow);

  // Enrich rows with lead context (case identifier + estimated surplus)
  // so the dashboard can show "Smith case · $42K surplus" under the
  // recipient name. One in() query covers all the lead_ids in this
  // page; small cost relative to the main fetch.
  const leadIds = Array.from(
    new Set(rows.map((r) => r.lead_id).filter((x): x is string => Boolean(x)))
  );
  if (leadIds.length > 0) {
    const { data: leadRows } = await sb
      .from("leads")
      .select("id, lead_id, address, city, state, estimated_surplus")
      .in("id", leadIds);
    const leadMap = new Map<string, { label: string; surplus: number | null }>();
    for (const l of leadRows ?? []) {
      const caseId = (l.lead_id as string | null)?.trim();
      const addr = (l.address as string | null)?.trim();
      const cityState = [l.city, l.state].filter(Boolean).join(", ");
      // Prefer the case identifier ("L-2026-0042") since that's what
      // operators look up by. Fall back to a city-anchored address if
      // there's no case id yet.
      const label =
        caseId && caseId.length > 0
          ? caseId
          : addr && addr.length > 0
            ? cityState
              ? `${addr}, ${cityState}`
              : addr
            : "";
      leadMap.set(l.id as string, {
        label,
        surplus: (l.estimated_surplus as number | null) ?? null,
      });
    }
    for (const r of rows) {
      if (!r.lead_id) continue;
      const lead = leadMap.get(r.lead_id);
      if (!lead) continue;
      r.lead_label = lead.label || null;
      // estimated_surplus is stored as dollars (numeric/integer), not
      // cents — convert to cents for consistency with cost_cents.
      r.lead_surplus_cents = lead.surplus != null ? Math.round(lead.surplus * 100) : null;
    }
  }

  // Sort: returned/failed first, then by created_at desc.
  rows.sort((a, b) => {
    const pri = (s: MailStatus) =>
      s === "returned" || s === "failed" ? 0 : 1;
    const pa = pri(a.status);
    const pb = pri(b.status);
    if (pa !== pb) return pa - pb;
    return b.created_at.localeCompare(a.created_at);
  });

  return {
    stats: {
      processing: processingRes.count ?? 0,
      in_flight: inFlightRes.count ?? 0,
      delivered: deliveredRes.count ?? 0,
      returned: returnedRes.count ?? 0,
      spent_cents: spent,
    },
    rows,
  };
}

// Single-job detail for the drill-in panel — includes the body_html the
// recipient receives and the full sender snapshot.
export async function fetchMailJob(
  id: string
): Promise<MailJobDetailRow | null> {
  const sb = await createClient();
  const { data } = await sb
    .from("mail_jobs")
    .select(
      "id, batch_id, lead_id, recipient_name, recipient_address_line1, recipient_address_line2, recipient_city, recipient_state, recipient_postal_code, mail_class, provider, tracking_url, tracking_number, status, include_check, check_amount_cents, color, check_memo, bank_account_id, cost_cents, error_message, sent_at, delivered_at, returned_at, created_at, body_html, from_name, from_address_line1, from_address_line2, from_city, from_state, from_postal_code"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    ...mapRow(data),
    body_html: (data.body_html as string | null) ?? null,
    bank_account_id: (data.bank_account_id as string | null) ?? null,
    check_memo: (data.check_memo as string | null) ?? null,
    from_name: (data.from_name as string) ?? "",
    from_address_line1: (data.from_address_line1 as string) ?? "",
    from_address_line2: (data.from_address_line2 as string | null) ?? null,
    from_city: (data.from_city as string) ?? "",
    from_state: (data.from_state as string) ?? "",
    from_postal_code: (data.from_postal_code as string) ?? "",
  };
}

function mapRow(r: Record<string, unknown>): MailJobListRow {
  return {
    id: r.id as string,
    batch_id: r.batch_id as string,
    lead_id: (r.lead_id as string | null) ?? null,
    recipient_name: (r.recipient_name as string) ?? "",
    recipient_address_line1: (r.recipient_address_line1 as string) ?? "",
    recipient_address_line2: (r.recipient_address_line2 as string | null) ?? null,
    recipient_city: (r.recipient_city as string) ?? "",
    recipient_state: (r.recipient_state as string) ?? "",
    recipient_postal_code: (r.recipient_postal_code as string) ?? "",
    mail_class: r.mail_class as MailJobListRow["mail_class"],
    provider: r.provider as MailJobListRow["provider"],
    tracking_url: (r.tracking_url as string | null) ?? null,
    tracking_number: (r.tracking_number as string | null) ?? null,
    status: r.status as MailStatus,
    include_check: Boolean(r.include_check),
    check_amount_cents: (r.check_amount_cents as number | null) ?? null,
    color: Boolean(r.color),
    cost_cents: (r.cost_cents as number | null) ?? null,
    error_message: (r.error_message as string | null) ?? null,
    sent_at: (r.sent_at as string | null) ?? null,
    delivered_at: (r.delivered_at as string | null) ?? null,
    returned_at: (r.returned_at as string | null) ?? null,
    created_at: (r.created_at as string) ?? new Date().toISOString(),
    lead_label: null,
    lead_surplus_cents: null,
  };
}
