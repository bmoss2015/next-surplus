import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import {
  FeedbackPanel,
  type FeedbackRow,
  type FeedbackMessage,
} from "./_components/FeedbackPanel";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.canViewFeedback) redirect("/");

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("feedback")
    .select(
      `
      id, type, title, body, page_url, surface, status,
      response_body, responded_at, responded_by,
      created_at, updated_at,
      user_id, org_id
      `
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="p-8 text-[14px] text-danger">
        Could not load feedback: {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as Array<{
    id: string;
    type: "bug" | "idea" | "question";
    title: string;
    body: string;
    page_url: string | null;
    surface: string | null;
    status: FeedbackRow["status"];
    response_body: string | null;
    responded_at: string | null;
    responded_by: string | null;
    created_at: string;
    updated_at: string;
    user_id: string | null;
    org_id: string | null;
  }>;

  const feedbackIds = rows.map((r) => r.id);
  const userIds = Array.from(
    new Set(rows.map((r) => r.user_id).filter((v): v is string => Boolean(v)))
  );
  const orgIds = Array.from(
    new Set(rows.map((r) => r.org_id).filter((v): v is string => Boolean(v)))
  );

  const [usersRes, orgsRes, messagesRes] = await Promise.all([
    userIds.length
      ? admin
          .from("profiles")
          .select("id, full_name, email, role")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    orgIds.length
      ? admin.from("orgs").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [], error: null }),
    feedbackIds.length
      ? admin
          .from("feedback_messages")
          .select(
            "id, feedback_id, direction, sender_user_id, sender_name, sender_email, body, created_at"
          )
          .in("feedback_id", feedbackIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const userMap = new Map<string, { fullName: string; email: string | null; role: string }>();
  for (const u of (usersRes.data ?? []) as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
  }>) {
    userMap.set(u.id, {
      fullName: u.full_name ?? u.email ?? "Unknown",
      email: u.email,
      role: u.role ?? "member",
    });
  }
  const orgMap = new Map<string, { name: string }>();
  for (const o of (orgsRes.data ?? []) as Array<{ id: string; name: string | null }>) {
    orgMap.set(o.id, { name: o.name ?? "Unknown Org" });
  }

  const messagesByFeedback = new Map<string, FeedbackMessage[]>();
  for (const m of (messagesRes.data ?? []) as Array<{
    id: string;
    feedback_id: string;
    direction: "outbound" | "inbound";
    sender_user_id: string | null;
    sender_name: string | null;
    sender_email: string | null;
    body: string;
    created_at: string;
  }>) {
    const list = messagesByFeedback.get(m.feedback_id) ?? [];
    list.push({
      id: m.id,
      direction: m.direction,
      senderName: m.sender_name,
      senderEmail: m.sender_email,
      body: m.body,
      createdAt: m.created_at,
    });
    messagesByFeedback.set(m.feedback_id, list);
  }

  const enriched: FeedbackRow[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    pageUrl: r.page_url,
    surface: r.surface,
    status: r.status,
    responseBody: r.response_body,
    respondedAt: r.responded_at,
    createdAt: r.created_at,
    user: r.user_id
      ? {
          id: r.user_id,
          fullName: userMap.get(r.user_id)?.fullName ?? "Unknown",
          email: userMap.get(r.user_id)?.email ?? null,
          role: userMap.get(r.user_id)?.role ?? "member",
        }
      : null,
    org: r.org_id
      ? { id: r.org_id, name: orgMap.get(r.org_id)?.name ?? "Unknown Org" }
      : null,
    messages: messagesByFeedback.get(r.id) ?? [],
  }));

  return (
    <div className="h-full">
      <FeedbackPanel rows={enriched} />
    </div>
  );
}
