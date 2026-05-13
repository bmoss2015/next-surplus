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
  // Notes now live in discussion_comments, so the recent-activity stream
  // unions both tables and re-sorts. Each side is capped at `limit` so the
  // merged top-`limit` is always correct even when one side is very busy.
  const [actsRes, commentsRes] = await Promise.all([
    sb
      .from("activities")
      .select("id, lead_id, activity_type, payload, created_at, user_id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(limit),
    sb
      .from("discussion_comments")
      .select("id, lead_id, body, created_at, author_id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);
  if (actsRes.error) throw actsRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const acts = (actsRes.data ?? []) as Array<{
    id: string;
    lead_id: string;
    activity_type: string;
    payload: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }>;
  const comments = (commentsRes.data ?? []) as Array<{
    id: string;
    lead_id: string;
    body: string;
    created_at: string;
    author_id: string | null;
  }>;

  const merged: Array<{
    id: string;
    lead_id: string;
    activity_type: string;
    payload: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }> = [
    ...acts,
    ...comments.map((c) => ({
      id: c.id,
      lead_id: c.lead_id,
      activity_type: "note",
      payload: { body: c.body, kind: "note" } as Record<string, unknown>,
      created_at: c.created_at,
      user_id: c.author_id,
    })),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);

  const names = await resolveActorNames(sb, merged.map((r) => r.user_id));
  return merged.map((r) => ({
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
