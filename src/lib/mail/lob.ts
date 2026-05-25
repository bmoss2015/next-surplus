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

// Translate raw Lob HTTP responses into something a non-technical
// customer can read in the Send Mail modal. Server-side console keeps
// the full response for our debugging via the secondary message, but
// the user only sees the friendly first line.
export function friendlyLobError(status: number, rawBody: string): string {
  let parsedMsg = "";
  try {
    const json = JSON.parse(rawBody) as {
      error?: { message?: string; code?: string };
    };
    parsedMsg = (json.error?.message ?? "").toLowerCase();
  } catch {
    parsedMsg = rawBody.slice(0, 200).toLowerCase();
  }

  // Address-related rejections (most common; the address-verify gate in
  // the modal usually catches these first, but Lob can still reject a
  // pass-the-gate address if it changes between verify + send).
  if (/undeliverable|address.*invalid|invalid.*address|cannot deliver/i.test(parsedMsg)) {
    return "This address can't be delivered to. Update the recipient address and try again.";
  }
  if (/zip|postal/i.test(parsedMsg) && /invalid|missing|short|long/i.test(parsedMsg)) {
    return "The ZIP / postal code looks wrong. Check it and try again.";
  }
  if (/missing|required/i.test(parsedMsg)) {
    return "Some recipient details are missing. Check the address fields and try again.";
  }

  // Service / infrastructure-level errors. Don't dump status codes on the
  // user — they can't do anything with "401".
  if (status === 401 || status === 403) {
    return "Mail service is temporarily unavailable. Please contact support.";
  }
  if (status === 429) {
    return "Mail service is busy right now. Wait a few seconds and try again.";
  }
  if (status === 422) {
    // Generic 422 with no recognized message string — still likely an
    // address/data issue from the user's perspective.
    return "The recipient details were rejected by the mail service. Check the address and try again.";
  }
  if (status >= 500) {
    return "The mail service is having problems right now. Please try again in a few minutes.";
  }
  if (status === 400) {
    return "Something about this send couldn't be processed. Check the recipient details and try again.";
  }

  // Catch-all that doesn't leak internals.
  return "The send couldn't be completed. Please try again, or contact support if this keeps happening.";
}

export function isLobConfigured(): boolean {
  return Boolean(LOB_API_KEY);
}

function authHeader(): string {
  const basic = Buffer.from(`${LOB_API_KEY}:`).toString("base64");
  return `Basic ${basic}`;
}

// Wraps a fetch with exponential-backoff retries on transient failures
// (429 rate limit + any 5xx). Lob's own SDK uses the same pattern.
// Three retries max, total wait under 8 seconds (1s + 2s + 4s). After
// retries are exhausted the final response is returned so the caller
// can surface its error string to the user.
async function lobFetch(
  url: string,
  init: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      // Network-level failure (DNS, socket reset, etc.) — treat as
      // transient and retry. Last attempt re-throws so the caller's
      // try/catch surfaces a clean error.
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      continue;
    }
    const transient = res.status === 429 || res.status >= 500;
    if (!transient) return res;
    if (attempt === maxRetries) return res;
    await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
  }
  // Unreachable; loop always returns or throws.
  throw new Error("lobFetch loop exhausted");
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
    return { ok: false, error: "Mail service is not configured. Contact support." };
  }

  try {
    // Two send shapes, mirroring lobSendLetter:
    //   * file_pdf set -> multipart/form-data with the PDF as the
    //     `check_bottom` field. Used by the Word-template + check
    //     path after Gotenberg renders the docx into a PDF.
    //   * otherwise -> JSON body with HTML in `check_bottom`.
    const hasPdf = !!input.file_pdf;
    let res: Response;
    if (hasPdf) {
      const fd = new FormData();
      fd.append("bank_account", input.bank_account_id);
      fd.append("amount", (input.amount_cents / 100).toFixed(2));
      fd.append("memo", input.memo ?? "");
      fd.append("to[name]", input.to.name);
      fd.append("to[address_line1]", input.to.line1);
      fd.append("to[address_line2]", input.to.line2 ?? "");
      fd.append("to[address_city]", input.to.city);
      fd.append("to[address_state]", input.to.state);
      fd.append("to[address_zip]", input.to.postal_code);
      fd.append("to[address_country]", input.to.country ?? "US");
      fd.append("from[name]", input.from.name);
      fd.append("from[address_line1]", input.from.line1);
      fd.append("from[address_line2]", input.from.line2 ?? "");
      fd.append("from[address_city]", input.from.city);
      fd.append("from[address_state]", input.from.state);
      fd.append("from[address_zip]", input.from.postal_code);
      fd.append("from[address_country]", input.from.country ?? "US");
      fd.append(
        "check_bottom",
        new Blob([new Uint8Array(input.file_pdf!)], {
          type: "application/pdf",
        }),
        "letter.pdf"
      );
      fd.append("mail_type", lobMailType(input.mail_class));
      fd.append("metadata[correlation_id]", input.correlation_id);
      res = await lobFetch(`${LOB_BASE_URL}/checks`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          Accept: "application/json",
        },
        body: fd,
      });
    } else {
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
      res = await lobFetch(`${LOB_BASE_URL}/checks`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) {
      const raw = await res.text();
      console.error("Lob check create failed", res.status, raw);
      return { ok: false, error: friendlyLobError(res.status, raw) };
    }
    const json = (await res.json()) as {
      id?: string;
      tracking_number?: string;
      url?: string;
      thumbnails?: unknown;
    };
    if (!json.id) {
      return { ok: false, error: "Couldn't create the check. Try again or contact support." };
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
      error: err instanceof Error ? err.message : "Mail service hit an unknown error. Try again.",
    };
  }
}

// -- Letters ---------------------------------------------------------------

export async function lobSendLetter(
  input: SendLetterInput
): Promise<SendResult> {
  if (!isLobConfigured()) {
    return { ok: false, error: "Mail service is not configured. Contact support." };
  }
  try {
    // Two send shapes:
    //   * file_pdf set → multipart/form-data with the PDF as the `file`
    //     field (used by the Word-template path after Gotenberg renders
    //     the merged docx + attachments into a single PDF).
    //   * otherwise → JSON body with HTML in the `file` field (the
    //     Blank Letter / HTML-template path). Lob renders the HTML to
    //     PDF at print time.
    const hasPdf = !!input.file_pdf;
    let res: Response;
    if (hasPdf) {
      const fd = new FormData();
      fd.append("to[name]", input.to.name);
      fd.append("to[address_line1]", input.to.line1);
      fd.append("to[address_line2]", input.to.line2 ?? "");
      fd.append("to[address_city]", input.to.city);
      fd.append("to[address_state]", input.to.state);
      fd.append("to[address_zip]", input.to.postal_code);
      fd.append("to[address_country]", input.to.country ?? "US");
      fd.append("from[name]", input.from.name);
      fd.append("from[address_line1]", input.from.line1);
      fd.append("from[address_line2]", input.from.line2 ?? "");
      fd.append("from[address_city]", input.from.city);
      fd.append("from[address_state]", input.from.state);
      fd.append("from[address_zip]", input.from.postal_code);
      fd.append("from[address_country]", input.from.country ?? "US");
      fd.append(
        "file",
        new Blob([new Uint8Array(input.file_pdf!)], {
          type: "application/pdf",
        }),
        "letter.pdf"
      );
      fd.append("color", String(input.color === true));
      fd.append("mail_type", lobMailType(input.mail_class));
      fd.append("use_type", "marketing");
      fd.append("metadata[correlation_id]", input.correlation_id);
      res = await lobFetch(`${LOB_BASE_URL}/letters`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          Accept: "application/json",
        },
        body: fd,
      });
    } else {
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
      res = await lobFetch(`${LOB_BASE_URL}/letters`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) {
      const raw = await res.text();
      console.error("Lob letter create failed", res.status, raw);
      return { ok: false, error: friendlyLobError(res.status, raw) };
    }
    const json = (await res.json()) as {
      id?: string;
      tracking_number?: string;
      url?: string;
    };
    if (!json.id) {
      return { ok: false, error: "Couldn't create the letter. Try again or contact support." };
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
      error: err instanceof Error ? err.message : "Mail service hit an unknown error. Try again.",
    };
  }
}

// Fetch current state of a Lob letter / check. Used by the
// reconciliation cron to self-heal mail_jobs rows whose webhook never
// arrived (Lob webhook delivery is reliable but not guaranteed). Maps
// Lob's status values to our internal MailStatus enum.
export type LobPieceStatus =
  | { ok: true; status: "queued" | "in_transit" | "delivered" | "returned" | "failed"; tracking_number: string | null; tracking_url: string | null }
  | { ok: false; error: string };

export async function lobGetPiece(opts: {
  kind: "letter" | "check";
  provider_id: string;
}): Promise<LobPieceStatus> {
  if (!isLobConfigured()) return { ok: false, error: "Mail service is not configured." };
  try {
    const path = opts.kind === "check" ? "checks" : "letters";
    const res = await fetch(
      `${LOB_BASE_URL}/${path}/${opts.provider_id}`,
      {
        method: "GET",
        headers: { Authorization: authHeader(), Accept: "application/json" },
      }
    );
    if (!res.ok) {
      return {
        ok: false,
        error: `Lob get-piece failed: ${res.status} ${await res.text()}`,
      };
    }
    const json = (await res.json()) as {
      tracking_events?: Array<{ name?: string; type?: string }>;
      tracking_number?: string;
      url?: string;
      delivered?: boolean;
      // Some responses include a top-level status; we don't rely on it
      // and instead derive from tracking events which are authoritative.
    };
    const events = json.tracking_events ?? [];
    const lastEvent = events[events.length - 1];
    const lastName = (lastEvent?.name ?? "").toLowerCase();
    // Map Lob's tracking event names to our internal status. Lob's
    // event vocabulary: "Mailed", "In Transit", "In Local Area",
    // "Processed for Delivery", "Re-Routed", "Returned to Sender",
    // "Delivered", "Failed". We collapse anything in-flight to
    // "in_transit", anything terminal to its specific status.
    let status: LobPieceStatus["status"] = "queued";
    if (json.delivered || /delivered/.test(lastName)) status = "delivered";
    else if (/return/.test(lastName)) status = "returned";
    else if (/failed/.test(lastName)) status = "failed";
    else if (events.length > 0) status = "in_transit";

    return {
      ok: true,
      status,
      tracking_number: json.tracking_number ?? null,
      tracking_url: json.url ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Mail lookup failed. Try again.",
    };
  }
}

// Best-effort cancel for a Lob piece. Lob allows cancellation of
// letters / checks within roughly 5 minutes of create — used as the
// undo path when our own mail_jobs insert fails AFTER Lob accepted the
// piece (so the customer doesn't get billed for a piece we never
// tracked). Never throws; failures here are logged but don't propagate
// since the caller is already in an error-handling branch.
export async function lobCancelPiece(opts: {
  kind: "letter" | "check";
  provider_id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLobConfigured()) return { ok: false, error: "Mail service is not configured." };
  try {
    const path = opts.kind === "check" ? "checks" : "letters";
    const res = await fetch(
      `${LOB_BASE_URL}/${path}/${opts.provider_id}`,
      {
        method: "DELETE",
        headers: { Authorization: authHeader(), Accept: "application/json" },
      }
    );
    if (!res.ok) {
      return {
        ok: false,
        error: `Lob cancel failed: ${res.status} ${await res.text()}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Mail cancel failed. Try again.",
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
    return { ok: false, error: "Mail service is not configured. Contact support." };
  }
  try {
    const res = await lobFetch(`${LOB_BASE_URL}/bank_accounts`, {
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
      return { ok: false, error: "Couldn't add bank account. Try again or contact support." };
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
      error: err instanceof Error ? err.message : "Mail service hit an unknown error. Try again.",
    };
  }
}

export async function lobVerifyBankAccount(
  bnkId: string,
  amounts: [number, number]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isLobConfigured()) {
    return { ok: false, error: "Mail service is not configured. Contact support." };
  }
  try {
    const res = await lobFetch(`${LOB_BASE_URL}/bank_accounts/${bnkId}/verify`, {
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
      error: err instanceof Error ? err.message : "Mail service hit an unknown error. Try again.",
    };
  }
}
