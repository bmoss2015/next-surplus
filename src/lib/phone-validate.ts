import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Resend } from "resend";
import { createServiceClient } from "./supabase/service";

// HLR Lookup — pay-as-you-go credit pool, no monthly auto-reset.
// Per-credit rate is $0.006. A US mobile live-status check costs 2 credits
// ($0.012) because we pass `usa_status: "YES"` to get the real LIVE/DEAD
// result instead of the cheap allocation-only check. US landlines come
// back free (0 credits) with the line type identified so we can render
// them without claiming false validation. Override per-org cap via
// app_settings key='phone_validation_quota_cap'.
const DEFAULT_QUOTA_CAP = 5000;
const HLR_ENDPOINT = "https://api.hlrlookup.com/apiv2/hlr";
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
// HLR Lookup PAYG rate: $0.006 per credit. A US mobile live-status check
// burns 2 credits = $0.012/call. Landlines and bad-format numbers cost 0.
// Override via env HLR_COST_PER_CREDIT_USD if billing tier changes.
function parseCostFromEnv(): number {
  const raw = process.env.HLR_COST_PER_CREDIT_USD;
  if (!raw) return 0.006;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0.006;
}
export const DEFAULT_CREDIT_COST_USD = parseCostFromEnv();

export type ValidationStatus = "valid" | "invalid" | "untested";

export type ValidationResult = {
  status: ValidationStatus;
  provider: string | null;
  checkedAt: string | null;
  raw: unknown;
  // Mapped from the provider's line type. Caller decides whether to
  // overwrite an existing phone_type on the row. Null when no line type
  // could be determined (bad format, network error, etc.).
  phoneType: string | null;
};

// Map HLR Lookup's telephone_number_type to portal display values.
function mapHlrLineType(t: unknown): string | null {
  if (t === "MOBILE") return "Mobile";
  if (t === "LANDLINE") return "Landline";
  if (t === "VOIP") return "VoIP";
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

// Credits consumed against the current credit pool. Sums historical usage
// rows tagged provider='hlr-lookup' so legacy rows from prior providers
// don't pollute the count.
async function getTotalCreditsUsed(sb: ServiceClient, orgId: string): Promise<number> {
  const { data } = await sb
    .from("org_addon_usage")
    .select("units")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY)
    .filter("metadata->>provider", "eq", "hlr-lookup");
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

  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#0f1729;max-width:480px;margin:0 auto;padding:24px;">
  <h1 style="margin:0;font-size:20px;font-weight:600;color:#0d4b3a;">${subject}</h1>
  <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">${bodyIntro}</p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">Credits used: <strong>${used.toLocaleString()} / ${cap.toLocaleString()}</strong></p>
  <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Open Settings &rsaquo; Billing in the portal to see the live meter and add more credits.</p>
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

  const apiKey = process.env.HLR_API_KEY;
  const apiSecret = process.env.HLR_API_SECRET;
  if (!apiKey || !apiSecret) {
    return {
      status: "untested",
      provider: null,
      checkedAt: null,
      raw: { reason: "missing_hlr_credentials" },
      phoneType: null,
    };
  }

  // HLR Lookup v2 response shape (success):
  //   { results: [{
  //       error: "NONE" | "<error_code>",
  //       credits_spent: 0 | 1 | 2,
  //       telephone_number_type: "MOBILE" | "LANDLINE" | "VOIP" | "BAD_FORMAT" | ...,
  //       live_status: "LIVE" | "DEAD" | "ABSENT_SUBSCRIBER" |
  //                    "NO_TELESERVICE_PROVISIONED" | "INCONCLUSIVE" |
  //                    "NOT_AVAILABLE_NETWORK_ONLY" | "NOT_APPLICABLE",
  //       original_network_details: { name, country_iso3, area, ... },
  //       current_network_details: { name, country_iso3, ... },
  //       is_ported: "YES" | "NO" | "UNKNOWN", ...
  //   }] }
  // usa_status:"YES" is what unlocks the real LIVE/DEAD signal for US mobile
  // (costs an extra credit, so US mobile lookup = 2 credits = $0.012).
  // Landlines come back free with telephone_number_type identified.
  type HlrResult = {
    error?: string;
    credits_spent?: number;
    telephone_number_type?: string;
    live_status?: string;
    detected_telephone_number?: string;
    original_network_details?: Record<string, unknown>;
    current_network_details?: Record<string, unknown>;
    is_ported?: string;
    [k: string]: unknown;
  };
  type HlrBody = { results?: HlrResult[]; statusCode?: number; error?: unknown; [k: string]: unknown };

  let body: HlrBody | null = null;
  let httpOk = false;
  let networkError: string | null = null;
  let attempts = 0;
  // Retry transient failures (network errors, 5xx, 429) with exponential
  // backoff: 250ms, 500ms, 1000ms. 4xx other than 429 means the request is
  // bad — no retry. Only the FINAL response is logged + returned so usage
  // accounting stays correct (one charge per real billable call).
  const MAX_ATTEMPTS = 3;
  const backoffMs = [250, 500, 1000];
  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;
    networkError = null;
    httpOk = false;
    body = null;
    let status = 0;
    try {
      const res = await fetch(HLR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          requests: [
            {
              // Strip the leading + because HLR Lookup expects digits only.
              telephone_number: e164.replace(/^\+/, ""),
              usa_status: "YES",
            },
          ],
        }),
      });
      status = res.status;
      httpOk = res.ok;
      body = (await res.json()) as HlrBody;
    } catch (e) {
      networkError = e instanceof Error ? e.message : String(e);
    }
    const transient = !!networkError || status >= 500 || status === 429;
    if (!transient || attempts >= MAX_ATTEMPTS) break;
    const delay = backoffMs[attempts - 1] ?? 1000;
    await new Promise((r) => setTimeout(r, delay));
  }

  const checkedAt = new Date().toISOString();
  const result = body?.results?.[0];
  const phoneType = mapHlrLineType(result?.telephone_number_type);
  const credits = Number(result?.credits_spent ?? 0);
  const units = Number.isFinite(credits) && credits > 0 ? Math.round(credits) : 0;

  // "Tried but couldn't verify" cases (network error, non-2xx, inconclusive)
  // set checkedAt so the row reflects we attempted validation. The sweep
  // only skips rows when checkedAt is genuinely null.

  if (networkError) {
    return {
      status: "untested",
      provider: "hlr-lookup",
      checkedAt,
      raw: { error: networkError },
      phoneType: null,
    };
  }
  if (!httpOk || !result || result.error !== "NONE") {
    return { status: "untested", provider: "hlr-lookup", checkedAt, raw: body, phoneType: null };
  }

  const liveStatus = result.live_status;
  const lineType = result.telephone_number_type;

  // Map HLR Lookup's status enum to portal's three-state status. Landlines
  // and bad-format numbers are handled before the live-status switch since
  // they have meaningful line_type signals without a live check.
  if (lineType === "BAD_FORMAT") {
    // No credits charged for bad-format; nothing to log.
    return { status: "invalid", provider: "hlr-lookup", checkedAt, raw: body, phoneType: null };
  }
  if (lineType === "LANDLINE" || lineType === "VOIP") {
    // US landlines (and VoIP) return free with line type identified and no
    // live status. Status stays untested-with-checkedAt so the UI can render
    // "Landline / VoIP" without claiming a verification we didn't perform.
    // No usage row logged (credits_spent is 0).
    return { status: "untested", provider: "hlr-lookup", checkedAt, raw: body, phoneType };
  }

  // Mobile path: live_status carries the real signal.
  if (liveStatus === "LIVE" || liveStatus === "ABSENT_SUBSCRIBER") {
    // LIVE = subscriber active and reachable. ABSENT_SUBSCRIBER = phone is
    // off or out of network range but the SIM is active. Both mean Rick
    // can plausibly reach this number, so we mark Verified.
    if (units > 0) {
      await logUsage(sb, orgId, units, {
        phone_e164: e164,
        result: liveStatus.toLowerCase(),
        line_type: lineType,
        provider: "hlr-lookup",
      });
    }
    return { status: "valid", provider: "hlr-lookup", checkedAt, raw: body, phoneType };
  }
  if (liveStatus === "DEAD" || liveStatus === "NO_TELESERVICE_PROVISIONED") {
    // DEAD = subscriber disconnected. NO_TELESERVICE_PROVISIONED = number
    // is assigned but has no voice/SMS service. Both are dead-line signals.
    if (units > 0) {
      await logUsage(sb, orgId, units, {
        phone_e164: e164,
        result: liveStatus.toLowerCase(),
        line_type: lineType,
        provider: "hlr-lookup",
      });
    }
    return { status: "invalid", provider: "hlr-lookup", checkedAt, raw: body, phoneType };
  }
  // INCONCLUSIVE / NOT_AVAILABLE_NETWORK_ONLY / unknown live_status — we
  // tried but couldn't get a definitive answer. Log if credits were spent.
  if (units > 0) {
    await logUsage(sb, orgId, units, {
      phone_e164: e164,
      result: "inconclusive",
      line_type: lineType,
      provider: "hlr-lookup",
    });
  }
  return { status: "untested", provider: "hlr-lookup", checkedAt, raw: body, phoneType };
}

// Live balance pull from HLR Lookup. Returns null on any failure so the UI
// falls back to local cap-minus-used. HLR Lookup's v2 doesn't expose a
// confirmed-working balance endpoint in their public docs (we probed
// /apiv2/getbalance and got 404), so for now we always return null and let
// the Billing meter use the fallback calculation. Replace this stub with
// a real call when the balance endpoint is published.
async function getHlrBalance(): Promise<number | null> {
  return null;
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
  // metadata->>provider) are not indexed. At ~10k+ HLR-era usage rows per
  // org this becomes a tablescan and adds ~100ms+ per save. Fix is a GIN
  // index migration on org_addon_usage.metadata when it bites.
  const { data, error } = await sb
    .from("org_addon_usage")
    .select("created_at, metadata")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY)
    .gte("created_at", ninetyDaysAgo)
    .filter("metadata->>phone_e164", "eq", e164)
    .filter("metadata->>provider", "eq", "hlr-lookup")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const row = data[0] as { created_at: string; metadata: Record<string, unknown> | null };
  const m = row.metadata ?? {};
  const result = m.result;
  // Cache hit semantics: 'live' and 'absent_subscriber' both map to valid;
  // 'dead' and 'no_teleservice_provisioned' map to invalid; anything else
  // (inconclusive, unknown) is treated as a cache miss so we re-validate.
  const isValid = result === "live" || result === "absent_subscriber";
  const isInvalid = result === "dead" || result === "no_teleservice_provisioned";
  if (!isValid && !isInvalid) return null;
  const lineType = (m.line_type as string | null | undefined) ?? null;
  return {
    status: isValid ? "valid" : "invalid",
    provider: "hlr-lookup-cache",
    checkedAt: row.created_at,
    raw: {
      cached: true,
      original_validated_at: row.created_at,
      line_type: lineType,
      e164,
    },
    phoneType: lineType ? mapHlrLineType(lineType) : null,
  };
}

// Sums org_addon_usage units inside the current calendar month, gives the
// Billing meter a "this billing cycle's spend" figure independent of the
// running Clearout balance.
async function getMonthCreditsUsed(sb: ServiceClient, orgId: string): Promise<number> {
  // Same provider filter as getTotalCreditsUsed: only count current-provider
  // rows so "Spent This Month" reflects what's actually been charged here.
  const { data } = await sb
    .from("org_addon_usage")
    .select("units")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY)
    .eq("period_month", currentPeriodMonth())
    .filter("metadata->>provider", "eq", "hlr-lookup");
  if (!data) return 0;
  return data.reduce((sum, row) => sum + (row.units ?? 0), 0);
}

// Billing UI's source of truth. `remainingCredits` is pulled live from the
// provider when possible. HLR Lookup's public docs don't expose a confirmed
// balance endpoint, so for now we always return null here and the UI uses
// the cap-minus-used fallback computed from app_settings.
export type ValidationUsageSummary = {
  remainingCredits: number | null;
  usedThisMonth: number;
  usedAllTime: number;
  fallbackCap: number;
  source: "provider_live" | "fallback";
};

export async function getValidationUsage(orgId: string): Promise<ValidationUsageSummary> {
  const sb = createServiceClient();
  const [remaining, usedThisMonth, usedAllTime, fallbackCap] = await Promise.all([
    getHlrBalance(),
    getMonthCreditsUsed(sb, orgId),
    getTotalCreditsUsed(sb, orgId),
    getQuotaCap(sb, orgId),
  ]);
  return {
    remainingCredits: remaining,
    usedThisMonth,
    usedAllTime,
    fallbackCap,
    source: remaining !== null ? "provider_live" : "fallback",
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
