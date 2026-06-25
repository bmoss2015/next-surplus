import "server-only";
import type {
  SendLetterInput,
  SendCheckInput,
  SendResult,
  MailClass,
  MailProvider,
} from "./types";
import { lobSendCheck, lobSendLetter, isLobConfigured } from "./lob";
import { stubSendLetter, stubSendCheck } from "./stub";

export type { SendLetterInput, SendCheckInput, SendResult, MailClass, MailProvider };

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

export { isLobConfigured };
export {
  lobCreateBankAccount,
  lobVerifyBankAccount,
  lobDeleteBankAccount,
  lobGetBankAccount,
} from "./lob";
export type {
  LobBankAccountInput,
  LobBankAccountResult,
  LobBankAccountState,
  LobVerifyInput,
} from "./lob";
export { renderMerge, MERGE_FIELDS, fieldsByGroup } from "./merge";
export type { MergeContext, MergeField } from "./merge";
