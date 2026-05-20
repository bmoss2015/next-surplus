import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createServiceClient } from "./supabase/service";

// Veriphone Free tier is 1,000 requests/month. We cap 50 below to keep a
// buffer for retries and avoid 429s from their side. Override per-org by
// inserting a row into app_settings with key='phone_validation_quota_cap'.
const DEFAULT_QUOTA_CAP = 950;
const VERIPHONE_ENDPOINT = "https://api.veriphone.io/v2/verify";
const ADDON_KEY = "phone_validation";

export type ValidationStatus = "valid" | "invalid" | "untested";

export type ValidationResult = {
  status: ValidationStatus;
  provider: string | null;
  checkedAt: string | null;
  raw: unknown;
};

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
}

// Validate a single phone for a given org. Pre-filters obvious junk via
// libphonenumber (free), then calls Veriphone if quota allows. Logs to
// org_addon_usage only when Veriphone actually consumed a credit.
export async function validatePhone(
  phoneRaw: string | null | undefined,
  orgId: string
): Promise<ValidationResult> {
  if (!phoneRaw || !phoneRaw.trim()) {
    return { status: "untested", provider: null, checkedAt: null, raw: null };
  }

  const parsed = parsePhoneNumberFromString(phoneRaw.trim(), "US");
  if (!parsed || !parsed.isValid()) {
    return {
      status: "invalid",
      provider: "libphonenumber",
      checkedAt: new Date().toISOString(),
      raw: { reason: "failed_libphonenumber" },
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
    };
  }

  const apiKey = process.env.VERIPHONE_API_KEY;
  if (!apiKey) {
    return {
      status: "untested",
      provider: null,
      checkedAt: null,
      raw: { reason: "missing_veriphone_key" },
    };
  }

  let body: { status?: string; phone_valid?: boolean } | null = null;
  let httpOk = false;
  let networkError: string | null = null;
  try {
    const url = new URL(VERIPHONE_ENDPOINT);
    url.searchParams.set("phone", e164);
    url.searchParams.set("default_country", "US");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    httpOk = res.ok;
    body = (await res.json()) as typeof body;
  } catch (e) {
    networkError = e instanceof Error ? e.message : String(e);
  }

  const checkedAt = new Date().toISOString();

  if (networkError) {
    return {
      status: "untested",
      provider: "veriphone",
      checkedAt: null,
      raw: { error: networkError },
    };
  }
  if (body?.status === "syntax-error") {
    return { status: "invalid", provider: "veriphone", checkedAt, raw: body };
  }
  if (!httpOk) {
    return { status: "untested", provider: "veriphone", checkedAt: null, raw: body };
  }
  if (body?.status === "success" && body?.phone_valid === true) {
    await logUsage(sb, orgId, { phone_e164: e164, result: "valid" });
    return { status: "valid", provider: "veriphone", checkedAt, raw: body };
  }
  if (body?.status === "success" && body?.phone_valid === false) {
    await logUsage(sb, orgId, { phone_e164: e164, result: "invalid" });
    return { status: "invalid", provider: "veriphone", checkedAt, raw: body };
  }
  return { status: "untested", provider: "veriphone", checkedAt: null, raw: body };
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
