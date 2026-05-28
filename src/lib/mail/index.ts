import "server-only";
import type {
  SendLetterInput,
  SendCheckInput,
  SendResult,
  MailClass,
  MailProvider,
} from "./types";
import {
  click2mailSendLetter,
  click2mailCreateMergedDocument,
  click2mailSendFromDocumentId,
  isClick2MailConfigured,
} from "./click2mail";
import { lobSendCheck, lobSendLetter, isLobConfigured } from "./lob";
import { stubSendLetter, stubSendCheck } from "./stub";

export type { SendLetterInput, SendCheckInput, SendResult, MailClass, MailProvider };

// Entry points the rest of the app uses. Provider selection rules:
//   * Letters → Lob ONLY. Verified May 2026 against C2M qty=1 pricing:
//     Lob is $1.65 cheaper per piece for single-letter sends (no $1.59
//     single-piece surcharge that C2M applies at qty=1). Falls back to
//     stub when Lob isn't configured. C2M code is retained for rollback
//     but not in the active path.
//   * Checks → Lob ONLY (Lob is the only check provider we integrate).
//     Falls back to stub if Lob isn't configured.
//
// The provider tag returned by each call is persisted on mail_jobs.provider
// so the webhook router and tracking links know who to ask about the piece.

export async function sendLetter(
  input: SendLetterInput
): Promise<SendResult> {
  if (isLobConfigured()) return lobSendLetter(input);
  return stubSendLetter(input);
}

export async function sendCheck(input: SendCheckInput): Promise<SendResult> {
  if (isLobConfigured()) return lobSendCheck(input);
  return stubSendCheck(input);
}

export function activeLetterProvider(): MailProvider {
  if (isLobConfigured()) return "lob";
  return "stub";
}

export function activeCheckProvider(): MailProvider {
  if (isLobConfigured()) return "lob";
  return "stub";
}

export {
  isClick2MailConfigured,
  isLobConfigured,
  click2mailCreateMergedDocument,
  click2mailSendFromDocumentId,
};
export {
  lobCreateBankAccount,
  lobVerifyBankAccount,
  lobDeleteBankAccount,
} from "./lob";
export type {
  LobBankAccountInput,
  LobBankAccountResult,
} from "./lob";
export { renderMerge, MERGE_FIELDS, fieldsByGroup } from "./merge";
export type { MergeContext, MergeField } from "./merge";
