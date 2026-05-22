import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Resend } from "resend";
import { createServiceClient } from "./supabase/service";

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
// Pay-as-you-go rate Bree confirmed: $35 / 5,000 = $0.0070 per credit.
// Exported so the Billing meter can render "≈ $X.XX spent" alongside the
// raw credit count without re-deriving the math.
export const DEFAULT_CREDIT_COST_USD = 0.007;

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
  const { data } = await sb
    .from("org_addon_usage")
    .select("units")
    .eq("org_id", orgId)
    .eq("addon_key", ADDON_KEY);
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
      ? "Your Phone Validation add-on has consumed 100% of its credit balance. New phone numbers added via import or contact-add will land as <strong>Not Verified</strong> and will not be screened against Clearout Phone until the balance is topped off. Clearout doesn't auto-recharge — log in at clearoutphone.io to purchase more credits, then raise the cap in Settings &rarr; Billing."
      : `Your Phone Validation add-on has consumed <strong>${threshold}%</strong> of its credit balance. Validation continues normally — this is a heads-up so you can top off at Clearout before hitting zero. <strong>${remaining.toLocaleString()}</strong> credits remaining.`;

  const html = `<div style="font-family:Inter,Arial,sans-serif;color:#0f1729;max-width:480px;margin:0 auto;padding:24px;">
  <h1 style="margin:0;font-size:20px;font-weight:600;color:#0d4b3a;">${subject}</h1>
  <p style="margin:20px 0 0;font-size:14px;line-height:1.6;">${bodyIntro}</p>
  <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">Credits used: <strong>${used.toLocaleString()} / ${cap.toLocaleString()}</strong></p>
  <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Settings &rarr; Billing in the portal shows the live meter and lets you raise the cap after topping off at Clearout.</p>
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
  const [cap, used] = await Promise.all([
    getQuotaCap(sb, orgId),
    getTotalCreditsUsed(sb, orgId),
  ]);
  if (used >= cap) {
    return {
      status: "untested",
      provider: null,
      checkedAt: null,
      raw: { reason: "credit_balance_exhausted", cap, used },
      phoneType: null,
    };
  }

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
  try {
    const res = await fetch(CLEAROUT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number: e164, country_code: "US" }),
    });
    httpOk = res.ok;
    body = (await res.json()) as ClearoutBody;
  } catch (e) {
    networkError = e instanceof Error ? e.message : String(e);
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
  if (data.status === "valid") {
    await logUsage(sb, orgId, units, { phone_e164: e164, result: "valid", line_type: data.line_type });
    return { status: "valid", provider: "clearout", checkedAt, raw: body, phoneType };
  }
  if (data.status === "invalid") {
    await logUsage(sb, orgId, units, { phone_e164: e164, result: "invalid" });
    return { status: "invalid", provider: "clearout", checkedAt, raw: body, phoneType };
  }
  // status === 'unknown' — Clearout still bills credits for unknowns, so log
  // them too, but the row stays untested-with-checkedAt so the sweep won't
  // re-burn credits on the same number.
  await logUsage(sb, orgId, units, { phone_e164: e164, result: "unknown" });
  return { status: "untested", provider: "clearout", checkedAt, raw: body, phoneType: null };
}

// Helpers for callers that need balance/usage info without performing
// validation (e.g., the Billing UI). `used` is cumulative across all months
// because Clearout PAYG credits don't auto-reset — the cap is a top-off
// balance the user maintains manually. period_month is still returned for
// downstream consumers that key on it (unchanged shape).
export async function getValidationUsage(orgId: string): Promise<{ used: number; cap: number; period_month: string }> {
  const sb = createServiceClient();
  const [cap, used] = await Promise.all([
    getQuotaCap(sb, orgId),
    getTotalCreditsUsed(sb, orgId),
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
        // Auto-fill phone type from Clearout IFF the row doesn't already have
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
