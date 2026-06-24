"use server";

// Dialer session lifecycle actions.
//
// startSession  — creates a dialer_sessions row, snapshots the list filter,
//                 resolves the lead queue, and returns the session id.
// pauseSession  — marks the session as paused and stamps paused_at.
// resumeSession — flips status back to active.
// logDisposition — appends a session_calls row for the current cursor lead
//                  and advances the cursor.
// completeSession — marks the session as completed.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";

type Disposition = "spoke" | "voicemail" | "no_answer" | "wrong_number" | "busy" | "failed";

export async function startSession(input: {
  list_id: string;
  list_name: string;
  filter_snapshot: Record<string, unknown>;
  defaults_snapshot?: Record<string, unknown>;
}): Promise<{ ok: true; session_id: string } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const sb = await createClient();

  let leadIds: string[] = [];

  if (input.list_id === "all") {
    const { data } = await sb.from("leads").select("id").limit(500);
    leadIds = (data ?? []).map((r) => r.id as string);
  } else if (input.list_id.startsWith("import:")) {
    const importId = input.list_id.slice("import:".length);
    const { data } = await sb
      .from("import_rows")
      .select("lead_id")
      .eq("import_id", importId)
      .not("lead_id", "is", null);
    leadIds = (data ?? [])
      .map((r) => r.lead_id as string | null)
      .filter((x): x is string => !!x);
  } else if (input.list_id.startsWith("saved:")) {
    const savedId = input.list_id.slice("saved:".length);
    const { data: list } = await sb
      .from("saved_lists")
      .select("filter_json")
      .eq("id", savedId)
      .maybeSingle();
    const lj = (list?.filter_json as Record<string, unknown> | null) ?? {};
    const ids = lj.lead_ids;
    if (Array.isArray(ids)) leadIds = ids.filter((x): x is string => typeof x === "string");
    if (leadIds.length === 0) {
      const { data } = await sb.from("leads").select("id").limit(500);
      leadIds = (data ?? []).map((r) => r.id as string);
    }
    await sb.from("saved_lists").update({ last_run_at: new Date().toISOString() }).eq("id", savedId);
  } else {
    return { ok: false, error: "Unrecognized list id" };
  }

  if (leadIds.length === 0) {
    return { ok: false, error: "List is empty" };
  }

  const { data, error } = await sb
    .from("dialer_sessions")
    .insert({
      user_id: profile.id,
      list_filter_snapshot: { ...input.filter_snapshot, list_id: input.list_id, list_name: input.list_name },
      lead_ids: leadIds,
      current_cursor: 0,
      status: "active",
      defaults_snapshot: input.defaults_snapshot ?? {},
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dialer");
  return { ok: true, session_id: data.id as string };
}

export async function pauseSession(sessionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("dialer_sessions")
    .update({ status: "paused", paused_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dialer");
  revalidatePath("/dialer/setup");
  return { ok: true };
}

export async function resumeSession(sessionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("dialer_sessions")
    .update({ status: "active", paused_at: null })
    .eq("id", sessionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dialer");
  return { ok: true };
}

export async function completeSession(sessionId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb
    .from("dialer_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dialer");
  return { ok: true };
}

export async function logDisposition(input: {
  session_id: string;
  lead_id: string;
  outbound_number_id?: string | null;
  telnyx_call_control_id?: string | null;
  duration_seconds?: number | null;
  disposition: Disposition;
  note?: string | null;
}): Promise<{ ok: true; next_cursor: number; finished: boolean } | { ok: false; error: string }> {
  const sb = await createClient();

  const { error: insertErr } = await sb.from("session_calls").insert({
    session_id: input.session_id,
    lead_id: input.lead_id,
    outbound_number_id: input.outbound_number_id ?? null,
    telnyx_call_control_id: input.telnyx_call_control_id ?? null,
    duration_seconds: input.duration_seconds ?? null,
    disposition: input.disposition,
    note: input.note ?? null,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  const { data: session, error: sessErr } = await sb
    .from("dialer_sessions")
    .select("lead_ids, current_cursor")
    .eq("id", input.session_id)
    .single();
  if (sessErr) return { ok: false, error: sessErr.message };

  const total = (session.lead_ids as string[]).length;
  const nextCursor = (session.current_cursor as number) + 1;
  const finished = nextCursor >= total;

  const { error: updateErr } = await sb
    .from("dialer_sessions")
    .update({
      current_cursor: nextCursor,
      ...(finished ? { status: "completed", completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", input.session_id);
  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath("/dialer");
  return { ok: true, next_cursor: nextCursor, finished };
}

// Picks an outbound number that best matches the lead's state for local
// presence. Falls back to any active number when state has no match.
export async function pickOutboundNumber(leadState?: string | null): Promise<{ ok: true; phone_number_id: string | null; e164: string | null }> {
  const sb = await createClient();
  let row: { id: string; e164: string } | null = null;
  if (leadState) {
    const { data } = await sb
      .from("phone_numbers")
      .select("id, e164")
      .eq("status", "active")
      .eq("state", leadState)
      .limit(1)
      .maybeSingle();
    if (data) row = { id: data.id as string, e164: data.e164 as string };
  }
  if (!row) {
    const { data } = await sb
      .from("phone_numbers")
      .select("id, e164")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (data) row = { id: data.id as string, e164: data.e164 as string };
  }
  return { ok: true, phone_number_id: row?.id ?? null, e164: row?.e164 ?? null };
}

// Calls Telnyx Call Control API to originate a call. Returns the
// call_control_id which gets stored on session_calls.
export async function originateCall(input: {
  to_e164: string;
  from_e164: string;
}): Promise<{ ok: true; call_control_id: string } | { ok: false; error: string }> {
  const apiKey = process.env.TELNYX_API_KEY;
  const connectionId = process.env.TELNYX_CONNECTION_ID;
  if (!apiKey || !connectionId) {
    return { ok: false, error: "Telnyx env not configured" };
  }
  try {
    const res = await fetch("https://api.telnyx.com/v2/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id: connectionId,
        to: input.to_e164,
        from: input.from_e164,
        record: "record-from-answer",
        record_format: "mp3",
        answering_machine_detection: "premium",
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Telnyx HTTP ${res.status}: ${text}` };
    }
    const json = (await res.json()) as { data?: { call_control_id?: string } };
    const ccid = json.data?.call_control_id;
    if (!ccid) return { ok: false, error: "No call_control_id returned" };
    return { ok: true, call_control_id: ccid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
