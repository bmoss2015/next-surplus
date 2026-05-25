"use server";

import { createServiceClient } from "@/lib/supabase/service";
import {
  verifyAddressCached,
  type AddressVerifyInput,
  type AddressVerifyResult,
} from "@/lib/mail/verify-address";

// Server action wrapper around verifyAddressCached. When contact_id
// is provided, returns the cached result if fresh (< 90 days) and
// the address hash matches; otherwise calls the provider and writes
// the new result back. Cache invalidated automatically by a DB
// trigger when the contact's value is updated.
export async function verifyAddressAction(
  input: AddressVerifyInput & { contact_id?: string | null; force?: boolean }
): Promise<AddressVerifyResult> {
  const { contact_id, force, ...address } = input;
  return verifyAddressCached(address, {
    contactId: contact_id ?? null,
    force: force === true,
  });
}

// Bulk-read the cached verification results for a list of contact
// ids. Pure read — no provider calls, no charges. Used by Send Mail
// modal to populate pills on open without spending a cent.
// Returns a map keyed by contact id; contacts without a cached
// result are simply absent from the map.
export async function fetchCachedVerifyResults(
  contactIds: string[]
): Promise<
  | { ok: true; results: Record<string, AddressVerifyResult> }
  | { ok: false; error: string }
> {
  if (contactIds.length === 0) {
    return { ok: true, results: {} };
  }
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("contacts")
      .select("id, address_verify_result")
      .in("id", contactIds);
    if (error) return { ok: false, error: error.message };
    const results: Record<string, AddressVerifyResult> = {};
    for (const row of data ?? []) {
      const id = row.id as string;
      const cached = row.address_verify_result as AddressVerifyResult | null;
      if (cached) results[id] = cached;
    }
    return { ok: true, results };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Cache read failed",
    };
  }
}
