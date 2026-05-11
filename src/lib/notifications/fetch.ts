import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "./types";

function firstName(fullName: string | null, email: string | null): string {
  const name = (fullName ?? "").trim();
  if (name.length > 0) {
    const first = name.split(/\s+/)[0];
    if (first) return first;
  }
  const local = (email ?? "").split("@")[0]?.trim();
  return local && local.length > 0 ? local : "Someone";
}

// Lists the signed-in user's notifications (newest first), enriched with the
// actor's first name and a short label for the linked lead.
export async function fetchNotifications(
  limit = 30
): Promise<{ notifications: NotificationRow[]; unreadCount: number }> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  const { data, error } = await sb
    .from("notifications")
    .select(
      "id, type, read, created_at, lead_id, comment_id, body_preview, actor_id"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return { notifications: [], unreadCount: 0 };

  const actorIds = Array.from(
    new Set(data.map((n) => n.actor_id as string | null).filter(Boolean))
  ) as string[];
  const leadIds = Array.from(
    new Set(data.map((n) => n.lead_id as string | null).filter(Boolean))
  ) as string[];

  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, email")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      actorMap.set(
        p.id as string,
        firstName(p.full_name as string | null, p.email as string | null)
      );
    }
  }

  const leadMap = new Map<string, string>();
  if (leadIds.length > 0) {
    const { data: leads } = await sb
      .from("leads")
      .select("id, lead_id, address, city, state")
      .in("id", leadIds);
    for (const l of leads ?? []) {
      const addr = (l.address as string | null)?.trim();
      const cityState = [l.city, l.state].filter(Boolean).join(", ");
      const label =
        addr && addr.length > 0
          ? cityState
            ? `${addr}, ${cityState}`
            : addr
          : (l.lead_id as string | null) ?? null;
      leadMap.set(l.id as string, label ?? "");
    }
  }

  const notifications: NotificationRow[] = data.map((n) => ({
    id: n.id as string,
    type: n.type as string,
    read: Boolean(n.read),
    created_at: n.created_at as string,
    lead_id: (n.lead_id as string | null) ?? null,
    comment_id: (n.comment_id as string | null) ?? null,
    body_preview: (n.body_preview as string | null) ?? null,
    actor_id: (n.actor_id as string | null) ?? null,
    actor_first_name: n.actor_id ? actorMap.get(n.actor_id as string) ?? null : null,
    lead_label: n.lead_id ? leadMap.get(n.lead_id as string) ?? null : null,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;
  return { notifications, unreadCount };
}
