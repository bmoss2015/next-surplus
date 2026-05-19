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

export async function stubSendLetter(
  input: SendLetterInput
): Promise<SendResult> {
  void input;
  return {
    ok: true,
    provider: "stub",
    provider_id: `stub_letter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tracking_number: null,
    tracking_url: null,
    cost_cents: 57,
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
    cost_cents: 116 + Math.round(input.amount_cents * 0), // base cost only
  };
}
