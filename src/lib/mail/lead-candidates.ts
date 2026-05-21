import "server-only";
import { createClient } from "@/lib/supabase/server";
import { smartParseAddress, splitFullName } from "./address";
import { activeSurplus } from "@/lib/leads/active-surplus";
import {
  LEAD_PARTY_ROLE_LABELS,
  type LeadPartyRole,
} from "@/lib/leads/lead-parties-types";
import type { SendMailModalRecipient } from "@/components/mail/SendMailModal";

// Since migration 0119, every mailing address lives in the contacts table
// with one of owner_id / relative_id / lead_party_id set. This builder reads
// only from contacts and joins to the source records to get the recipient
// name + relation chip.
export async function buildLeadSendMailCandidates(
  leadId: string
): Promise<SendMailModalRecipient[]> {
  const sb = await createClient();
  const [contactsRes, leadRes, ownersRes, relRes, partyRes] = await Promise.all([
    sb
      .from("contacts")
      .select(
        "id, owner_id, relative_id, lead_party_id, lead_id, channel, value, recipient_label, mailed, mailed_at"
      )
      .eq("lead_id", leadId)
      .eq("channel", "mailing_address"),
    sb
      .from("leads")
      .select(
        "id, county, state, address, parcel_number, case_number, sale_date, estimated_surplus, confirmed_surplus, source_surplus, closing_bid"
      )
      .eq("id", leadId)
      .maybeSingle(),
    sb.from("owners").select("id, full_name").eq("lead_id", leadId),
    sb
      .from("relatives")
      .select("id, full_name, relationship")
      .eq("lead_id", leadId),
    sb
      .from("lead_parties")
      .select("id, name, role, custom_role_label")
      .eq("lead_id", leadId),
  ]);

  const ownersById = new Map<string, string>();
  for (const o of ownersRes.data ?? []) {
    ownersById.set(o.id as string, ((o.full_name as string | null) ?? "").trim());
  }
  const relativesById = new Map<
    string,
    { full_name: string; relationship: string | null }
  >();
  for (const r of relRes.data ?? []) {
    relativesById.set(r.id as string, {
      full_name: ((r.full_name as string | null) ?? "").trim(),
      relationship: (r.relationship as string | null) ?? null,
    });
  }
  const leadPartiesById = new Map<
    string,
    { name: string; role: LeadPartyRole; custom_role_label: string | null }
  >();
  for (const lp of partyRes.data ?? []) {
    leadPartiesById.set(lp.id as string, {
      name: ((lp.name as string | null) ?? "").trim(),
      role: (lp.role as LeadPartyRole) ?? "other",
      custom_role_label: (lp.custom_role_label as string | null) ?? null,
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
  const leadContext: Record<string, string | number | null | undefined> = {
    "lead.id": (lead?.id as string | null) ?? null,
    "lead.property_address": (lead?.address as string | null) ?? null,
    "lead.county": (lead?.county as string | null) ?? null,
    "lead.state": (lead?.state as string | null) ?? null,
    "lead.case_number": (lead?.case_number as string | null) ?? null,
    "lead.parcel_number": (lead?.parcel_number as string | null) ?? null,
    "lead.sale_date": (lead?.sale_date as string | null) ?? null,
    "lead.closing_bid":
      lead?.closing_bid != null
        ? `$${Number(lead.closing_bid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : null,
    "lead.estimated_surplus":
      lead?.estimated_surplus != null
        ? `$${Number(lead.estimated_surplus).toLocaleString()}`
        : null,
    "lead.owner_range": ownerRange,
  };

  const out: SendMailModalRecipient[] = [];

  for (const c of contactsRes.data ?? []) {
    const value = (c.value as string | null) ?? "";
    if (!value) continue;
    const parsed = smartParseAddress(value);
    if (!parsed) continue;

    // Resolve the recipient name + relation chip from whichever FK is set.
    let fullName: string;
    let relation: string;
    let key: string;
    let relativeId: string | null = null;
    let leadPartyId: string | null = null;

    const relativeFk = (c.relative_id as string | null) ?? null;
    const leadPartyFk = (c.lead_party_id as string | null) ?? null;
    const ownerFk = (c.owner_id as string | null) ?? null;

    if (relativeFk) {
      const rel = relativesById.get(relativeFk);
      fullName = (rel?.full_name || "").trim() || "Unknown";
      relation = (rel?.relationship ?? "").trim() || "Relative";
      key = `contact:${c.id}`;
      relativeId = relativeFk;
    } else if (leadPartyFk) {
      const lp = leadPartiesById.get(leadPartyFk);
      fullName = (lp?.name || "").trim() || "Recipient";
      relation =
        lp?.role === "other"
          ? (lp.custom_role_label ?? "").trim() || "Other"
          : lp
            ? LEAD_PARTY_ROLE_LABELS[lp.role]
            : "Contact";
      key = `contact:${c.id}`;
      leadPartyId = leadPartyFk;
    } else if (ownerFk) {
      fullName = (ownersById.get(ownerFk) || "").trim() || "Recipient";
      relation = "Owner";
      key = `contact:${c.id}`;
    } else {
      // Pre-migration legacy rows with no FK at all — fall back to the
      // recipient_label parse.
      const label = ((c.recipient_label as string | null) ?? "").trim();
      const nameFromLabel = label.replace(/\s*\(.*?\)\s*$/, "").trim();
      fullName = nameFromLabel || "Recipient";
      const relationMatch = label.match(/\(([^)]+)\)\s*$/);
      relation = relationMatch ? relationMatch[1].trim() : "Recipient";
      key = `contact:${c.id}`;
    }

    const { first_name, last_name } = splitFullName(fullName);
    out.push({
      key,
      lead_id: c.lead_id as string,
      relative_id: relativeId,
      lead_party_id: leadPartyId,
      relation,
      mailed: Boolean(c.mailed),
      mailed_at: (c.mailed_at as string | null) ?? null,
      contact: {
        first_name,
        last_name,
        full_name: fullName,
        line1: parsed.line1,
        line2: parsed.line2,
        city: parsed.city,
        state: parsed.state,
        postal_code: parsed.postal_code,
      },
      lead: leadContext,
    });
  }

  return out;
}
