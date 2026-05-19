import "server-only";
import type {
  SendLetterInput,
  SendCheckInput,
  SendResult,
  MailClass,
  MailProvider,
} from "./types";
import { click2mailSendLetter, isClick2MailConfigured } from "./click2mail";
import { lobSendCheck, isLobConfigured } from "./lob";
import { stubSendLetter, stubSendCheck } from "./stub";

export type { SendLetterInput, SendCheckInput, SendResult, MailClass, MailProvider };

// Entry points the rest of the app uses. Provider selection rules (per
// Bree's mail-vendor strategy):
//   * Letters → Click2Mail ONLY. No silent fallback to Lob — Lob letters
//     cost ~50% more, and we'd rather fail loudly and force a config fix
//     than ship the bill. Falls back to stub when C2M isn't configured.
//   * Checks → Lob ONLY (Lob is the only check provider we integrate).
//     Falls back to stub if Lob isn't configured.
//
// The provider tag returned by each call is persisted on mail_jobs.provider
// so the webhook router and tracking links know who to ask about the piece.

export async function sendLetter(
  input: SendLetterInput
): Promise<SendResult> {
  if (isClick2MailConfigured()) return click2mailSendLetter(input);
  return stubSendLetter(input);
}

export async function sendCheck(input: SendCheckInput): Promise<SendResult> {
  if (isLobConfigured()) return lobSendCheck(input);
  return stubSendCheck(input);
}

export function activeLetterProvider(): MailProvider {
  if (isClick2MailConfigured()) return "click2mail";
  return "stub";
}

export function activeCheckProvider(): MailProvider {
  if (isLobConfigured()) return "lob";
  return "stub";
}

export { isClick2MailConfigured, isLobConfigured };
export { lobCreateBankAccount, lobVerifyBankAccount } from "./lob";
export type {
  LobBankAccountInput,
  LobBankAccountResult,
} from "./lob";
export { renderMerge, MERGE_FIELDS, fieldsByGroup } from "./merge";
export type { MergeContext, MergeField } from "./merge";
