import "server-only";
import type { SendLetterInput, SendCheckInput, SendResult } from "./types";

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
    return {
      ok: true,
      provider: "lob",
      provider_id: json.id,
      tracking_number: json.tracking_number ?? null,
      tracking_url: json.url ?? null,
      // Lob's create-check API doesn't return per-piece cost. The actual
      // amount lands on the monthly Lob invoice. Stored as null so the
      // report doesn't fabricate a number — we'd rather show "spend not
      // tracked" than a wrong number. Backfill via invoice import later.
      cost_cents: null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lob unknown error",
    };
  }
}

// -- Letters (fallback path, not used in v1) --------------------------------

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
    return {
      ok: true,
      provider: "lob",
      provider_id: json.id,
      tracking_number: json.tracking_number ?? null,
      tracking_url: json.url ?? null,
      // Same reason as the check path — Lob doesn't return per-piece
      // cost. Reconciled monthly via Lob invoice.
      cost_cents: null,
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
