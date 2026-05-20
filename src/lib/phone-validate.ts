import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Resend } from "resend";
import { createServiceClient } from "./supabase/service";

// IPQS free tier is 1,000 lookups/month with a 35/day cap. Unlike Veriphone,
// IPQS does real HLR-grade line-status detection (their `active` field), so
// 'disconnected' is caught reliably. Override the cap per-org via
// app_settings key='phone_validation_quota_cap' if you move to a paid tier.
const DEFAULT_QUOTA_CAP = 1000;
const IPQS_ENDPOINT_PREFIX = "https://www.ipqualityscore.com/api/json/phone/";
const ADDON_KEY = "phone_validation";

export type ValidationStatus = "valid" | "invalid" | "untested";

export type ValidationResult = {
  status: ValidationStatus;
  provider: string | null;
  checkedAt: string | null;
  raw: unknown;
  // Mapped from IPQS's line_type — caller decides whether to overwrite an
  // existing phone_type on the row. Null when the provider didn't return a
  // usable line type (libphonenumber failure, quota exhaustion, etc.).
  phoneType: string | null;
  // IPQS also returns DNC + TCPA-litigator flags inline; surface them so the
  // sweep can auto-update is_dnc / is_litigator on the row without needing a
  // separate API call.
  isDnc: boolean | null;
  isLitigator: boolean | null;
};

// Map IPQS's `line_type` string to the portal's display value. IPQS returns
// strings like "Mobile", "Landline", "VOIP", "Toll Free", "Prepaid". We only
// auto-fill when we have a clear answer; ambiguous types return null so we
// leave the existing phone_type column alone.
function mapIpqsLineType(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const norm = t.trim().toLowerCase();
  if (norm === "mobile" || norm === "wireless" || norm === "prepaid") return "Mobile";
  if (norm === "landline" || norm === "fixed line") return "Landline";
  if (norm === "voip") return "Mobile";
  return null;
}

type ServiceClient = ReturnType<typeof createServiceClient>;

function currentPeriodMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

async function getQuotaCap(sb: ServiceClient, orgId: string): Promise<number> {
  const { data } = await sb
    .from("app_settings")
    .select("value")
    .eq("org_id", orgId)
    .eq("key", "phone_validation_quota_cap")
    .maybeSingle();
  if (data?.value == null) return DEFAULT_QUOTA_CAP;
  const n = Number(data.value);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_QUOTA_CAP;
}

async function getMonthUsage(sb: ServiceClient, orgId: string): Promise<number> {
  const { data } = await sb
    .from("org_addon_usage")
    .select("units")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY)
    .eq("period_month", currentPeriodMonth());
  if (!data) return 0;
  return data.reduce((sum, row) => sum + (row.units ?? 0), 0);
}

async function logUsage(
  sb: ServiceClient,
  orgId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await sb.from("org_addon_usage").insert({
    org_id: orgId,
    addon_key: ADDON_KEY,
    units: 1,
    unit_cost_cents: 0,
    period_month: currentPeriodMonth(),
    metadata,
  });
  // Fire threshold alert check after logging the call. Awaited so a single
  // request fully processes its own potential threshold crossing — concurrent
  // requests rely on the usage_alerts unique constraint to dedupe.
  try {
    await checkAndAlertThresholds(sb, orgId);
  } catch (e) {
    console.error("[phone-validate] threshold check failed:", e);
  }
}

// 80% — heads up, still room. 95% — about to cap. 100% — paused.
const ALERT_THRESHOLDS = [80, 95, 100] as const;

async function checkAndAlertThresholds(sb: ServiceClient, orgId: string): Promise<void> {
  const [cap, used] = await Promise.all([getQuotaCap(sb, orgId), getMonthUsage(sb, orgId)]);
  if (cap <= 0) return;
  const pct = Math.round((used / cap) * 100);
  const periodMonth = currentPeriodMonth();
  for (const threshold of ALERT_THRESHOLDS) {
    if (pct < threshold) continue;
    // Try to claim this threshold for this month. Unique constraint on
    // (org_id, addon_key, threshold_pct, period_month) means only one insert
    // wins under concurrent calls — that's the one that emails.
    const { error } = await sb.from("usage_alerts").insert({
      org_id: orgId,
      addon_key: ADDON_KEY,
      threshold_pct: threshold,
      period_month: periodMonth,
    });
    if (error) continue;
    await sendThresholdEmail(sb, orgId, threshold, used, cap);
  }
}

async function sendThresholdEmail(
  sb: ServiceClient,
  orgId: string,
  threshold: number,
  used: number,
  cap: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const { data } = await sb
    .from("profiles")
    .select("email")
    .eq("org_id", orgId)
    .eq("role", "admin");
  const recipients = ((data ?? []) as Array<{ email: string | null }>)
    .map((r) => r.email)
    .filter((e): e is string => !!e && e.trim().length > 0);
  if (recipients.length === 0) return;

  const subject =
    threshold === 100
      ? "Phone validation paused — monthly quota reached"
      : `Phone validation: ${threshold}% of monthly quota used`;

  const bodyIntro =
    threshold === 100
      ? "Your Phone Validation add-on has used 100% of this month's quota. New phone numbers added via import or contact-add will land as <strong>Not Verified</strong> and will not be screened against Veriphone until the cap is raised or the month resets."
      : `Your Phone Validation add-on has crossed <strong>${threshold}%</strong> of this month's quota. Validation continues normally — this is a heads-up so you can raise the cap before reaching it.`;

  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#0f1729;max-width:480px;margin:0 auto;padding:24px;">
  <h1 style="margin:0;font-size:20px;font-weight:600;color:#04261c;">${subject}</h1>
  <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">${bodyIntro}</p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">Used this month: <strong>${used.toLocaleString()} / ${cap.toLocaleString()}</strong></p>
  <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Settings &rarr; Billing &amp; Add-ons in the portal shows the live meter and lets you raise the cap or move to a paid Veriphone plan.</p>
</div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "bree@mossequitypartners.com",
      to: recipients,
      subject,
      html,
    });
  } catch (e) {
    console.error("[phone-validate] resend email failed:", e);
  }
}

// Validate a single phone for a given org. Pre-filters obvious junk via
// libphonenumber (free), then calls Veriphone if quota allows. Logs to
// org_addon_usage only when Veriphone actually consumed a credit.
export async function validatePhone(
  phoneRaw: string | null | undefined,
  orgId: string
): Promise<ValidationResult> {
  if (!phoneRaw || !phoneRaw.trim()) {
    return { status: "untested", provider: null, checkedAt: null, raw: null, phoneType: null, isDnc: null, isLitigator: null };
  }

  const parsed = parsePhoneNumberFromString(phoneRaw.trim(), "US");
  if (!parsed || !parsed.isValid()) {
    return {
      status: "invalid",
      provider: "libphonenumber",
      checkedAt: new Date().toISOString(),
      raw: { reason: "failed_libphonenumber" },
      phoneType: null,
      isDnc: null,
      isLitigator: null,
    };
  }
  const e164 = parsed.number;

  const sb = createServiceClient();
  const [cap, used] = await Promise.all([
    getQuotaCap(sb, orgId),
    getMonthUsage(sb, orgId),
  ]);
  if (used >= cap) {
    return {
      status: "untested",
      provider: null,
      checkedAt: null,
      raw: { reason: "quota_exhausted", cap, used },
      phoneType: null,
      isDnc: null,
      isLitigator: null,
    };
  }

  const apiKey = process.env.IPQS_API_KEY;
  if (!apiKey) {
    return {
      status: "untested",
      provider: null,
      checkedAt: null,
      raw: { reason: "missing_ipqs_key" },
      phoneType: null,
      isDnc: null,
      isLitigator: null,
    };
  }

  // IPQS Phone Validation API. URL format puts API key and phone in the path:
  // https://www.ipqualityscore.com/api/json/phone/<KEY>/<PHONE>
  // Strip the leading + from e164 since IPQS expects digits-only in the path.
  type IpqsBody = {
    success?: boolean;
    valid?: boolean;
    active?: boolean;
    active_status?: string;
    line_type?: string;
    carrier?: string;
    do_not_call?: boolean;
    tcpa_blacklist?: boolean;
    fraud_score?: number;
    message?: string;
    [k: string]: unknown;
  };
  let body: IpqsBody | null = null;
  let httpOk = false;
  let networkError: string | null = null;
  try {
    const phoneDigits = e164.replace(/^\+/, "");
    const url = `${IPQS_ENDPOINT_PREFIX}${apiKey}/${phoneDigits}`;
    const res = await fetch(url);
    httpOk = res.ok;
    body = (await res.json()) as IpqsBody;
  } catch (e) {
    networkError = e instanceof Error ? e.message : String(e);
  }

  const checkedAt = new Date().toISOString();
  const phoneType = mapIpqsLineType(body?.line_type);
  const isDnc = typeof body?.do_not_call === "boolean" ? body.do_not_call : null;
  const isLitigator = typeof body?.tcpa_blacklist === "boolean" ? body.tcpa_blacklist : null;

  // For "tried but couldn't verify" cases (network error, non-2xx, missing
  // fields), we set checkedAt so the row reflects that we attempted
  // validation — gives the UI something to show ("Checked [date], couldn't
  // verify") rather than indistinguishable from "never tried". The sweep
  // only skips rows when checkedAt is genuinely null.

  if (networkError) {
    return {
      status: "untested",
      provider: "ipqs",
      checkedAt,
      raw: { error: networkError },
      phoneType: null,
      isDnc: null,
      isLitigator: null,
    };
  }
  if (!httpOk || body?.success === false) {
    // 4xx/5xx, or IPQS returned success=false (e.g., quota exhausted on their
    // side, invalid key, or non-existent number).
    return { status: "untested", provider: "ipqs", checkedAt, raw: body, phoneType: null, isDnc: null, isLitigator: null };
  }
  // Format-level invalid: IPQS knows the number isn't real before we even
  // consider line status. Cheaper signal than line-status, so check first.
  if (body?.valid === false) {
    await logUsage(sb, orgId, { phone_e164: e164, result: "invalid_format" });
    return { status: "invalid", provider: "ipqs", checkedAt, raw: body, phoneType: null, isDnc, isLitigator };
  }
  // Line-status answer: `active` is the HLR-grade signal.
  if (body?.valid === true && body?.active === false) {
    await logUsage(sb, orgId, { phone_e164: e164, result: "invalid_inactive" });
    return { status: "invalid", provider: "ipqs", checkedAt, raw: body, phoneType, isDnc, isLitigator };
  }
  if (body?.valid === true && body?.active === true) {
    await logUsage(sb, orgId, { phone_e164: e164, result: "valid_active" });
    return { status: "valid", provider: "ipqs", checkedAt, raw: body, phoneType, isDnc, isLitigator };
  }
  // `active` came back null/undefined — IPQS couldn't determine the line
  // state. Don't claim valid or invalid; record we tried.
  return { status: "untested", provider: "ipqs", checkedAt, raw: body, phoneType, isDnc, isLitigator };
}

// Helpers for callers that need quota/usage info without performing validation
// (e.g., the Billing UI in Fix 6).
export async function getValidationUsage(orgId: string): Promise<{ used: number; cap: number; period_month: string }> {
  const sb = createServiceClient();
  const [cap, used] = await Promise.all([
    getQuotaCap(sb, orgId),
    getMonthUsage(sb, orgId),
  ]);
  return { used, cap, period_month: currentPeriodMonth() };
}

// Phone slot column bases on the relatives table — one row per relative,
// with up to 5 numbered phone slots.
const RELATIVE_PHONE_BASES = ["phone", "phone_2", "phone_3", "phone_4", "phone_5"] as const;
export type RelativePhoneBase = (typeof RELATIVE_PHONE_BASES)[number];

type PendingTask =
  | { kind: "contact"; rowId: string; phone: string; existingType: string | null }
  | { kind: "relative"; rowId: string; phone: string; base: RelativePhoneBase; existingType: string | null };

// Targeted validation: validate ONLY the contact/relative rows passed in.
// This is the function the import wizard and manual phone-add server actions
// call after inserting new rows — never sweeps existing untested rows.
// A row whose status is no longer 'untested' (already validated, manually
// overridden, etc.) is skipped, so calling this twice on the same ID is a
// safe no-op rather than a double-charge.
export async function validateSpecificPhones(
  orgId: string,
  targets: {
    contactIds?: string[];
    relativeSlots?: Array<{ relativeId: string; base: RelativePhoneBase }>;
  },
  opts: { concurrency?: number } = {}
): Promise<{ processed: number }> {
  const concurrency = opts.concurrency ?? 5;
  const contactIds = targets.contactIds ?? [];
  const relativeSlots = targets.relativeSlots ?? [];
  if (contactIds.length === 0 && relativeSlots.length === 0) {
    return { processed: 0 };
  }

  const sb = createServiceClient();
  const tasks: PendingTask[] = [];

  if (contactIds.length > 0) {
    const { data, error } = await sb
      .from("contacts")
      .select("id, value, phone_type, status, channel")
      .eq("org_id", orgId)
      .in("id", contactIds);
    if (error) console.error("[phone-validate] specific contacts query failed:", error);
    for (const c of (data ?? []) as Array<{
      id: string;
      value: string | null;
      phone_type: string | null;
      status: string;
      channel: string;
    }>) {
      if (c.channel === "phone" && c.status === "untested" && c.value) {
        tasks.push({ kind: "contact", rowId: c.id, phone: c.value, existingType: c.phone_type });
      }
    }
  }

  if (relativeSlots.length > 0) {
    const relativeIds = Array.from(new Set(relativeSlots.map((s) => s.relativeId)));
    const { data, error } = await sb
      .from("relatives")
      .select(
        "id, phone, phone_type, phone_status, phone_2, phone_2_type, phone_2_status, phone_3, phone_3_type, phone_3_status, phone_4, phone_4_type, phone_4_status, phone_5, phone_5_type, phone_5_status"
      )
      .eq("org_id", orgId)
      .in("id", relativeIds);
    if (error) console.error("[phone-validate] specific relatives query failed:", error);
    const rowById = new Map<string, Record<string, unknown>>();
    for (const r of (data ?? []) as Record<string, unknown>[]) {
      rowById.set(r.id as string, r);
    }
    for (const slot of relativeSlots) {
      const r = rowById.get(slot.relativeId);
      if (!r) continue;
      const value = r[slot.base] as string | null;
      const status = r[`${slot.base}_status`] as string | null;
      const existingType = (r[`${slot.base}_type`] as string | null) ?? null;
      if (value && status === "untested") {
        tasks.push({ kind: "relative", rowId: slot.relativeId, phone: value, base: slot.base, existingType });
      }
    }
  }

  console.log(
    `[phone-validate] specific org=${orgId}: ${tasks.length} phones (` +
      `${tasks.filter((t) => t.kind === "contact").length} contacts, ` +
      `${tasks.filter((t) => t.kind === "relative").length} relative slots)`
  );

  let processed = 0;
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (task) => {
        const result = await validatePhone(task.phone, orgId);
        if (result.status === "untested" && result.checkedAt === null) return;
        const shouldFillType = !task.existingType && result.phoneType;
        if (task.kind === "contact") {
          const update: Record<string, unknown> = {
            status: result.status,
            validation_checked_at: result.checkedAt,
            validation_provider: result.provider,
            validation_raw: result.raw as object,
          };
          if (shouldFillType) update.phone_type = result.phoneType;
          await sb.from("contacts").update(update).eq("id", task.rowId);
        } else {
          const update: Record<string, unknown> = {
            [`${task.base}_status`]: result.status,
            [`${task.base}_validation_checked_at`]: result.checkedAt,
            [`${task.base}_validation_provider`]: result.provider,
            [`${task.base}_validation_raw`]: result.raw as object,
          };
          if (shouldFillType) update[`${task.base}_type`] = result.phoneType;
          await sb.from("relatives").update(update).eq("id", task.rowId);
        }
        processed += 1;
      })
    );
  }

  return { processed };
}

// Explicit backfill — sweeps every untested phone in the org. Never called
// from import or upsert paths (those use validateSpecificPhones for the IDs
// they just inserted). Wire this to a dedicated "Run Backfill" button so the
// spend is always intentional. excludeLostLeads is on by default — skip
// phones on leads the user has already given up on.
export async function validateAllUntestedForOrg(
  orgId: string,
  opts: { maxItems?: number; concurrency?: number; excludeLostLeads?: boolean } = {}
): Promise<{ processed: number; pending: number }> {
  const maxItems = opts.maxItems ?? 10000;
  const concurrency = opts.concurrency ?? 5;
  const excludeLostLeads = opts.excludeLostLeads ?? true;
  const sb = createServiceClient();

  // For the non-lost filter we use a Postgres-style embedded join: ask for
  // leads!inner(stage) and filter on the joined stage column. PostgREST does
  // the join server-side, so we avoid round-tripping a giant lead-id list.
  let contactsQuery = sb
    .from("contacts")
    .select(
      excludeLostLeads
        ? "id, value, phone_type, leads!inner(stage)"
        : "id, value, phone_type"
    )
    .eq("org_id", orgId)
    .eq("channel", "phone")
    .eq("status", "untested")
    .not("value", "is", null)
    .limit(maxItems);
  if (excludeLostLeads) contactsQuery = contactsQuery.neq("leads.stage", "lost");
  const contactsRes = await contactsQuery;
  if (contactsRes.error) {
    console.error("[phone-validate] contacts query failed:", contactsRes.error);
  }

  let relativesQuery = sb
    .from("relatives")
    .select(
      excludeLostLeads
        ? "id, phone, phone_type, phone_status, phone_2, phone_2_type, phone_2_status, phone_3, phone_3_type, phone_3_status, phone_4, phone_4_type, phone_4_status, phone_5, phone_5_type, phone_5_status, leads!inner(stage)"
        : "id, phone, phone_type, phone_status, phone_2, phone_2_type, phone_2_status, phone_3, phone_3_type, phone_3_status, phone_4, phone_4_type, phone_4_status, phone_5, phone_5_type, phone_5_status"
    )
    .eq("org_id", orgId)
    .or(
      "phone_status.eq.untested,phone_2_status.eq.untested,phone_3_status.eq.untested,phone_4_status.eq.untested,phone_5_status.eq.untested"
    )
    .limit(maxItems);
  if (excludeLostLeads) relativesQuery = relativesQuery.neq("leads.stage", "lost");
  const relativesRes = await relativesQuery;
  if (relativesRes.error) {
    console.error("[phone-validate] relatives query failed:", relativesRes.error);
  }

  const tasks: PendingTask[] = [];
  // The leads!inner(stage) join confuses the supabase-js generic type
  // inference; cast through unknown so the runtime shape we expect is what
  // we get.
  for (const c of ((contactsRes.data ?? []) as unknown) as Array<{ id: string; value: string | null; phone_type: string | null }>) {
    if (c.value) tasks.push({ kind: "contact", rowId: c.id, phone: c.value, existingType: c.phone_type });
  }
  for (const r of ((relativesRes.data ?? []) as unknown) as Record<string, unknown>[]) {
    const rowId = r.id as string;
    for (const base of RELATIVE_PHONE_BASES) {
      const value = r[base] as string | null;
      const status = r[`${base}_status`] as string | null;
      const existingType = (r[`${base}_type`] as string | null) ?? null;
      if (value && status === "untested") {
        tasks.push({ kind: "relative", rowId, phone: value, base, existingType });
      }
    }
  }

  const limited = tasks.slice(0, maxItems);
  let processed = 0;
  console.log(
    `[phone-validate] sweep org=${orgId}: ${tasks.length} pending phones ` +
      `(${tasks.filter((t) => t.kind === "contact").length} contacts, ` +
      `${tasks.filter((t) => t.kind === "relative").length} relative slots)`
  );

  for (let i = 0; i < limited.length; i += concurrency) {
    const batch = limited.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (task) => {
        const result = await validatePhone(task.phone, orgId);
        // Transient errors / quota-exhausted come back as untested w/ null
        // checkedAt; leave those rows alone so the next sweep retries them.
        if (result.status === "untested" && result.checkedAt === null) return;
        // Auto-fill phone type from Veriphone IFF the row doesn't already have
        // one — never override a manual choice.
        const shouldFillType = !task.existingType && result.phoneType;
        if (task.kind === "contact") {
          const update: Record<string, unknown> = {
            status: result.status,
            validation_checked_at: result.checkedAt,
            validation_provider: result.provider,
            validation_raw: result.raw as object,
          };
          if (shouldFillType) update.phone_type = result.phoneType;
          await sb.from("contacts").update(update).eq("id", task.rowId);
        } else {
          const update: Record<string, unknown> = {
            [`${task.base}_status`]: result.status,
            [`${task.base}_validation_checked_at`]: result.checkedAt,
            [`${task.base}_validation_provider`]: result.provider,
            [`${task.base}_validation_raw`]: result.raw as object,
          };
          if (shouldFillType) update[`${task.base}_type`] = result.phoneType;
          await sb.from("relatives").update(update).eq("id", task.rowId);
        }
        processed += 1;
      })
    );
  }

  return { processed, pending: tasks.length - processed };
}
