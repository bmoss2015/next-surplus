import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Resend } from "resend";
import { createServiceClient } from "./supabase/service";
import { renderEmailShell, escapeHtml } from "./email-template";

// Clearout Phone — pay-as-you-go credit pool, no monthly auto-reset.
// Default cap matches a fresh 5,000-credit top-up. Override per-org via
// app_settings key='phone_validation_quota_cap' whenever a new bundle is
// purchased (Clearout doesn't auto-recharge — the user tops off manually,
// then updates the cap here so the meter reflects the new balance).
// PAYG price is $0.007/credit at 5k; $0.0058 at 10k. Monthly subscription
// shaves 10%, annual 20%. Override per-org via app_settings key
// 'phone_validation_unit_cost_cents' (integer cents, default 70 = $0.0070).
const DEFAULT_QUOTA_CAP = 5000;
const CLEAROUT_ENDPOINT = "https://api.clearoutphone.io/v1/phonenumber/validate";
const ADDON_KEY = "phone_validation";

// Master kill switch. When PHONE_VALIDATION_ENABLED is set to anything other
// than "true" (case-insensitive), every validation entry point short-circuits
// to a no-op untested result. Lets us pause spend without ripping out the
// code — flip the env var back to "true" once a real disconnect-detection
// provider is wired up. Default is OFF: validation has to be explicitly
// turned on, so a forgotten redeploy or a fresh env doesn't quietly start
// burning credits.
export function isPhoneValidationEnabled(): boolean {
  const raw = process.env.PHONE_VALIDATION_ENABLED;
  return typeof raw === "string" && raw.trim().toLowerCase() === "true";
}

function disabledResult(): ValidationResult {
  return {
    status: "untested",
    provider: null,
    checkedAt: null,
    raw: { reason: "validation_disabled" },
    phoneType: null,
  };
}
// Pay-as-you-go rate Bree confirmed: $35 / 5,000 = $0.0070 per credit.
// Override via env CLEAROUT_COST_PER_CREDIT_USD when moving to monthly
// (10% off → 0.0063) or annual (20% off → 0.0056) so the Billing meter's
// "Spent This Month" reflects what's actually getting charged.
//
// FUTURE: when there are multiple paying orgs on the portal, lift this to
// per-org app_settings instead of an env var.
function parseCostFromEnv(): number {
  const raw = process.env.CLEAROUT_COST_PER_CREDIT_USD;
  if (!raw) return 0.007;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0.007;
}
export const DEFAULT_CREDIT_COST_USD = parseCostFromEnv();

export type ValidationStatus = "valid" | "invalid" | "untested";

export type ValidationResult = {
  status: ValidationStatus;
  provider: string | null;
  checkedAt: string | null;
  raw: unknown;
  // Mapped from Clearout's line_type — caller decides whether to overwrite
  // an existing phone_type on the row. Null when Clearout didn't return one
  // (invalid number, network error, etc.).
  phoneType: string | null;
};

// Map Clearout's line_type strings to the portal's display values. Anything
// unmapped (toll_free, satellite, etc.) returns null so we leave the
// existing phone_type column alone.
function mapClearoutLineType(t: unknown): string | null {
  if (t === "mobile") return "Mobile";
  if (t === "landline") return "Landline";
  if (t === "voip") return "Mobile";
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

// Credits consumed against the current credit pool. Sums ALL historical
// usage rows — Clearout PAYG doesn't auto-reset monthly, so we treat the
// meter as a running balance against `phone_validation_quota_cap`. When the
// user tops off at Clearout they bump the cap and the meter re-headrooms.
async function getTotalCreditsUsed(sb: ServiceClient, orgId: string): Promise<number> {
  // Filter to provider='clearout' so legacy usage rows from prior providers
  // don't pollute the count — would otherwise fire threshold alerts at
  // boot for orgs migrating in and inflate the "Validations All-Time" stat.
  const { data } = await sb
    .from("org_addon_usage")
    .select("units")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY)
    .filter("metadata->>provider", "eq", "clearout");
  if (!data) return 0;
  return data.reduce((sum, row) => sum + (row.units ?? 0), 0);
}

async function logUsage(
  sb: ServiceClient,
  orgId: string,
  units: number,
  metadata: Record<string, unknown>
): Promise<void> {
  await sb.from("org_addon_usage").insert({
    org_id: orgId,
    addon_key: ADDON_KEY,
    units,
    // Per-row cost is intentionally 0 — Clearout PAYG rate sits below 1¢
    // and the unit_cost_cents column is integer cents, so storing it here
    // would round to zero anyway. The Billing meter renders dollars from
    // total units × the current per-credit rate instead.
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
  const [cap, used] = await Promise.all([getQuotaCap(sb, orgId), getTotalCreditsUsed(sb, orgId)]);
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

  const remaining = Math.max(0, cap - used);
  const subject =
    threshold === 100
      ? "Phone validation paused — credit balance exhausted"
      : `Phone validation: ${threshold}% of credit balance used`;

  const bodyIntro =
    threshold === 100
      ? "Your Phone Validation add-on has consumed 100% of its credit balance. New phone numbers added via import or contact-add will land as <strong>Not Verified</strong> and will not be screened until more credits are added. The add-on does not auto-recharge."
      : `Your Phone Validation add-on has consumed <strong>${threshold}%</strong> of its credit balance. Validation continues normally. This is a heads-up so you can add more credits before hitting zero. <strong>${remaining.toLocaleString()}</strong> credits remaining.`;

  const bodyHtml = `
    <h1 style="margin:0;font-size:20px;font-weight:600;color:#1a1a1a;">${escapeHtml(subject)}</h1>
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">${bodyIntro}</p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">Credits used: <strong>${used.toLocaleString()} / ${cap.toLocaleString()}</strong></p>
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5a5a5a;">Open Settings &rsaquo; Billing in the portal to see the live meter and add more credits.</p>
  `;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Next Surplus <noreply@nextsurplus.com>",
      to: recipients,
      subject,
      html: renderEmailShell({ subject, bodyHtml }),
    });
  } catch (e) {
    console.error("[phone-validate] resend email failed:", e);
  }
}

// Validate a single phone for a given org. Pre-filters obvious junk via
// libphonenumber (free), then calls Clearout Phone if credit balance allows.
// Logs to org_addon_usage only when Clearout actually billed credits — the
// units logged match `billable_credits` from the response so Smart Validation
// (1-5 credits per call) is metered accurately.
export async function validatePhone(
  phoneRaw: string | null | undefined,
  orgId: string
): Promise<ValidationResult> {
  if (!isPhoneValidationEnabled()) return disabledResult();
  if (!phoneRaw || !phoneRaw.trim()) {
    return { status: "untested", provider: null, checkedAt: null, raw: null, phoneType: null };
  }

  const parsed = parsePhoneNumberFromString(phoneRaw.trim(), "US");
  if (!parsed || !parsed.isValid()) {
    return {
      status: "invalid",
      provider: "libphonenumber",
      checkedAt: new Date().toISOString(),
      raw: { reason: "failed_libphonenumber" },
      phoneType: null,
    };
  }
  const e164 = parsed.number;

  const sb = createServiceClient();

  // Cache check before spending a credit: if this exact E.164 was validated
  // to a definitive result in the last 90 days, reuse that. Saves credits
  // on cross-lead dupes, accidental re-adds, and import overlap.
  const cached = await findCachedValidation(sb, orgId, e164);
  if (cached) return cached;

  // Note: we used to pre-check `local_usage_count >= cap` here as a quota
  // gate. That broke after a provider swap because the local usage count
  // included pre-migration rows that had nothing to do with the live
  // balance, so rows silently stayed "Not Verified" even with thousands of
  // credits actually available. The fix is to let the provider be the
  // source of truth: if credits are really gone, the upstream call
  // returns an error and we surface that as a transient untested state.
  // The threshold-alert plumbing still warns at 80/95/100% based on the
  // live remaining balance.

  const apiKey = process.env.CLEAROUT_PHONE_API_KEY;
  if (!apiKey) {
    return {
      status: "untested",
      provider: null,
      checkedAt: null,
      raw: { reason: "missing_clearout_key" },
      phoneType: null,
    };
  }

  // Clearout response shape (success):
  //   { status: 'success', data: { status: 'valid'|'invalid'|'unknown',
  //       line_type: 'mobile'|'landline'|'voip'|'',
  //       carrier, location, e164_format, billable_credits, ... } }
  // Errors come back with { status: 'failure', error: {...} }.
  type ClearoutData = {
    status?: string;
    line_type?: string;
    carrier?: string;
    billable_credits?: string | number;
    [k: string]: unknown;
  };
  type ClearoutBody = { status?: string; data?: ClearoutData; error?: unknown; [k: string]: unknown };

  let body: ClearoutBody | null = null;
  let httpOk = false;
  let networkError: string | null = null;
  let attempts = 0;
  // Retry transient failures (network errors, 5xx, 429) with exponential
  // backoff: 250ms, 500ms, 1000ms. 4xx other than 429 means the request is
  // bad — no retry, just fall through and the row stays untested. Only the
  // FINAL response is logged + returned, so cache + usage accounting stays
  // correct (one credit per real billable call).
  const MAX_ATTEMPTS = 3;
  const backoffMs = [250, 500, 1000];
  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;
    networkError = null;
    httpOk = false;
    body = null;
    let status = 0;
    try {
      const res = await fetch(CLEAROUT_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ number: e164, country_code: "US" }),
      });
      status = res.status;
      httpOk = res.ok;
      body = (await res.json()) as ClearoutBody;
    } catch (e) {
      networkError = e instanceof Error ? e.message : String(e);
    }
    const transient = !!networkError || status >= 500 || status === 429;
    if (!transient || attempts >= MAX_ATTEMPTS) break;
    const delay = backoffMs[attempts - 1] ?? 1000;
    await new Promise((r) => setTimeout(r, delay));
  }

  const checkedAt = new Date().toISOString();
  const data = body?.data;
  const phoneType = mapClearoutLineType(data?.line_type);
  const billed = Number(data?.billable_credits ?? 0);
  const units = Number.isFinite(billed) && billed > 0 ? Math.round(billed) : 1;

  // "Tried but couldn't verify" cases (network error, non-2xx, unknown)
  // still set checkedAt so the row reflects that we attempted validation —
  // the UI shows "Checked [date], couldn't verify" rather than leaving it
  // indistinguishable from "never tried". The sweep only skips rows when
  // checkedAt is genuinely null.

  if (networkError) {
    return {
      status: "untested",
      provider: "clearout",
      checkedAt,
      raw: { error: networkError },
      phoneType: null,
    };
  }
  if (!httpOk || body?.status !== "success" || !data) {
    return { status: "untested", provider: "clearout", checkedAt, raw: body, phoneType: null };
  }
  // Stamp `provider: 'clearout'` on every metered row so threshold alerts
  // and Billing meter stats can filter out pre-migration usage from prior
  // providers and only count what's actually been spent here.
  if (data.status === "valid") {
    await logUsage(sb, orgId, units, { phone_e164: e164, result: "valid", line_type: data.line_type, provider: "clearout" });
    return { status: "valid", provider: "clearout", checkedAt, raw: body, phoneType };
  }
  if (data.status === "invalid") {
    await logUsage(sb, orgId, units, { phone_e164: e164, result: "invalid", provider: "clearout" });
    return { status: "invalid", provider: "clearout", checkedAt, raw: body, phoneType };
  }
  // status === 'unknown' — Clearout still bills credits for unknowns, so log
  // them too, but the row stays untested-with-checkedAt so the sweep won't
  // re-burn credits on the same number.
  await logUsage(sb, orgId, units, { phone_e164: e164, result: "unknown", provider: "clearout" });
  return { status: "untested", provider: "clearout", checkedAt, raw: body, phoneType: null };
}

// Live balance pull from Clearout. The /getcredits endpoint is free (doesn't
// consume a credit) so we hit it on every Settings page load — keeps the
// meter honest when the user tops off at clearoutphone.io without ever
// having to bump a value in app_settings. Returns null on any failure
// (missing key, network error, non-2xx) so callers can fall back gracefully.
async function getClearoutBalance(): Promise<number | null> {
  const apiKey = process.env.CLEAROUT_PHONE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.clearoutphone.io/v1/phonenumber/getcredits", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      // Don't let a slow Clearout call freeze the Settings page render.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { status?: string; data?: { available_credits?: number } };
    if (body.status !== "success") return null;
    const n = body.data?.available_credits;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

// Org-wide validation cache: if a phone has been validated to a definitive
// result (valid/invalid) within the staleness window, reuse that result
// instead of calling the provider again. Saves credits when the same number
// shows up on a different lead or gets re-added to the same one.
//
// 90-day staleness window — surplus-recovery cold-call lists go stale fast
// (numbers get disconnected). Older results trigger a fresh validation so we
// don't show a stale "Verified" on a now-dead line. Returns null on miss.
async function findCachedValidation(
  sb: ServiceClient,
  orgId: string,
  e164: string
): Promise<ValidationResult | null> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  // PERF FUTURE: JSON path filters here (metadata->>phone_e164,
  // metadata->>provider) are not indexed. At ~10k+ Clearout-era usage rows
  // per org this becomes a tablescan and adds ~100ms+ per save. Fix is a
  // GIN index migration on org_addon_usage.metadata when it bites.
  const { data, error } = await sb
    .from("org_addon_usage")
    .select("created_at, metadata")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY)
    .gte("created_at", ninetyDaysAgo)
    .filter("metadata->>phone_e164", "eq", e164)
    .filter("metadata->>provider", "eq", "clearout")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const row = data[0] as { created_at: string; metadata: Record<string, unknown> | null };
  const m = row.metadata ?? {};
  const result = m.result;
  if (result !== "valid" && result !== "invalid") return null;
  const lineType = (m.line_type as string | null | undefined) ?? null;
  return {
    status: result === "valid" ? "valid" : "invalid",
    provider: "clearout-cache",
    checkedAt: row.created_at,
    raw: {
      cached: true,
      original_validated_at: row.created_at,
      line_type: lineType,
      e164,
    },
    phoneType: lineType ? mapClearoutLineType(lineType) : null,
  };
}

// Sums org_addon_usage units inside the current calendar month, gives the
// Billing meter a "this billing cycle's spend" figure independent of the
// running Clearout balance.
async function getMonthCreditsUsed(sb: ServiceClient, orgId: string): Promise<number> {
  // Same provider filter as getTotalCreditsUsed: only count Clearout-era
  // rows so "Spent This Month" reflects what's actually been charged.
  const { data } = await sb
    .from("org_addon_usage")
    .select("units")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY)
    .eq("period_month", currentPeriodMonth())
    .filter("metadata->>provider", "eq", "clearout");
  if (!data) return 0;
  return data.reduce((sum, row) => sum + (row.units ?? 0), 0);
}

// Billing UI's source of truth. `remainingCredits` is pulled live from
// Clearout when possible — that means a top-off at clearoutphone.io shows up
// in the portal meter immediately, no manual reconciliation needed. When
// Clearout is unreachable, `remainingCredits` is null and the UI falls back
// to the older cap-minus-used calculation against app_settings.
export type ValidationUsageSummary = {
  remainingCredits: number | null;
  usedThisMonth: number;
  usedAllTime: number;
  fallbackCap: number;
  source: "clearout_live" | "fallback";
};

export async function getValidationUsage(orgId: string): Promise<ValidationUsageSummary> {
  const sb = createServiceClient();
  const [remaining, usedThisMonth, usedAllTime, fallbackCap] = await Promise.all([
    getClearoutBalance(),
    getMonthCreditsUsed(sb, orgId),
    getTotalCreditsUsed(sb, orgId),
    getQuotaCap(sb, orgId),
  ]);
  return {
    remainingCredits: remaining,
    usedThisMonth,
    usedAllTime,
    fallbackCap,
    source: remaining !== null ? "clearout_live" : "fallback",
  };
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
  if (!isPhoneValidationEnabled()) return { processed: 0 };
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

  // Dedup by E.164: same phone repeated across contacts + relatives (very
  // common in skip-trace data) is validated ONCE against Clearout. The
  // single result fans out to every row that shares that number. Tasks
  // whose phone can't be normalized are kept as their own bucket so the
  // libphonenumber pre-filter still rejects them per-row.
  const buckets = new Map<string, PendingTask[]>();
  for (const t of tasks) {
    const parsed = parsePhoneNumberFromString(t.phone.trim(), "US");
    const key = parsed && parsed.isValid() ? parsed.number : `raw:${t.phone}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(t);
    else buckets.set(key, [t]);
  }

  const uniquePhones = buckets.size;
  console.log(
    `[phone-validate] specific org=${orgId}: ${tasks.length} rows -> ${uniquePhones} unique phones (` +
      `${tasks.filter((t) => t.kind === "contact").length} contacts, ` +
      `${tasks.filter((t) => t.kind === "relative").length} relative slots)`
  );

  let processed = 0;
  const entries = Array.from(buckets.entries());
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async ([, rows]) => {
        // Validate the phone once using the first row's value (every row in
        // the bucket has the same E.164 by construction).
        const result = await validatePhone(rows[0].phone, orgId);
        if (result.status === "untested" && result.checkedAt === null) return;
        // Fan the same result out to every row in the bucket. Provider's
        // line_type ALWAYS wins over an existing phone_type — CSV-imported
        // types are stale (numbers port carriers and line types) and the
        // whole point of paying for HLR-grade validation is to get
        // authoritative carrier data. The "user manually picked a type via
        // pencil-edit" case is preserved because pencil edits don't reset
        // status to untested, so validation doesn't re-fire on them.
        for (const task of rows) {
          if (task.kind === "contact") {
            const update: Record<string, unknown> = {
              status: result.status,
              validation_checked_at: result.checkedAt,
              validation_provider: result.provider,
              validation_raw: result.raw as object,
            };
            if (result.phoneType) update.phone_type = result.phoneType;
            await sb.from("contacts").update(update).eq("id", task.rowId);
          } else {
            const update: Record<string, unknown> = {
              [`${task.base}_status`]: result.status,
              [`${task.base}_validation_checked_at`]: result.checkedAt,
              [`${task.base}_validation_provider`]: result.provider,
              [`${task.base}_validation_raw`]: result.raw as object,
            };
            if (result.phoneType) update[`${task.base}_type`] = result.phoneType;
            await sb.from("relatives").update(update).eq("id", task.rowId);
          }
          processed += 1;
        }
      })
    );
  }

  return { processed };
}

// Dry-run version of the backfill that returns how many UNIQUE phones the
// sweep would actually send to Clearout (after libphonenumber pre-filtering
// + E.164 dedup), without consuming a single credit. Powers the pre-count
// confirmation modal on the Run Backfill button so the user sees the
// real cost before committing.
export async function previewBackfillCount(
  orgId: string,
  opts: { excludeLostLeads?: boolean } = {}
): Promise<{ uniquePhones: number; totalRows: number }> {
  if (!isPhoneValidationEnabled()) return { uniquePhones: 0, totalRows: 0 };
  const excludeLostLeads = opts.excludeLostLeads ?? true;
  const sb = createServiceClient();

  let contactsQuery = sb
    .from("contacts")
    .select(
      excludeLostLeads
        ? "id, value, leads!inner(stage)"
        : "id, value"
    )
    .eq("org_id", orgId)
    .eq("channel", "phone")
    .eq("status", "untested")
    .not("value", "is", null);
  if (excludeLostLeads) contactsQuery = contactsQuery.neq("leads.stage", "lost");
  const contactsRes = await contactsQuery;

  let relativesQuery = sb
    .from("relatives")
    .select(
      excludeLostLeads
        ? "phone, phone_status, phone_2, phone_2_status, phone_3, phone_3_status, phone_4, phone_4_status, phone_5, phone_5_status, leads!inner(stage)"
        : "phone, phone_status, phone_2, phone_2_status, phone_3, phone_3_status, phone_4, phone_4_status, phone_5, phone_5_status"
    )
    .eq("org_id", orgId)
    .or(
      "phone_status.eq.untested,phone_2_status.eq.untested,phone_3_status.eq.untested,phone_4_status.eq.untested,phone_5_status.eq.untested"
    );
  if (excludeLostLeads) relativesQuery = relativesQuery.neq("leads.stage", "lost");
  const relativesRes = await relativesQuery;

  const phones: string[] = [];
  for (const c of ((contactsRes.data ?? []) as unknown) as Array<{ value: string | null }>) {
    if (c.value) phones.push(c.value);
  }
  for (const r of ((relativesRes.data ?? []) as unknown) as Record<string, unknown>[]) {
    for (const base of RELATIVE_PHONE_BASES) {
      const value = r[base] as string | null;
      const status = r[`${base}_status`] as string | null;
      if (value && status === "untested") phones.push(value);
    }
  }

  // Apply the same E.164 dedup the real sweep uses so the preview matches
  // the actual credit cost exactly.
  const unique = new Set<string>();
  for (const p of phones) {
    const parsed = parsePhoneNumberFromString(p.trim(), "US");
    if (parsed && parsed.isValid()) unique.add(parsed.number);
    // Bad-format numbers won't reach Clearout (libphonenumber rejects them),
    // so we don't count them toward the credit estimate.
  }

  return { uniquePhones: unique.size, totalRows: phones.length };
}

// Explicit backfill: sweeps every untested phone in the org. Never called
// from import or upsert paths (those use validateSpecificPhones for the IDs
// they just inserted). Wire this to a dedicated "Run Backfill" button so the
// spend is always intentional. excludeLostLeads is on by default; skip
// phones on leads the user has already given up on.
export async function validateAllUntestedForOrg(
  orgId: string,
  opts: { maxItems?: number; concurrency?: number; excludeLostLeads?: boolean } = {}
): Promise<{ processed: number; pending: number }> {
  if (!isPhoneValidationEnabled()) return { processed: 0, pending: 0 };
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

  // Dedup by E.164 before slicing — the maxItems budget counts UNIQUE phones,
  // not rows. Same number repeated across rows is a single Clearout call
  // that updates every row that shares it.
  const buckets = new Map<string, PendingTask[]>();
  for (const t of tasks) {
    const parsed = parsePhoneNumberFromString(t.phone.trim(), "US");
    const key = parsed && parsed.isValid() ? parsed.number : `raw:${t.phone}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(t);
    else buckets.set(key, [t]);
  }

  const allEntries = Array.from(buckets.entries());
  const entries = allEntries.slice(0, maxItems);
  let processed = 0;
  console.log(
    `[phone-validate] sweep org=${orgId}: ${tasks.length} rows -> ${allEntries.length} unique phones ` +
      `(${tasks.filter((t) => t.kind === "contact").length} contacts, ` +
      `${tasks.filter((t) => t.kind === "relative").length} relative slots)`
  );

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async ([, rows]) => {
        const result = await validatePhone(rows[0].phone, orgId);
        // Transient errors / quota-exhausted come back as untested w/ null
        // checkedAt; leave those rows alone so the next sweep retries them.
        if (result.status === "untested" && result.checkedAt === null) return;
        // Fan the single Clearout result out to every row sharing this
        // number. Provider's line_type ALWAYS wins over an existing
        // phone_type — CSV-imported types are stale and the whole point
        // of paying for HLR-grade validation is to get authoritative
        // carrier data. Pencil-edit-only changes don't trigger
        // re-validation (they don't reset status to untested), so they're
        // preserved.
        for (const task of rows) {
          if (task.kind === "contact") {
            const update: Record<string, unknown> = {
              status: result.status,
              validation_checked_at: result.checkedAt,
              validation_provider: result.provider,
              validation_raw: result.raw as object,
            };
            if (result.phoneType) update.phone_type = result.phoneType;
            await sb.from("contacts").update(update).eq("id", task.rowId);
          } else {
            const update: Record<string, unknown> = {
              [`${task.base}_status`]: result.status,
              [`${task.base}_validation_checked_at`]: result.checkedAt,
              [`${task.base}_validation_provider`]: result.provider,
              [`${task.base}_validation_raw`]: result.raw as object,
            };
            if (result.phoneType) update[`${task.base}_type`] = result.phoneType;
            await sb.from("relatives").update(update).eq("id", task.rowId);
          }
          processed += 1;
        }
      })
    );
  }

  return { processed, pending: tasks.length - processed };
}
