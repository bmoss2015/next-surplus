import "server-only";
import { createClient } from "@/lib/supabase/server";
import { firstNameFrom } from "./activity-format";

export type { ActivityRow } from "./activity-format";
export { formatActivity, relativeTime, activityActorName } from "./activity-format";

export type RecentActivityRow = {
  id: string;
  lead_id: string;
  activity_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  user_id: string | null;
  actor_first_name: string | null;
};

export async function fetchRecentActivity(
  leadId: string,
  limit = 5
): Promise<RecentActivityRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("activities")
    .select("id, lead_id, activity_type, payload, created_at, user_id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    lead_id: string;
    activity_type: string;
    payload: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }>;
  const names = await resolveActorNames(sb, rows.map((r) => r.user_id));
  return rows.map((r) => ({
    ...r,
    actor_first_name: r.user_id ? (names.get(r.user_id) ?? null) : null,
  }));
}

// Looks up first names for a set of user ids from the profiles table. Falls back
// to the email local-part when no full name is stored.
export async function resolveActorNames(
  sb: Awaited<ReturnType<typeof createClient>>,
  userIds: Array<string | null | undefined>
): Promise<Map<string, string>> {
  const ids = Array.from(
    new Set(userIds.filter((id): id is string => typeof id === "string" && id.length > 0))
  );
  const out = new Map<string, string>();
  if (ids.length === 0) return out;
  const { data } = await sb
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);
  for (const row of (data ?? []) as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
  }>) {
    const first = firstNameFrom(row.full_name, row.email);
    if (first) out.set(row.id, first);
  }
  return out;
}
