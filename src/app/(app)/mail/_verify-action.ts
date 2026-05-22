"use server";

import {
  verifyAddress,
  type AddressVerifyInput,
  type AddressVerifyResult,
} from "@/lib/mail/verify-address";

// Server action wrapper around verifyAddress. Called from the Send Mail
// modal before enabling the Send button.
export async function verifyAddressAction(
  input: AddressVerifyInput
): Promise<AddressVerifyResult> {
  return verifyAddress(input);
}
