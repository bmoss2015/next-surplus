import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type OrgMemberRow = {
  id: string;
  full_name: string;
  email: string | null;
  role: "admin" | "member";
  // True until the invitee accepts — i.e. their auth user has no confirmed
  // email / sign-in yet. (When the admin lookup is unavailable we can't tell, so
  // it falls back to false rather than flagging everyone.)
  pending: boolean;
};

export async function fetchOrgMembers(): Promise<OrgMemberRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("deactivated", false)
    .order("full_name", { ascending: true });
  if (error) throw error;
  const profiles = data ?? [];

  // Work out who has actually accepted their invite. There's no admin "get by
  // id" batch call, so page through listUsers (team rosters are tiny — one call
  // in practice) and collect the ids whose email is confirmed or who have signed
  // in. confirmed === null means we couldn't determine it.
  let confirmed: Set<string> | null = null;
  try {
    const admin = createServiceClient();
    const set = new Set<string>();
    for (let page = 1; page <= 20; page++) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      if (listErr) throw listErr;
      const users = list?.users ?? [];
      for (const u of users) {
        if (u.email_confirmed_at || u.last_sign_in_at) set.add(u.id);
      }
      if (users.length < 100) break;
    }
    confirmed = set;
  } catch {
    confirmed = null;
  }

  return profiles.map((r) => {
    const id = r.id as string;
    return {
      id,
      full_name: (r.full_name as string | null) ?? "",
      email: (r.email as string | null) ?? null,
      role: r.role === "admin" ? "admin" : "member",
      pending: confirmed ? !confirmed.has(id) : false,
    };
  });
}

export type AppSettings = {
  default_recovery_fee_percent: number;
  default_attorney_cost: number;
  surplus_floor: number;
};

export async function fetchAppSettings(): Promise<AppSettings> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "default_recovery_fee_percent",
      "default_attorney_cost",
      "surplus_floor",
    ]);
  if (error) throw error;
  const map = new Map((data ?? []).map((r) => [r.key as string, r.value]));
  return {
    default_recovery_fee_percent:
      Number(map.get("default_recovery_fee_percent")) || 30,
    default_attorney_cost: Number(map.get("default_attorney_cost")) || 2500,
    surplus_floor: Number(map.get("surplus_floor")) || 35000,
  };
}

// Fix R: Pipeline Rules — the "Needs Action" inactivity threshold (in days).
// Returns null when blank/disabled (no row, JSON null, or a non-positive value).
export async function fetchNeedsActionThreshold(): Promise<number | null> {
  const sb = await createClient();
  const { data } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "needs_action_days_threshold")
    .maybeSingle();
  if (!data) return null;
  const n = Number(data.value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null;
}

export type AttorneyRow = {
  id: string;
  name: string;
  email: string | null;
  states_covered: string[];
  default_cost: number | null;
  notes: string | null;
};

export async function fetchAttorneys(): Promise<AttorneyRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("attorneys")
    .select("id, name, email, states_covered, default_cost, notes")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AttorneyRow[];
}

export type TemplateRow = {
  id: string;
  name: string;
  channel: string;
  state: string | null;
  subject: string | null;
  body: string;
  variables: string[];
};

export async function fetchTemplates(): Promise<TemplateRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("templates")
    .select("id, name, channel, state, subject, body, variables")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TemplateRow[];
}

export type LostReasonAdminRow = {
  id: string;
  label: string;
  is_default: boolean;
  archived: boolean;
  created_at: string;
};

export async function fetchLostReasonsAdmin(): Promise<LostReasonAdminRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("lost_reasons")
    .select("id, label, is_default, archived, created_at")
    .order("label", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LostReasonAdminRow[];
}

// -- Scripts (Fix 64) --------------------------------------------------------

export type ScriptChannel = "Call" | "SMS" | "Email";

export type ScriptRow = {
  id: string;
  name: string;
  state: string | null;
  channel: ScriptChannel;
  body: string;
};

export async function fetchScripts(): Promise<ScriptRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("scripts")
    .select("id, name, state, channel, body")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string | null) ?? "",
    state: (r.state as string | null) || null,
    channel: ((r.channel as string) === "SMS"
      ? "SMS"
      : (r.channel as string) === "Email"
        ? "Email"
        : "Call") as ScriptChannel,
    body: (r.body as string | null) ?? "",
  }));
}

// -- State phone numbers (Fix 66) --------------------------------------------

export type StatePhoneRow = {
  state: string;
  phone: string | null;
};

export async function fetchStatePhoneNumbers(): Promise<StatePhoneRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("state_phone_numbers")
    .select("state, phone");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    state: r.state as string,
    phone: (r.phone as string | null) || null,
  }));
}

// -- Research templates (Fix 36) ---------------------------------------------

export type ResearchStep = {
  name: string;
  url: string | null;
  instructions: string | null;
};

export type ResearchTemplateRow = {
  id: string;
  name: string;
  state: string | null;
  sale_type: "TAX" | "MTG" | null;
  steps: ResearchStep[];
};

function normalizeSteps(raw: unknown): ResearchStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const obj = (s ?? {}) as Record<string, unknown>;
    return {
      name: typeof obj.name === "string" ? obj.name : "",
      url: typeof obj.url === "string" && obj.url ? obj.url : null,
      instructions:
        typeof obj.instructions === "string" && obj.instructions
          ? obj.instructions
          : null,
    };
  });
}

export async function fetchResearchTemplates(): Promise<ResearchTemplateRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("research_templates")
    .select("id, name, state, sale_type, steps")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string | null) ?? "",
    state: (r.state as string | null) || null,
    sale_type:
      (r.sale_type as string) === "TAX"
        ? "TAX"
        : (r.sale_type as string) === "MTG"
          ? "MTG"
          : null,
    steps: normalizeSteps(r.steps),
  }));
}
