"use server";

import {
  verifyAddressCached,
  type AddressVerifyInput,
  type AddressVerifyResult,
} from "@/lib/mail/verify-address";

// Server action wrapper around verifyAddressCached. Called from the
// Send Mail modal background-verify and from the address-fix re-verify.
// When a contact_id is provided, the cached result is returned if
// fresh (within 90 days) and the address hash matches — saves the
// per-call charge on repeat sends. The cache is invalidated automatically
// by a DB trigger when the contact's value is updated.
export async function verifyAddressAction(
  input: AddressVerifyInput & { contact_id?: string | null; force?: boolean }
): Promise<AddressVerifyResult> {
  const { contact_id, force, ...address } = input;
  return verifyAddressCached(address, {
    contactId: contact_id ?? null,
    force: force === true,
  });
}
