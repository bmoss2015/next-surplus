import "server-only";
import { createClient } from "@/lib/supabase/server";
import { smartParseAddress, splitFullName } from "./address";
import { activeSurplus } from "@/lib/leads/active-surplus";
import type { SendMailModalRecipient } from "@/components/mail/SendMailModal";

// Collects every plausible mail recipient for a given lead — owners,
// relatives, and lead_parties with a usable address. Used by the Send Mail
// button on the lead detail page so the modal can present the full picker.
export async function buildLeadSendMailCandidates(
  leadId: string
): Promise<SendMailModalRecipient[]> {
  const sb = await createClient();
  const [contactsRes, relRes, partyRes, leadRes, ownersRes] = await Promise.all([
    sb
      .from("contacts")
      .select("id, owner_id, lead_id, channel, value, recipient_label, mailed, mailed_at")
      .eq("lead_id", leadId)
      .eq("channel", "mailing_address"),
    sb
      .from("relatives")
      .select("id, lead_id, full_name, street, city, state, zip")
      .eq("lead_id", leadId),
    sb
      .from("lead_parties")
      .select(
        "id, lead_id, name, organization, role, street, city, state, zip"
      )
      .eq("lead_id", leadId),
    sb
      .from("leads")
      .select(
        "id, county, state, address, parcel_number, case_number, sale_date, estimated_surplus, confirmed_surplus, source_surplus, closing_bid"
      )
      .eq("id", leadId)
      .maybeSingle(),
    sb.from("owners").select("id, full_name").eq("lead_id", leadId),
  ]);

  // Owner lookup so we can fall back to the owner's real name when a
  // mailing-address row has no recipient_label (the common case for rows
  // created by the legacy importer, which didn't populate it).
  const ownersById = new Map<string, string>();
  for (const o of ownersRes.data ?? []) {
    ownersById.set(o.id as string, ((o.full_name as string | null) ?? "").trim());
  }

  const lead = leadRes.data ?? null;
  // Owner-take-home range for mail templates only. Confirmed > source >
  // computed via activeSurplus(); 35% low / 20% high deducted as the
  // recovery-fee bracket. Never rendered in the CRM UI per CLAUDE.md —
  // the only consumer is {{lead.owner_range}} in mailer HTML.
  const surplus = lead
    ? activeSurplus({
        confirmed_surplus: (lead.confirmed_surplus as number | null) ?? null,
        estimated_surplus: (lead.estimated_surplus as number | null) ?? null,
        closing_bid: (lead.closing_bid as number | null) ?? null,
        source_surplus: (lead.source_surplus as number | null) ?? null,
      })
    : null;
  const ownerRange =
    surplus && surplus.basis !== "none" && surplus.value > 0
      ? `$${Math.round(surplus.value * 0.65).toLocaleString()} – $${Math.round(surplus.value * 0.8).toLocaleString()}`
      : null;
  const leadContext: Record<string, string | number | null | undefined> = {
    "lead.id": (lead?.id as string | null) ?? null,
    "lead.property_address": (lead?.address as string | null) ?? null,
    "lead.county": (lead?.county as string | null) ?? null,
    "lead.state": (lead?.state as string | null) ?? null,
    "lead.case_number": (lead?.case_number as string | null) ?? null,
    "lead.parcel_number": (lead?.parcel_number as string | null) ?? null,
    "lead.sale_date": (lead?.sale_date as string | null) ?? null,
    "lead.estimated_surplus":
      lead?.estimated_surplus != null
        ? `$${Number(lead.estimated_surplus).toLocaleString()}`
        : null,
    "lead.owner_range": ownerRange,
  };

  const out: SendMailModalRecipient[] = [];

  // 1. Mailing address rows from contacts table (manually-added envelope-
  //    addressed entries). These are the primary outreach surface.
  for (const c of contactsRes.data ?? []) {
    const value = (c.value as string | null) ?? "";
    if (!value) continue;
    const parsed = smartParseAddress(value);
    if (!parsed) continue;
    const label = ((c.recipient_label as string | null) ?? "").trim();
    const nameFromLabel = label.replace(/\s*\(.*?\)\s*$/, "").trim();
    // Some legacy rows have garbage in the label — e.g. the literal string
    // "Owner" with no actual name, which would render "Dear Owner" on the
    // letter. Treat any bare relation word as "no name" so the owner
    // lookup below kicks in.
    const RELATION_WORDS = new Set([
      "owner",
      "co-owner",
      "co owner",
      "relative",
      "spouse",
      "heir",
      "executor",
      "recipient",
      "contact",
    ]);
    const looksLikeRelation = RELATION_WORDS.has(nameFromLabel.toLowerCase());
    // Fallback chain: real name in label → owner row's full name → generic.
    const ownerName = ownersById.get(c.owner_id as string) ?? "";
    const nameOnly =
      (!looksLikeRelation && nameFromLabel) || ownerName || "Recipient";
    // Derive the relation chip shown in the picker. If the stored label
    // ends with "(Something)" use that; otherwise if the whole label IS a
    // relation word ("Owner"), use that; otherwise default to "Owner"
    // since owner_id always points at an owner record.
    const relationMatch = label.match(/\(([^)]+)\)\s*$/);
    const relation = relationMatch
      ? relationMatch[1].trim()
      : looksLikeRelation
        ? nameFromLabel
        : "Owner";
    const { first_name, last_name } = splitFullName(nameOnly);
    out.push({
      key: `contact:${c.id}`,
      lead_id: c.lead_id as string,
      relation,
      mailed: Boolean(c.mailed),
      mailed_at: (c.mailed_at as string | null) ?? null,
      contact: {
        first_name,
        last_name,
        full_name: nameOnly,
        line1: parsed.line1,
        line2: parsed.line2,
        city: parsed.city,
        state: parsed.state,
        postal_code: parsed.postal_code,
      },
      lead: leadContext,
    });
  }

  // 2. Relatives with a street address.
  for (const r of relRes.data ?? []) {
    const street = ((r.street as string | null) ?? "").trim();
    const city = ((r.city as string | null) ?? "").trim();
    const state = ((r.state as string | null) ?? "").trim();
    const zip = ((r.zip as string | null) ?? "").trim();
    if (!street || !city || !state || !zip) continue;
    const fullName = ((r.full_name as string | null) ?? "Unknown").trim();
    const { first_name, last_name } = splitFullName(fullName);
    out.push({
      key: `relative:${r.id}`,
      relative_id: r.id as string,
      lead_id: r.lead_id as string,
      relation: "Relative",
      mailed: false,
      mailed_at: null,
      contact: {
        first_name,
        last_name,
        full_name: fullName,
        line1: street,
        line2: null,
        city,
        state,
        postal_code: zip,
      },
      lead: leadContext,
    });
  }

  // 3. Lead parties (county clerks etc.) with an address. The new address
  //    columns (street/city/state/zip) were added by migration 0103.
  for (const p of partyRes.data ?? []) {
    const street = ((p.street as string | null) ?? "").trim();
    const city = ((p.city as string | null) ?? "").trim();
    const state = ((p.state as string | null) ?? "").trim();
    const zip = ((p.zip as string | null) ?? "").trim();
    if (!street || !city || !state || !zip) continue;
    const fullName = ((p.name as string | null) ?? "Recipient").trim();
    const { first_name, last_name } = splitFullName(fullName);
    const partyRole = ((p.role as string | null) ?? "").trim();
    out.push({
      key: `party:${p.id}`,
      lead_party_id: p.id as string,
      lead_id: p.lead_id as string,
      relation: partyRole || "Contact",
      mailed: false,
      mailed_at: null,
      contact: {
        first_name,
        last_name,
        full_name: fullName,
        line1: street,
        line2: null,
        city,
        state,
        postal_code: zip,
      },
      lead: leadContext,
    });
  }

  return out;
}
