"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import type { SaleType } from "@/lib/leads/types";

export async function createLead(input: {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  sale_type: SaleType;
  sale_date: string | null;
  closing_bid: number | null;
  outstanding_debt: number | null;
  court_costs: number | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const sb = await createClient();
  // Fix BB: a manually created lead is assigned to whoever created it.
  const assignedTo = (await getCurrentProfile())?.id ?? null;
  const { data, error } = await sb
    .from("leads")
    .insert({
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      county: input.county,
      sale_type: input.sale_type,
      sale_date: input.sale_date,
      closing_bid: input.closing_bid,
      outstanding_debt: input.outstanding_debt,
      court_costs: input.court_costs,
      lead_source: "Manual",
      assigned_to: assignedTo,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/leads");
  return { ok: true, id: data.id as string };
}
