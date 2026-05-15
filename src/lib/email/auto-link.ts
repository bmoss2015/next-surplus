import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Returns the lead_id that should be auto-linked to a new conversation, if any.
// Returns null when nothing matches or when the sender appears on multiple
// active leads (ambiguous — surface for manual triage).
//
// Lookup order:
//   1. owners.id via contacts.value matching the address + lead from contacts.lead_id
//   2. relatives.email (via relatives.lead_id)
//   3. lead_parties.email
//   4. attorneys.email — only considered when exactly one active lead is using
//      that attorney (otherwise too ambiguous to auto-link).
export async function findLeadForAddress(
  sb: SupabaseClient,
  opts: { orgId: string; address: string }
): Promise<string | null> {
  const addr = opts.address.toLowerCase().trim();
  if (!addr) return null;

  // Helper that resolves an array of candidate lead ids and returns one only
  // if it's unique (and the lead is not soft-deleted / not lost).
  async function pickUniqueActive(leadIds: string[]): Promise<string | null> {
    const unique = Array.from(new Set(leadIds));
    if (unique.length === 0) return null;
    const { data } = await sb
      .from("leads")
      .select("id")
      .in("id", unique)
      .eq("archived", false)
      .neq("stage", "lost")
      .eq("org_id", opts.orgId);
    const active = (data ?? []).map((r) => r.id as string);
    return active.length === 1 ? active[0] : null;
  }

  // 1. contacts (email channel for owners)
  const { data: contactRows } = await sb
    .from("contacts")
    .select("lead_id")
    .eq("org_id", opts.orgId)
    .eq("channel", "email")
    .ilike("value", addr);
  if (contactRows && contactRows.length) {
    const hit = await pickUniqueActive(contactRows.map((r) => r.lead_id as string));
    if (hit) return hit;
  }

  // 2. relatives
  const { data: relRows } = await sb
    .from("relatives")
    .select("lead_id")
    .eq("org_id", opts.orgId)
    .ilike("email", addr);
  if (relRows && relRows.length) {
    const hit = await pickUniqueActive(relRows.map((r) => r.lead_id as string));
    if (hit) return hit;
  }

  // 3. lead_parties
  const { data: partyRows } = await sb
    .from("lead_parties")
    .select("lead_id")
    .eq("org_id", opts.orgId)
    .ilike("email", addr);
  if (partyRows && partyRows.length) {
    const hit = await pickUniqueActive(partyRows.map((r) => r.lead_id as string));
    if (hit) return hit;
  }

  // 4. attorneys — only auto-link when exactly one currently-active lead uses
  // this attorney as its assigned attorney.
  const { data: atyRows } = await sb
    .from("attorneys")
    .select("id")
    .eq("org_id", opts.orgId)
    .ilike("email", addr);
  if (atyRows && atyRows.length === 1) {
    const { data: leadsForAtty } = await sb
      .from("leads")
      .select("id")
      .eq("org_id", opts.orgId)
      .eq("attorney_id", atyRows[0].id)
      .eq("archived", false)
      .neq("stage", "lost");
    if (leadsForAtty && leadsForAtty.length === 1) {
      return leadsForAtty[0].id as string;
    }
  }

  return null;
}
