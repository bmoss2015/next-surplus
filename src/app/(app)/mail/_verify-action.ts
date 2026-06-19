"use server";

import { createServiceClient } from "@/lib/supabase/service";
import {
  verifyAddressCached,
  type AddressVerifyInput,
  type AddressVerifyResult,
} from "@/lib/mail/verify-address";
import { formatAddressForStorage } from "@/lib/mail/address";
import { getCurrentProfile } from "@/lib/auth/current-user";

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

// Persists a Lob-corrected address back to the contact row so the next
// time the operator opens Send Mail for this recipient, the corrected
// address is what loads, not the original undeliverable one. Writes the
// canonical "line1, city, ST ZIP" form into contacts.value. The existing
// BEFORE UPDATE trigger on public.contacts (migration 0133) clears the
// address_verify_* cache fields automatically when value changes, so the
// next verify call computes against the fresh address.
export async function persistContactAddress(input: {
  contact_id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  const line1 = input.line1.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  const postal_code = input.postal_code.trim();
  if (!line1 || !city || !state || !postal_code) {
    return { ok: false, error: "Address is missing required fields" };
  }
  const value = formatAddressForStorage({
    line1,
    line2: input.line2?.trim() ? input.line2.trim() : null,
    city,
    state,
    postal_code,
  });
  const admin = createServiceClient();
  const { error } = await admin
    .from("contacts")
    .update({ value })
    .eq("id", input.contact_id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
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
