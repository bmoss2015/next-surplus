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
  const sb = await createClient();
  const { data, error } = await sb
    .from("activities")
    .select("id, activity_type, payload, created_at, user_id")
    .eq("lead_id", leadId)
    .eq("activity_type", "note")
    .order("created_at", { ascending: false });
  if (error) throw error;
  // "Pause for review" entries are also activity_type='note' but carry
  // payload.kind='review_pause' — they belong in the Activity log, not Notes.
  const raw = ((data ?? []) as Array<{
    id: string;
    activity_type: string;
    payload: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }>).filter(
    (row) => (row.payload as { kind?: string } | null)?.kind !== "review_pause"
  );
  const names = await resolveActorNames(
    sb,
    raw.map((r) => r.user_id)
  );
  return raw.map((r) => ({
    ...r,
    actor_first_name: r.user_id ? (names.get(r.user_id) ?? null) : null,
  }));
}

export async function fetchActivity(leadId: string): Promise<{
  rows: ActivityFullRow[];
  leadSource: string | null;
}> {
  const sb = await createClient();
  const [{ data, error }, leadResult] = await Promise.all([
    sb
      .from("activities")
      .select("id, activity_type, payload, created_at, user_id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    sb.from("leads").select("lead_source").eq("id", leadId).maybeSingle(),
  ]);
  if (error) throw error;
  const raw = (data ?? []) as Array<{
    id: string;
    activity_type: string;
    payload: Record<string, unknown>;
    created_at: string;
    user_id: string | null;
  }>;
  const names = await resolveActorNames(
    sb,
    raw.map((r) => r.user_id)
  );
  const rows: ActivityFullRow[] = raw.map((r) => ({
    ...r,
    actor_first_name: r.user_id ? (names.get(r.user_id) ?? null) : null,
  }));
  return {
    rows,
    leadSource: (leadResult.data?.lead_source as string | null) ?? null,
  };
}
