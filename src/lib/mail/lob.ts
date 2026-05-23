import "server-only";
import type {
  SendLetterInput,
  SendCheckInput,
  SendResult,
  LobPricing,
} from "./types";

// Lob doesn't return per-piece cost in their create-check or create-
// letter API responses. Their billing reconciles monthly. To report
// spend at send time, the caller passes a per-org pricing schedule
// (stored on orgs.lob_pricing_cents) which we use to compute cost.
//
// If pricing isn't provided (older callers, dev environments), cost
// returns null so the report shows "spend not tracked" rather than
// inventing a number.

// Published Lob Developer-tier defaults, used by the migration to
// seed the per-org config and surfaced here as a fallback for callers
// that don't pass a schedule. Verified via Lob docs llms-full.txt on
// 2026-05-22.
export const LOB_PUBLISHED_DEVELOPER_PRICING: LobPricing = {
  tier_label: "Developer (published)",
  check_base: 116,
  check_extra_attachment_page: 22,
  letter_first_class_bw: 103,
  letter_first_class_color: 119,
  letter_standard_bw: 81,
  letter_standard_color: 97,
  letter_certified_bw: 103,
  letter_certified_color: 119,
  letter_extra_page_bw: 10,
  letter_extra_page_color: 20,
};

function lobLetterCostCents(
  mc: SendLetterInput["mail_class"],
  color: boolean,
  pricing: LobPricing | undefined
): number | null {
  if (!pricing) return null;
  if (mc === "standard") return color ? pricing.letter_standard_color : pricing.letter_standard_bw;
  if (mc === "certified") return color ? pricing.letter_certified_color : pricing.letter_certified_bw;
  return color ? pricing.letter_first_class_color : pricing.letter_first_class_bw;
}

function lobCheckCostCents(pricing: LobPricing | undefined): number | null {
  if (!pricing) return null;
  return pricing.check_base;
}

// Compute the {customer charge, provider cost} pair for a letter from
// the two schedules we now carry around. Either may be undefined (older
// callers or first-run when wholesale isn't synced yet) in which case the
// matching column becomes null.
//
// When totalSheets is provided and exceeds 6, the > 6-sheet surcharge is
// added to BOTH the customer charge and the provider cost. Surcharge is
// pulled from each schedule's letter_over_6_sheet_fee. Lob bills the
// surcharge as a USPS weight-tier passthrough; we mirror that bill
// directly so margin is preserved (customer rate covers wholesale).
function lobLetterCostPair(
  mc: SendLetterInput["mail_class"],
  color: boolean,
  customer: LobPricing | undefined,
  wholesale: LobPricing | undefined,
  totalSheets: number | undefined
): { cost_cents: number | null; provider_cost_cents: number | null } {
  const baseCustomer = lobLetterCostCents(mc, color, customer);
  const baseWholesale = lobLetterCostCents(mc, color, wholesale);
  const triggerSurcharge = typeof totalSheets === "number" && totalSheets > 6;
  const customerSurcharge =
    triggerSurcharge ? (customer?.letter_over_6_sheet_fee ?? 0) : 0;
  const wholesaleSurcharge =
    triggerSurcharge ? (wholesale?.letter_over_6_sheet_fee ?? 0) : 0;
  return {
    cost_cents:
      baseCustomer == null ? null : baseCustomer + customerSurcharge,
    provider_cost_cents:
      baseWholesale == null ? null : baseWholesale + wholesaleSurcharge,
  };
}

function lobCheckCostPair(
  customer: LobPricing | undefined,
  wholesale: LobPricing | undefined
): { cost_cents: number | null; provider_cost_cents: number | null } {
  return {
    cost_cents: lobCheckCostCents(customer),
    provider_cost_cents: lobCheckCostCents(wholesale),
  };
}

// Lob.com client. Used for two things:
//   * Sending checks (Click2Mail has no check product)
//   * Creating + verifying bank accounts (we never store the routing/account
//     numbers ourselves — Lob holds them and gives us a bnk_xxx reference)
//
// Auth: HTTP Basic with secret key as username, empty password. Test keys
// look like test_xxx; live keys look like live_xxx. Lob enforces the
// distinction on their side so we just forward whatever the env var says.

const LOB_BASE_URL = process.env.LOB_BASE_URL ?? "https://api.lob.com/v1";
const LOB_API_KEY = process.env.LOB_API_KEY ?? "";

export function isLobConfigured(): boolean {
  return Boolean(LOB_API_KEY);
}

function authHeader(): string {
  const basic = Buffer.from(`${LOB_API_KEY}:`).toString("base64");
  return `Basic ${basic}`;
}

// Lob accepts our internal class names directly via mail_type for checks
// and use_type for letters. The mappings below match Lob's published values.
function lobMailType(
  mc: SendLetterInput["mail_class"]
): "usps_first_class" | "usps_standard" {
  // Certified is a flag, not a class, on Lob — handled by the merge_variables
  // and the "certified" boolean. Standard maps to usps_standard.
  return mc === "standard" ? "usps_standard" : "usps_first_class";
}

// -- Checks ------------------------------------------------------------------

export async function lobSendCheck(
  input: SendCheckInput
): Promise<SendResult> {
  if (!isLobConfigured()) {
    return { ok: false, error: "Lob is not configured (missing LOB_API_KEY)" };
  }

  try {
    const body = {
      bank_account: input.bank_account_id,
      amount: (input.amount_cents / 100).toFixed(2),
      memo: input.memo ?? "",
      to: {
        name: input.to.name,
        address_line1: input.to.line1,
        address_line2: input.to.line2 ?? "",
        address_city: input.to.city,
        address_state: input.to.state,
        address_zip: input.to.postal_code,
        address_country: input.to.country ?? "US",
      },
      from: {
        name: input.from.name,
        address_line1: input.from.line1,
        address_line2: input.from.line2 ?? "",
        address_city: input.from.city,
        address_state: input.from.state,
        address_zip: input.from.postal_code,
        address_country: input.from.country ?? "US",
      },
      // The letter content is rendered above the check stub.
      check_bottom: input.body_html,
      mail_type: lobMailType(input.mail_class),
      metadata: { correlation_id: input.correlation_id },
    };
    const res = await fetch(`${LOB_BASE_URL}/checks`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Lob check create failed: ${res.status} ${await res.text()}`,
      };
    }
    const json = (await res.json()) as {
      id?: string;
      tracking_number?: string;
      url?: string;
      thumbnails?: unknown;
    };
    if (!json.id) {
      return { ok: false, error: "Lob check create returned no id" };
    }
    const { cost_cents, provider_cost_cents } = lobCheckCostPair(
      input.customer_pricing,
      input.wholesale_pricing
    );
    return {
      ok: true,
      provider: "lob",
      provider_id: json.id,
      tracking_number: json.tracking_number ?? null,
      tracking_url: json.url ?? null,
      // Lob's create-check API doesn't return per-piece cost, so we
      // compute both customer charge + wholesale cost from the schedules
      // the caller passed in (loaded from app_pricing_config at send time).
      cost_cents,
      provider_cost_cents,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lob unknown error",
    };
  }
}

// -- Letters ---------------------------------------------------------------

export async function lobSendLetter(
  input: SendLetterInput
): Promise<SendResult> {
  if (!isLobConfigured()) {
    return { ok: false, error: "Lob is not configured (missing LOB_API_KEY)" };
  }
  try {
    const body = {
      to: {
        name: input.to.name,
        address_line1: input.to.line1,
        address_line2: input.to.line2 ?? "",
        address_city: input.to.city,
        address_state: input.to.state,
        address_zip: input.to.postal_code,
        address_country: input.to.country ?? "US",
      },
      from: {
        name: input.from.name,
        address_line1: input.from.line1,
        address_line2: input.from.line2 ?? "",
        address_city: input.from.city,
        address_state: input.from.state,
        address_zip: input.from.postal_code,
        address_country: input.from.country ?? "US",
      },
      file: input.body_html,
      color: input.color === true,
      mail_type: lobMailType(input.mail_class),
      use_type: "marketing",
      metadata: { correlation_id: input.correlation_id },
    };
    const res = await fetch(`${LOB_BASE_URL}/letters`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Lob letter create failed: ${res.status} ${await res.text()}`,
      };
    }
    const json = (await res.json()) as {
      id?: string;
      tracking_number?: string;
      url?: string;
    };
    if (!json.id) {
      return { ok: false, error: "Lob letter create returned no id" };
    }
    const { cost_cents, provider_cost_cents } = lobLetterCostPair(
      input.mail_class,
      input.color === true,
      input.customer_pricing,
      input.wholesale_pricing,
      input.total_sheets
    );
    return {
      ok: true,
      provider: "lob",
      provider_id: json.id,
      tracking_number: json.tracking_number ?? null,
      tracking_url: json.url ?? null,
      cost_cents,
      provider_cost_cents,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lob unknown error",
    };
  }
}

// -- Bank account operations -------------------------------------------------

export type LobBankAccountInput = {
  routing_number: string;
  account_number: string;
  account_holder_name: string;
  account_type: "company" | "individual";
};

export type LobBankAccountResult =
  | {
      ok: true;
      lob_bank_account_id: string;
      bank_name: string | null;
      routing_last_four: string;
      account_last_four: string;
    }
  | { ok: false; error: string };

export async function lobCreateBankAccount(
  input: LobBankAccountInput
): Promise<LobBankAccountResult> {
  if (!isLobConfigured()) {
    return { ok: false, error: "Lob is not configured (missing LOB_API_KEY)" };
  }
  try {
    const res = await fetch(`${LOB_BASE_URL}/bank_accounts`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        routing_number: input.routing_number,
        account_number: input.account_number,
        signatory: input.account_holder_name,
        account_type: input.account_type,
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Lob bank account create failed: ${res.status} ${await res.text()}`,
      };
    }
    const json = (await res.json()) as {
      id?: string;
      bank_name?: string;
      routing_number?: string;
      account_number?: string;
    };
    if (!json.id) {
      return { ok: false, error: "Lob bank account create returned no id" };
    }
    return {
      ok: true,
      lob_bank_account_id: json.id,
      bank_name: json.bank_name ?? null,
      routing_last_four: (json.routing_number ?? input.routing_number).slice(-4),
      account_last_four: (json.account_number ?? input.account_number).slice(-4),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lob unknown error",
    };
  }
}

export async function lobVerifyBankAccount(
  bnkId: string,
  amounts: [number, number]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLobConfigured()) {
    return { ok: false, error: "Lob is not configured (missing LOB_API_KEY)" };
  }
  try {
    const res = await fetch(`${LOB_BASE_URL}/bank_accounts/${bnkId}/verify`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ amounts: [amounts[0], amounts[1]] }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Lob verify failed: ${res.status} ${await res.text()}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lob unknown error",
    };
  }
}
