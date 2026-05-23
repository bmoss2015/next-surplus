// Shared types for the mail module. Both Click2Mail (letters) and Lob
// (checks) implement these same interfaces so callers don't have to know
// which provider handled the send.

export type MailClass = "standard" | "first_class" | "certified";

export type MailStatus =
  | "queued"
  | "in_transit"
  | "delivered"
  | "returned"
  | "failed";

export type MailProvider = "click2mail" | "lob" | "stub";

export type Address = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
};

// Per-piece rate schedule the org has configured. Matches the JSONB
// shape stored on orgs.lob_pricing_cents. All values in cents. Defaults
// to the published Developer-tier rates; admin can override from
// /settings to reflect actual contract pricing (volume discounts,
// tier upgrades, custom enterprise rates).
export type LobPricing = {
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
  // USPS weight-tier passthrough. Applies when a single piece exceeds 6
  // single-sided sheets (about 1 oz). Same rate regardless of color.
  // Optional so older config rows that don't have it yet don't break;
  // missing → treated as 0 (no surcharge applied).
  letter_over_6_sheet_fee?: number;
};

export type SendLetterInput = {
  to: Address;
  from: Address;
  body_html: string;
  mail_class: MailClass;
  // True = print in full color (~$0.10-0.20/piece extra on both providers).
  // False / undefined = black and white. Default is B&W to match the default
  // billing baseline; sender opts in per send.
  color?: boolean;
  // Internal correlation id we hand to the provider as metadata so the
  // webhook can map back to our mail_jobs row even if our provider_id
  // hasn't been persisted yet.
  correlation_id: string;
  // What we charge the customer for this piece. Becomes mail_jobs.cost_cents.
  // Optional so non-org callers still work; missing → cost_cents = null.
  customer_pricing?: LobPricing;
  // What the provider (Lob, C2M) actually charges us. Becomes
  // mail_jobs.provider_cost_cents. For C2M, this is overridden by the
  // totalCost returned in their submitJob response (which is the actual
  // billed amount). For Lob, computed from this schedule since Lob's
  // create-letter / create-check APIs don't return per-piece cost.
  wholesale_pricing?: LobPricing;
  // Total sheet count for this piece (cover + every additional sheet
  // from PDF attachments). Used to detect when the > 6-sheet USPS
  // surcharge applies. Optional — when missing, the surcharge is not
  // added (caller didn't know the count yet).
  total_sheets?: number;
};

export type SendCheckInput = SendLetterInput & {
  amount_cents: number;
  memo?: string | null;
  bank_account_id: string; // Lob bnk_xxx
};

export type SendResult =
  | {
      ok: true;
      provider: MailProvider;
      provider_id: string;
      tracking_number: string | null;
      tracking_url: string | null;
      // Customer-facing charge. Sums to revenue across mail_jobs.
      cost_cents: number | null;
      // What the provider billed us. Sums to cost-to-Bree across mail_jobs.
      provider_cost_cents: number | null;
    }
  | { ok: false; error: string };
