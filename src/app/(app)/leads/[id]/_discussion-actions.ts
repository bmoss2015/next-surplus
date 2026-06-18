"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchNotifications } from "@/lib/notifications/fetch";
import type {
  TeamMemberOption,
  DiscussionCommentRow,
  PostCommentResult,
  ActionResult,
  NotificationRow,
} from "@/lib/notifications/types";

function firstNameOf(fullName: string | null, email: string | null): string {
  const name = (fullName ?? "").trim();
  if (name.length > 0) {
    const first = name.split(/\s+/)[0];
    if (first) return first;
  }
  const local = (email ?? "").split("@")[0]?.trim();
  return local && local.length > 0 ? local : "User";
}

// Team members in the caller's org (used by the @mention picker).
// Excludes deactivated profiles — a removed/inactive teammate must never
// appear in the picker (and is treated as not-mentionable by postComment).
export async function listTeamMembers(): Promise<TeamMemberOption[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("profiles")
    .select("id, full_name, email")
    .eq("deactivated", false)
    .order("full_name", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => {
    const fullName = ((r.full_name as string | null) ?? "").trim();
    const email = (r.email as string | null) ?? null;
    return {
      id: r.id as string,
      fullName: fullName.length > 0 ? fullName : email ?? "User",
      firstName: firstNameOf(fullName || null, email),
      email,
    };
  });
}

// Loads the discussion thread for a lead, oldest first.
export async function listDiscussionComments(
  leadId: string
): Promise<DiscussionCommentRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("discussion_comments")
    .select("id, body, created_at, author_id, mentioned_user_ids")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];

  const authorIds = Array.from(
    new Set(data.map((c) => c.author_id as string | null).filter(Boolean))
  ) as string[];
  const authorMap = new Map<string, { full: string | null; first: string }>();
  if (authorIds.length > 0) {
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, email")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      const full = (p.full_name as string | null) ?? null;
      authorMap.set(p.id as string, {
        full,
        first: firstNameOf(full, (p.email as string | null) ?? null),
      });
    }
  }

  return data.map((c) => {
    const authorId = (c.author_id as string | null) ?? null;
    const a = authorId ? authorMap.get(authorId) : undefined;
    return {
      id: c.id as string,
      body: c.body as string,
      created_at: c.created_at as string,
      author_id: authorId,
      author_first_name: a?.first ?? null,
      author_full_name: a?.full ?? null,
      mentioned_user_ids: (c.mentioned_user_ids as string[] | null) ?? [],
    };
  });
}

// Posts a comment. mentionedUserIds is what the client tracked from the
// @mention picker; we intersect it with the org's real members for safety,
// then fan out notification rows and (best effort) emails.
export async function postComment(input: {
  leadId: string;
  body: string;
  mentionedUserIds: string[];
}): Promise<PostCommentResult> {
  const body = input.body.trim();
  if (body.length === 0) return { ok: false, error: "Comment Can't Be Empty" };
  if (body.length > 5000) {
    return { ok: false, error: "Comment Is Too Long (Max 5000 Characters)" };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not Signed In" };

  const sb = await createClient();

  // Validate mentioned ids against the org roster.
  const members = await listTeamMembers();
  const memberById = new Map(members.map((m) => [m.id, m]));
  const mentioned = Array.from(new Set(input.mentionedUserIds)).filter((id) =>
    memberById.has(id)
  );

  const { data: inserted, error: insertErr } = await sb
    .from("discussion_comments")
    .insert({
      lead_id: input.leadId,
      author_id: profile.id,
      body,
      mentioned_user_ids: mentioned,
    })
    .select("id, body, created_at, author_id, mentioned_user_ids")
    .single();
  if (insertErr) return { ok: false, error: insertErr.message };

  const commentId = inserted.id as string;
  const preview = body.length > 140 ? `${body.slice(0, 140)}…` : body;

  // Notify each mentioned teammate (skip self-mentions).
  const recipients = mentioned.filter((id) => id !== profile.id);
  if (recipients.length > 0) {
    await sb.from("notifications").insert(
      recipients.map((recipientId) => ({
        recipient_id: recipientId,
        actor_id: profile.id,
        type: "mention",
        lead_id: input.leadId,
        comment_id: commentId,
        body_preview: preview,
      }))
    );

    // Best effort email fan-out — never let this break posting.
    try {
      const { data: leadRow } = await sb
        .from("leads")
        .select("lead_id, owners(full_name, is_primary)")
        .eq("id", input.leadId)
        .maybeSingle();
      const ownerList =
        (leadRow?.owners as Array<{ full_name: string | null; is_primary: boolean | null }> | null) ??
        [];
      const primaryOwnerRow =
        ownerList.find((o) => o.is_primary) ?? ownerList[0] ?? null;
      const leadOwnerName =
        (primaryOwnerRow?.full_name ?? "").trim() ||
        ((leadRow?.lead_id as string | null) ?? "the");
      const link = `/leads/${input.leadId}?tab=notes#comment-${commentId}`;
      const actorFirstName = firstNameOf(profile.fullName, profile.email);
      const appUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000";
      for (const recipientId of recipients) {
        const m = memberById.get(recipientId);
        if (!m?.email) continue;
        try {
          await fetch(`${appUrl}/api/notifications/mention`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
            },
            body: JSON.stringify({
              recipientEmail: m.email,
              recipientName: m.firstName,
              actorName: profile.fullName,
              actorFirstName,
              leadId: input.leadId,
              leadOwnerName,
              commentText: body,
              link,
            }),
          });
        } catch {
          // swallow — failed email must not break posting
        }
      }
    } catch {
      // swallow
    }
  }

  revalidatePath(`/leads/${input.leadId}`);

  return {
    ok: true,
    comment: {
      id: commentId,
      body,
      created_at: inserted.created_at as string,
      author_id: profile.id,
      author_first_name: firstNameOf(profile.fullName, profile.email),
      author_full_name: profile.fullName,
      mentioned_user_ids: mentioned,
    },
  };
}

// -- Notification actions ----------------------------------------------------

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResult> {
  const sb = await createClient();
  const { error } = await sb
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not Signed In" };
  const { error } = await sb
    .from("notifications")
    .update({ read: true })
    .eq("recipient_id", user.id)
    .eq("read", false);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Used by the topbar bell to refresh on mount / poll.
export async function getNotifications(): Promise<{
  notifications: NotificationRow[];
  unreadCount: number;
}> {
  return fetchNotifications();
}
