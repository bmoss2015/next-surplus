import "server-only";
import type {
  SendLetterInput,
  SendCheckInput,
  SendResult,
} from "./types";

// In-app provider used when no API credentials are configured. Generates a
// fake provider_id + tracking number, returns immediately as queued, and is
// useful for end-to-end UI testing without burning real mail. Webhooks are
// not delivered; status stays "queued" unless an admin manually flips it.

function stubLetterCharge(input: SendLetterInput): number | null {
  const p = input.customer_pricing;
  if (!p) return 57; // legacy fallback
  const color = input.color === true;
  if (input.mail_class === "standard") return color ? p.letter_standard_color : p.letter_standard_bw;
  if (input.mail_class === "certified") return color ? p.letter_certified_color : p.letter_certified_bw;
  return color ? p.letter_first_class_color : p.letter_first_class_bw;
}

function stubLetterWholesale(input: SendLetterInput): number | null {
  const p = input.wholesale_pricing;
  if (!p) return null;
  const color = input.color === true;
  if (input.mail_class === "standard") return color ? p.letter_standard_color : p.letter_standard_bw;
  if (input.mail_class === "certified") return color ? p.letter_certified_color : p.letter_certified_bw;
  return color ? p.letter_first_class_color : p.letter_first_class_bw;
}

export async function stubSendLetter(
  input: SendLetterInput
): Promise<SendResult> {
  return {
    ok: true,
    provider: "stub",
    provider_id: `stub_letter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tracking_number: null,
    tracking_url: null,
    cost_cents: stubLetterCharge(input),
    provider_cost_cents: stubLetterWholesale(input),
  };
}

export async function stubSendCheck(
  input: SendCheckInput
): Promise<SendResult> {
  return {
    ok: true,
    provider: "stub",
    provider_id: `stub_check_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tracking_number: null,
    tracking_url: null,
    cost_cents: input.customer_pricing?.check_base ?? 145,
    provider_cost_cents: input.wholesale_pricing?.check_base ?? null,
  };
}
