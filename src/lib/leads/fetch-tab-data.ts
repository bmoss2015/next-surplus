import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveActorNames } from "./activities";

export type DocumentRow = {
  id: string;
  category: string;
  filename: string;
  custom_name: string | null;
  storage_path: string;
  uploaded_at: string;
  required: boolean;
  received: boolean;
  notes: string | null;
};

export type NoteActivityRow = {
  id: string;
  activity_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  user_id: string | null;
  actor_first_name: string | null;
};

export type ActivityFullRow = {
  id: string;
  activity_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  user_id: string | null;
  actor_first_name: string | null;
};

export async function fetchDocuments(leadId: string): Promise<DocumentRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("documents")
    .select(
      "id, category, filename, custom_name, storage_path, uploaded_at, required, received, notes"
    )
    .eq("lead_id", leadId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function fetchNotes(leadId: string): Promise<NoteActivityRow[]> {
  // Notes are now backed by discussion_comments (which carries @mentions +
  // notifications). The OverviewTab "Recent Notes" card calls this fetcher,
  // so we adapt the comment shape into the legacy NoteActivityRow payload.
  const sb = await createClient();
  const { data, error } = await sb
    .from("discussion_comments")
    .select("id, body, created_at, author_id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const raw = (data ?? []) as Array<{
    id: string;
    body: string;
    created_at: string;
    author_id: string | null;
  }>;
  const names = await resolveActorNames(
    sb,
    raw.map((r) => r.author_id)
  );
  return raw.map((r) => ({
    id: r.id,
    activity_type: "note",
    payload: { body: r.body, kind: "note" },
    created_at: r.created_at,
    user_id: r.author_id,
    actor_first_name: r.author_id ? (names.get(r.author_id) ?? null) : null,
  }));
}

export async function fetchActivity(leadId: string): Promise<{
  rows: ActivityFullRow[];
  leadSource: string | null;
}> {
  const sb = await createClient();
  const [actsRes, commentsRes, callsRes, leadResult] = await Promise.all([
    sb
      .from("activities")
      .select("id, activity_type, payload, created_at, user_id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    sb
      .from("discussion_comments")
      .select("id, body, created_at, author_id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    sb
      .from("session_calls")
      .select(
        "id, created_at, duration_seconds, disposition, note, recording_url, transcription_text, transcription_url, transcription_status, telnyx_call_control_id, dialed_at"
      )
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("leads").select("lead_source").eq("id", leadId).maybeSingle(),
  ]);
  if (actsRes.error) throw actsRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const acts = (actsRes.data ?? []) as Array<{
    id: string;
    activity_type: string;
    payload: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }>;
  const comments = (commentsRes.data ?? []) as Array<{
    id: string;
    body: string;
    created_at: string;
    author_id: string | null;
  }>;
  const calls = (callsRes.data ?? []) as Array<{
    id: string;
    created_at: string;
    duration_seconds: number | null;
    disposition: string | null;
    note: string | null;
    recording_url: string | null;
    transcription_text: string | null;
    transcription_url: string | null;
    transcription_status: string | null;
    telnyx_call_control_id: string | null;
    dialed_at: string | null;
  }>;
  const merged = [
    ...acts,
    ...comments.map((c) => ({
      id: c.id,
      activity_type: "note",
      payload: { body: c.body, kind: "note" } as Record<string, unknown>,
      created_at: c.created_at,
      user_id: c.author_id,
    })),
    ...calls.map((c) => ({
      id: `call:${c.id}`,
      activity_type: "call",
      payload: {
        duration_seconds: c.duration_seconds,
        disposition: c.disposition,
        note: c.note,
        recording_url: c.recording_url,
        transcription_text: c.transcription_text,
        transcription_url: c.transcription_url,
        transcription_status: c.transcription_status,
        call_id: c.id,
      } as Record<string, unknown>,
      created_at: c.created_at,
      user_id: null,
    })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const names = await resolveActorNames(
    sb,
    merged.map((r) => r.user_id)
  );
  const rows: ActivityFullRow[] = merged.map((r) => ({
    ...r,
    actor_first_name: r.user_id ? (names.get(r.user_id) ?? null) : null,
  }));
  return {
    rows,
    leadSource: (leadResult.data?.lead_source as string | null) ?? null,
  };
}
