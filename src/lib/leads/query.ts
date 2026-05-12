import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import type { LeadRow, SortColumn, SortDir, Stage, SaleType, OwnerStatus } from "./types";

// Fix 75: non-admin users only see leads assigned to them; admins see all
// (including unassigned). Used by the Leads table, Kanban, Daily Work, Claims.
export async function currentAssignmentFilterId(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (profile && !profile.isAdmin) return profile.id;
  return null;
}

const RELATIVE_LITIGATOR_OR =
  "phone_is_litigator.eq.true,phone_2_is_litigator.eq.true," +
  "phone_3_is_litigator.eq.true,phone_4_is_litigator.eq.true,phone_5_is_litigator.eq.true";

// Fix G: which of these leads has at least one contact or relative phone marked
// as a litigation risk. Used to surface the maroon "Litigator" badge on lead
// rows / cards without opening the lead.
export async function litigatorLeadIdSet(
  sb: Awaited<ReturnType<typeof createClient>>,
  leadIds: string[]
): Promise<Set<string>> {
  const set = new Set<string>();
  if (leadIds.length === 0) return set;
  const [contactsRes, relativesRes] = await Promise.all([
    sb.from("contacts").select("lead_id").in("lead_id", leadIds).eq("is_litigator", true),
    sb.from("relatives").select("lead_id").in("lead_id", leadIds).or(RELATIVE_LITIGATOR_OR),
  ]);
  for (const r of contactsRes.data ?? []) set.add(r.lead_id as string);
  for (const r of relativesRes.data ?? []) set.add(r.lead_id as string);
  return set;
}

// Set `has_litigator` on each lead in the list (one extra round trip).
export async function withLitigatorFlags<T extends LeadRow>(
  sb: Awaited<ReturnType<typeof createClient>>,
  leads: T[]
): Promise<T[]> {
  const set = await litigatorLeadIdSet(sb, leads.map((l) => l.id));
  return leads.map((l) => ({ ...l, has_litigator: set.has(l.id) }));
}

// Fix O: which of these leads have been worked at all — i.e. carry any activity
// row other than the auto-logged "lead_created" record. Used to decide whether
// an untouched New Leads lead should show a "New" pill in the Status column.
export async function workedLeadIdSet(
  sb: Awaited<ReturnType<typeof createClient>>,
  leadIds: string[]
): Promise<Set<string>> {
  const set = new Set<string>();
  if (leadIds.length === 0) return set;
  const { data } = await sb
    .from("activities")
    .select("lead_id")
    .in("lead_id", leadIds)
    .neq("activity_type", "lead_created");
  for (const r of data ?? []) set.add(r.lead_id as string);
  return set;
}

export type LeadsFilter = {
  q?: string;
  state?: string;
  sale_type?: SaleType;
  stage?: Stage;
  owner_status?: OwnerStatus;
  surplus_min?: number;
  surplus_max?: number;
};

export type LeadsQuery = LeadsFilter & {
  sort?: SortColumn;
  dir?: SortDir;
  page?: number;
  pageSize?: number;
};

// Map UI sort columns to actual DB column names. Owner-name and days-since-sale
// require post-processing — handled below.
const DB_SORT: Partial<Record<SortColumn, string>> = {
  lead_id: "lead_id",
  address: "address",
  stage: "stage",
  sale_type: "sale_type",
  estimated_surplus: "estimated_surplus",
  days_since_sale: "sale_date",
  stage_changed_at: "stage_changed_at",
};

// Fix 4: the Leads-table state filter is built from the states actually present
// in the database, so it updates the moment an import lands. No hardcoded list.
export async function fetchDistinctStates(): Promise<string[]> {
  const sb = await createClient();
  const { data, error } = await sb.from("leads").select("state").eq("archived", false);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) {
    const s = (r.state as string | null)?.trim();
    if (s) set.add(s);
  }
  return Array.from(set).sort();
}

export async function fetchLeads(query: LeadsQuery): Promise<{
  leads: LeadRow[];
  total: number;
}> {
  const sb = await createClient();
  const pageSize = query.pageSize ?? 25;
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let req = sb
    .from("leads")
    .select(
      `id, lead_id, address, city, state, zip, county,
       sale_type, sale_date, stage, stage_changed_at,
       closing_bid, estimated_surplus, estimated_net_payout,
       recovery_fee_percent, attorney_cost,
       redemption_ends, filing_deadline,
       needs_action_flag, below_floor, archived, imported_at,
       owners(full_name, is_primary, status)`,
      { count: "exact" }
    );

  // Default views always hide archived leads; archiving/restoring happens from
  // the lead detail page.
  req = req.eq("archived", false);
  const assignFilter = await currentAssignmentFilterId();
  if (assignFilter) req = req.eq("assigned_to", assignFilter);
  if (query.state) req = req.eq("state", query.state);
  if (query.sale_type) req = req.eq("sale_type", query.sale_type);
  if (query.stage) req = req.eq("stage", query.stage);
  if (query.surplus_min != null) req = req.gte("estimated_surplus", query.surplus_min);
  if (query.surplus_max != null) req = req.lte("estimated_surplus", query.surplus_max);

  if (query.q) {
    const like = `%${query.q}%`;
    req = req.or(
      `lead_id.ilike.${like},address.ilike.${like},city.ilike.${like}`
    );
  }

  const sortCol = query.sort ? DB_SORT[query.sort] : null;
  if (sortCol) {
    const ascending = (query.dir ?? "desc") === "asc";
    // sale_date asc = oldest first = most days since sale, so flip when sorting by days
    if (query.sort === "days_since_sale") {
      req = req.order("sale_date", { ascending: !ascending });
    } else {
      req = req.order(sortCol, { ascending });
    }
  } else {
    req = req.order("imported_at", { ascending: false });
  }

  req = req.range(from, to);

  const { data, count, error } = await req;
  if (error) throw error;

  let leads = (data ?? []) as LeadRow[];

  // Owner-status filter is applied post-fetch (because owners is a related
  // table; keeping the SQL straight is easier than a complex .or filter).
  if (query.owner_status) {
    leads = leads.filter((l) => {
      const primary = l.owners.find((o) => o.is_primary) ?? l.owners[0];
      return primary?.status === query.owner_status;
    });
  }

  const ids = leads.map((l) => l.id);
  const [litigatorSet, workedSet] = await Promise.all([
    litigatorLeadIdSet(sb, ids),
    workedLeadIdSet(sb, ids),
  ]);
  leads = leads.map((l) => ({
    ...l,
    has_litigator: litigatorSet.has(l.id),
    has_activity: workedSet.has(l.id),
  }));

  return { leads, total: count ?? 0 };
}
