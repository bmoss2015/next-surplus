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
  // Org's Lob rate schedule. Optional so non-org callers still work;
  // when missing the cost computation falls back to nulls.
  lob_pricing?: LobPricing;
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
      cost_cents: number | null;
    }
  | { ok: false; error: string };
