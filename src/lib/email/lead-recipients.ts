import "server-only";
import { createClient } from "@/lib/supabase/server";
import { splitFullName } from "@/lib/mail/address";
import { activeSurplus } from "@/lib/leads/active-surplus";
import {
  LEAD_PARTY_ROLE_LABELS,
  type LeadPartyRole,
} from "@/lib/leads/lead-parties-types";
import type { MergeContext } from "@/lib/mail/merge";

export type EmailRecipientCandidate = {
  id: string;
  contact_id: string;
  name: string;
  email: string;
  relation: string;
  merge_context: MergeContext;
};

export async function buildLeadEmailCandidates(
  leadId: string
): Promise<{
  candidates: EmailRecipientCandidate[];
  baseLeadContext: MergeContext;
}> {
  const sb = await createClient();
  const [contactsRes, leadRes, ownersRes, relRes, partyRes, attyRes] = await Promise.all([
    sb
      .from("contacts")
      .select("id, owner_id, relative_id, lead_party_id, lead_id, channel, value")
      .eq("lead_id", leadId)
      .eq("channel", "email"),
    sb
      .from("leads")
      .select(
        "id, lead_id, county, state, address, city, zip, parcel_number, case_number, sale_date, estimated_surplus, confirmed_surplus, source_surplus, closing_bid, attorney_id"
      )
      .eq("id", leadId)
      .maybeSingle(),
    sb.from("owners").select("id, full_name").eq("lead_id", leadId),
    sb
      .from("relatives")
      .select("id, full_name, relationship, email")
      .eq("lead_id", leadId),
    sb
      .from("lead_parties")
      .select("id, name, role, custom_role_label, email")
      .eq("lead_id", leadId),
    sb
      .from("leads")
      .select("attorneys ( id, name, email )")
      .eq("id", leadId)
      .maybeSingle(),
  ]);

  const ownersById = new Map<string, string>();
  for (const o of ownersRes.data ?? []) {
    ownersById.set(o.id as string, ((o.full_name as string | null) ?? "").trim());
  }
  const relativesById = new Map<
    string,
    { full_name: string; relationship: string | null; email: string | null }
  >();
  for (const r of relRes.data ?? []) {
    relativesById.set(r.id as string, {
      full_name: ((r.full_name as string | null) ?? "").trim(),
      relationship: (r.relationship as string | null) ?? null,
      email: ((r.email as string | null) ?? "").trim() || null,
    });
  }
  const leadPartiesById = new Map<
    string,
    { name: string; role: LeadPartyRole; custom_role_label: string | null; email: string | null }
  >();
  for (const lp of partyRes.data ?? []) {
    leadPartiesById.set(lp.id as string, {
      name: ((lp.name as string | null) ?? "").trim(),
      role: (lp.role as LeadPartyRole) ?? "other",
      custom_role_label: (lp.custom_role_label as string | null) ?? null,
      email: ((lp.email as string | null) ?? "").trim() || null,
    });
  }

  const lead = leadRes.data ?? null;
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

  const street = ((lead?.address as string | null) ?? "").trim() || null;
  const city = ((lead?.city as string | null) ?? "").trim() || null;
  const region = ((lead?.state as string | null) ?? "").trim() || null;
  const zip = ((lead?.zip as string | null) ?? "").trim() || null;
  const cityStateZip =
    city && region && zip ? `${city}, ${region} ${zip}` : null;
  const fullPropertyAddress =
    street && cityStateZip ? `${street}, ${cityStateZip}` : street;
  const activeSurplusValue = surplus && surplus.basis !== "none" ? surplus.value : null;

  const baseLeadContext: MergeContext = {
    "lead.id": (lead?.lead_id as string | null) ?? null,
    "lead.case_id": (lead?.lead_id as string | null) ?? null,
    "lead.property_address": fullPropertyAddress,
    "lead.property_full_address": fullPropertyAddress,
    "lead.property_street_address": street,
    "lead.property_city": city,
    "lead.property_state": region,
    "lead.property_zip": zip,
    "lead.property_city_state_zip": cityStateZip,
    "lead.county": (lead?.county as string | null) ?? null,
    "lead.state": region,
    "lead.case_number": (lead?.case_number as string | null) ?? null,
    "lead.parcel_number": (lead?.parcel_number as string | null) ?? null,
    "lead.sale_date": (lead?.sale_date as string | null) ?? null,
    "lead.closing_bid":
      lead?.closing_bid != null
        ? `$${Number(lead.closing_bid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : null,
    "lead.estimated_surplus":
      activeSurplusValue != null
        ? `$${Math.round(activeSurplusValue).toLocaleString()}`
        : null,
    "lead.confirmed_surplus":
      lead?.confirmed_surplus != null
        ? `$${Math.round(Number(lead.confirmed_surplus)).toLocaleString()}`
        : null,
    "lead.owner_range": ownerRange,
  };

  const candidates: EmailRecipientCandidate[] = [];
  const seenEmails = new Set<string>();
  for (const c of contactsRes.data ?? []) {
    const email = ((c.value as string | null) ?? "").trim();
    if (!email) continue;
    let fullName = "";
    let relation = "";
    const ownerFk = (c.owner_id as string | null) ?? null;
    const relativeFk = (c.relative_id as string | null) ?? null;
    const leadPartyFk = (c.lead_party_id as string | null) ?? null;
    if (relativeFk) {
      const rel = relativesById.get(relativeFk);
      fullName = (rel?.full_name || "").trim() || "Unknown";
      relation = (rel?.relationship ?? "").trim() || "Relative";
    } else if (leadPartyFk) {
      const lp = leadPartiesById.get(leadPartyFk);
      fullName = (lp?.name || "").trim() || "Recipient";
      relation =
        lp?.role === "other"
          ? (lp.custom_role_label ?? "").trim() || "Other"
          : lp
            ? LEAD_PARTY_ROLE_LABELS[lp.role]
            : "Contact";
    } else if (ownerFk) {
      fullName = (ownersById.get(ownerFk) || "").trim() || "Recipient";
      relation = "Owner";
    } else {
      fullName = "Contact";
      relation = "Contact";
    }
    const { first_name, last_name } = splitFullName(fullName);
    const merge_context: MergeContext = {
      ...baseLeadContext,
      "contact.first_name": first_name,
      "contact.last_name": last_name,
      "contact.full_name": fullName,
      "contact.email": email,
    };
    const lcEmail = email.toLowerCase();
    if (seenEmails.has(lcEmail)) continue;
    seenEmails.add(lcEmail);
    candidates.push({
      id: c.id as string,
      contact_id: c.id as string,
      name: fullName,
      email,
      relation,
      merge_context,
    });
  }

  // Backfill from every other source of emails on the lead so the picker
  // matches what the Contacts panel surfaces: lead_parties, relatives, the
  // Moss attorney on the case. Dedupe by lowercased email.
  function pushCandidate(opts: {
    id: string;
    fullName: string;
    email: string;
    relation: string;
  }) {
    const lcEmail = opts.email.toLowerCase();
    if (seenEmails.has(lcEmail)) return;
    seenEmails.add(lcEmail);
    const { first_name, last_name } = splitFullName(opts.fullName);
    candidates.push({
      id: opts.id,
      contact_id: opts.id,
      name: opts.fullName,
      email: opts.email,
      relation: opts.relation,
      merge_context: {
        ...baseLeadContext,
        "contact.first_name": first_name,
        "contact.last_name": last_name,
        "contact.full_name": opts.fullName,
        "contact.email": opts.email,
      },
    });
  }

  for (const [partyId, lp] of leadPartiesById) {
    if (!lp.email) continue;
    pushCandidate({
      id: partyId,
      fullName: lp.name || "Recipient",
      email: lp.email,
      relation:
        lp.role === "other"
          ? (lp.custom_role_label ?? "").trim() || "Other"
          : LEAD_PARTY_ROLE_LABELS[lp.role],
    });
  }

  for (const [relativeId, rel] of relativesById) {
    if (!rel.email) continue;
    pushCandidate({
      id: relativeId,
      fullName: rel.full_name || "Relative",
      email: rel.email,
      relation: (rel.relationship ?? "").trim() || "Relative",
    });
  }

  const attyData = attyRes?.data as
    | { attorneys?: { id: string; name: string; email: string | null } | { id: string; name: string; email: string | null }[] | null }
    | null;
  const atty = Array.isArray(attyData?.attorneys)
    ? attyData?.attorneys[0]
    : attyData?.attorneys ?? null;
  if (atty?.email) {
    pushCandidate({
      id: `attorney-${atty.id}`,
      fullName: atty.name || "Attorney",
      email: atty.email,
      relation: "Moss's Attorney",
    });
  }

  return { candidates, baseLeadContext };
}
