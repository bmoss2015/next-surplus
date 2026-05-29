import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Notification preferences for the signed-in user. Returns a sparse map of
// pref_key → enabled. Callers overlay this onto the defaults defined in
// _notification-prefs.ts. Returns {} gracefully on missing rows / RLS.
export async function fetchMyNotificationPrefs(): Promise<Record<string, boolean>> {
  const profile = await getCurrentProfile();
  if (!profile) return {};
  const sb = await createClient();
  const { data, error } = await sb
    .from("user_notification_prefs")
    .select("pref_key, enabled")
    .eq("user_id", profile.id);
  if (error) return {};
  const out: Record<string, boolean> = {};
  for (const row of data ?? []) out[row.pref_key] = row.enabled;
  return out;
}

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

export type OrgInfo = {
  name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id_ein: string | null;
  logo_url: string | null;
};

export async function fetchOrgInfo(): Promise<OrgInfo> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("orgs")
    .select(
      "name, legal_name, email, phone, website, address_line1, address_line2, city, region, postal_code, country, tax_id_ein, logo_url"
    )
    .single();
  if (error) throw error;
  return {
    name: (data.name as string | null) ?? "",
    legal_name: (data.legal_name as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    website: (data.website as string | null) ?? null,
    address_line1: (data.address_line1 as string | null) ?? null,
    address_line2: (data.address_line2 as string | null) ?? null,
    city: (data.city as string | null) ?? null,
    region: (data.region as string | null) ?? null,
    postal_code: (data.postal_code as string | null) ?? null,
    country: (data.country as string | null) ?? null,
    tax_id_ein: (data.tax_id_ein as string | null) ?? null,
    logo_url: (data.logo_url as string | null) ?? null,
  };
}

// Lob pricing settings — admin-editable. Reads orgs.lob_pricing_cents
// (the rate schedule the send-letter / send-check code uses to compute
// spend) plus the cron-managed snapshot fields. Settings UI surfaces
// all four so admins can see drift between their contract pricing and
// Lob's published list, and toggle the weekly auto-sync.
export type LobPricingCents = {
  tier_label: string;
  check_base: number;
  check_extra_attachment_page: number;
  letter_first_class_bw: number;
  letter_first_class_color: number;
  letter_standard_bw: number;
  letter_standard_color: number;
  letter_certified_bw: number;
  letter_certified_color: number;
  letter_extra_page_bw: number;
  letter_extra_page_color: number;
  letter_over_6_sheet_fee?: number;
};

export type LobPricingSettings = {
  current: LobPricingCents;
  published: LobPricingCents | null;
  auto_sync: boolean;
  last_checked_at: string | null;
};

const LOB_PRICING_DEFAULTS: LobPricingCents = {
  tier_label: "Developer (published)",
  check_base: 116,
  check_extra_attachment_page: 22,
  letter_over_6_sheet_fee: 244,
  letter_first_class_bw: 103,
  letter_first_class_color: 119,
  letter_standard_bw: 81,
  letter_standard_color: 97,
  letter_certified_bw: 103,
  letter_certified_color: 119,
  letter_extra_page_bw: 10,
  letter_extra_page_color: 20,
};

function coerceLobPricing(raw: unknown): LobPricingCents {
  if (!raw || typeof raw !== "object") return LOB_PRICING_DEFAULTS;
  const r = raw as Record<string, unknown>;
  const num = (k: keyof LobPricingCents) => {
    const v = r[k];
    return typeof v === "number" && Number.isFinite(v)
      ? Math.round(v)
      : (LOB_PRICING_DEFAULTS[k] as number);
  };
  return {
    tier_label:
      typeof r.tier_label === "string" && r.tier_label.trim().length > 0
        ? r.tier_label
        : LOB_PRICING_DEFAULTS.tier_label,
    check_base: num("check_base"),
    check_extra_attachment_page: num("check_extra_attachment_page"),
    letter_first_class_bw: num("letter_first_class_bw"),
    letter_first_class_color: num("letter_first_class_color"),
    letter_standard_bw: num("letter_standard_bw"),
    letter_standard_color: num("letter_standard_color"),
    letter_certified_bw: num("letter_certified_bw"),
    letter_certified_color: num("letter_certified_color"),
    letter_extra_page_bw: num("letter_extra_page_bw"),
    letter_extra_page_color: num("letter_extra_page_color"),
    letter_over_6_sheet_fee: (() => {
      const v = r.letter_over_6_sheet_fee;
      if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
      return LOB_PRICING_DEFAULTS.letter_over_6_sheet_fee;
    })(),
  };
}

export type CustomerPricingViewData = {
  subscription_monthly_cents: number;
  customer_mail_pricing_cents: LobPricingCents;
};

// Customer-facing pricing read. Available to any authenticated user via
// RLS on app_pricing_config (select policy is open to authenticated).
// Returns null only if the singleton row is missing, which means the
// owner has not configured pricing yet.
export async function fetchMyCustomerPricing(): Promise<CustomerPricingViewData | null> {
  const sb = await createClient();
  const { data } = await sb
    .from("app_pricing_config")
    .select("subscription_monthly_cents, customer_mail_pricing_cents")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return null;
  return {
    subscription_monthly_cents:
      (data.subscription_monthly_cents as number | null) ?? 0,
    customer_mail_pricing_cents: coerceLobPricing(
      data.customer_mail_pricing_cents
    ),
  };
}

export async function fetchLobPricingSettings(): Promise<LobPricingSettings> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("orgs")
    .select(
      "lob_pricing_cents, lob_published_pricing_cents, lob_pricing_auto_sync, lob_pricing_last_checked_at"
    )
    .single();
  if (error) throw error;
  return {
    current: coerceLobPricing(data.lob_pricing_cents),
    published: data.lob_published_pricing_cents
      ? coerceLobPricing(data.lob_published_pricing_cents)
      : null,
    auto_sync: Boolean(data.lob_pricing_auto_sync),
    last_checked_at:
      (data.lob_pricing_last_checked_at as string | null) ?? null,
  };
}

export type MailSettings = {
  signer_name: string | null;
  signer_title: string | null;
  signature_image_path: string | null;
  // Short-lived signed URL resolved on the server so the settings page can show
  // a preview thumbnail. Null when no signature is uploaded.
  signature_image_url: string | null;
  default_mail_class: "standard" | "first_class" | "certified";
};

export async function fetchMailSettings(): Promise<MailSettings> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("orgs")
    .select("signer_name, signer_title, signature_image_path, default_mail_class")
    .single();
  if (error) throw error;
  const dmc = (data.default_mail_class as string | null) ?? "first_class";
  const path = (data.signature_image_path as string | null) ?? null;
  let signedUrl: string | null = null;
  if (path) {
    // 1 hour is plenty for the settings page preview; the mail-send path
    // generates its own longer signed URL when actually sending.
    const admin = createServiceClient();
    const { data: signed } = await admin.storage
      .from("signatures")
      .createSignedUrl(path, 60 * 60);
    signedUrl = signed?.signedUrl ?? null;
  }
  return {
    signer_name: (data.signer_name as string | null) ?? null,
    signer_title: (data.signer_title as string | null) ?? null,
    signature_image_path: path,
    signature_image_url: signedUrl,
    default_mail_class:
      dmc === "standard" || dmc === "first_class" || dmc === "certified"
        ? dmc
        : "first_class",
  };
}

export type MailBankAccountRow = {
  id: string;
  bank_name: string | null;
  account_holder_name: string;
  routing_last_four: string | null;
  account_last_four: string | null;
  status: "unverified" | "verified" | "disabled";
  verified_at: string | null;
};

export async function fetchMailBankAccounts(): Promise<MailBankAccountRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("mail_bank_accounts")
    .select(
      "id, bank_name, account_holder_name, routing_last_four, account_last_four, status, verified_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    bank_name: (r.bank_name as string | null) ?? null,
    account_holder_name: (r.account_holder_name as string | null) ?? "",
    routing_last_four: (r.routing_last_four as string | null) ?? null,
    account_last_four: (r.account_last_four as string | null) ?? null,
    status:
      r.status === "verified" || r.status === "disabled"
        ? (r.status as "verified" | "disabled")
        : "unverified",
    verified_at: (r.verified_at as string | null) ?? null,
  }));
}

export type MailTemplateFolderRow = {
  id: string;
  name: string;
  sort_order: number;
};

export type MailTemplateRow = {
  id: string;
  name: string;
  folder_id: string | null;
  body_html: string | null;
  docx_path: string | null;
  attachment_paths: string[];
  default_mail_class: "standard" | "first_class" | "certified";
  updated_at: string;
};

export async function fetchMailTemplateFolders(): Promise<MailTemplateFolderRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("mail_template_folders")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string | null) ?? "",
    sort_order: Number(r.sort_order ?? 0),
  }));
}

export async function fetchMailTemplates(): Promise<MailTemplateRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("mail_templates")
    .select("id, name, folder_id, body_html, docx_path, attachment_paths, default_mail_class, updated_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const dmc = r.default_mail_class as string;
    return {
      id: r.id as string,
      name: (r.name as string | null) ?? "",
      folder_id: (r.folder_id as string | null) ?? null,
      body_html: (r.body_html as string | null) ?? null,
      docx_path: (r.docx_path as string | null) ?? null,
      attachment_paths: (r.attachment_paths as string[] | null) ?? [],
      default_mail_class:
        dmc === "standard" || dmc === "certified"
          ? (dmc as "standard" | "certified")
          : "first_class",
      updated_at: (r.updated_at as string) ?? new Date().toISOString(),
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
    // Fix LLLL3 PART 2: the default attorney cost is $0 when the row is
    // missing — matches the leads.attorney_cost column default (migration
    // 0095). Users who want a non-zero default can set it on the Settings
    // page; that stored value still wins when present.
    default_attorney_cost: Number(map.get("default_attorney_cost")) || 0,
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

// A research step is either a single checkbox or a parent holding nested
// sub-steps. The shape is the same recursively, so the editor and the
// per-lead view can render either level uniformly. Empty `children`
// means a single-step parent (no nesting).
export type ResearchStep = {
  name: string;
  url: string | null;
  instructions: string | null;
  children: ResearchStep[];
};

// How a playbook auto-attaches to imported leads.
//   manual = reps add it themselves from the lead page
//   all    = every newly imported lead gets it, no filter
//   match  = only leads whose state is in apply_states
export type PlaybookApplyMode = "manual" | "all" | "match";

export type ResearchTemplateRow = {
  id: string;
  name: string;
  description: string | null;
  // Legacy single-state field. New code reads apply_states. Kept for
  // back-compat with playbook board queries that still filter on it.
  state: string | null;
  sale_type: "TAX" | "MTG" | null;
  apply_mode: PlaybookApplyMode;
  apply_states: string[];
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
      children: normalizeSteps(obj.children),
    };
  });
}

function normalizeApplyMode(raw: unknown): PlaybookApplyMode {
  return raw === "all" || raw === "manual" || raw === "match" ? raw : "match";
}

function normalizeApplyStates(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s));
}

export async function fetchResearchTemplates(): Promise<ResearchTemplateRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("research_templates")
    .select("id, name, description, state, sale_type, apply_mode, apply_states, steps")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string | null) ?? "",
    description: (r.description as string | null) || null,
    state: (r.state as string | null) || null,
    sale_type:
      (r.sale_type as string) === "TAX"
        ? "TAX"
        : (r.sale_type as string) === "MTG"
          ? "MTG"
          : null,
    apply_mode: normalizeApplyMode(r.apply_mode),
    apply_states: normalizeApplyStates(r.apply_states),
    steps: normalizeSteps(r.steps),
  }));
}
