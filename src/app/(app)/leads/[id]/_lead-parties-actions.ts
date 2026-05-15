"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toE164 } from "@/lib/phone";
import type { LeadPartyRole } from "@/lib/leads/lead-parties-types";

export type LeadPartyInput = {
  id?: string | null;
  lead_id: string;
  role: LeadPartyRole;
  custom_role_label?: string | null;
  name: string;
  organization?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export async function upsertLeadParty(
  input: LeadPartyInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = await createClient();
  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };
  if (input.role === "other" && !(input.custom_role_label ?? "").trim()) {
    return { ok: false, error: "Custom role label required for 'Other'." };
  }

  const row = {
    lead_id: input.lead_id,
    role: input.role,
    custom_role_label:
      input.role === "other"
        ? (input.custom_role_label ?? "").trim()
        : null,
    name,
    organization: input.organization?.trim() || null,
    email: input.email?.trim().toLowerCase() || null,
    phone: toE164(input.phone) || null,
    notes: input.notes?.trim() || null,
  };

  if (input.id) {
    const { error } = await sb.from("lead_parties").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/leads/${input.lead_id}`);
    return { ok: true, id: input.id };
  }
  const { data, error } = await sb
    .from("lead_parties")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "insert failed" };
  }
  revalidatePath(`/leads/${input.lead_id}`);
  return { ok: true, id: data.id as string };
}

export async function deleteLeadParty(
  id: string,
  leadId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = await createClient();
  const { error } = await sb.from("lead_parties").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/leads/${leadId}`);
  return { ok: true };
}
