import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SendingDomainRow = {
  id: string;
  domain: string;
  subdomain: string;
  tier: "tier_a_direct" | "tier_b_domain_connect" | "tier_c_delegation" | "tier_d_manual";
  detected_provider: string | null;
  status: "pending" | "verifying" | "verified" | "failed";
  ns_records: string[] | null;
  last_error: string | null;
  verified_at: string | null;
  created_at: string;
};

export async function fetchSendingDomains(): Promise<SendingDomainRow[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("customer_sending_domains")
    .select(
      "id, domain, subdomain, tier, detected_provider, status, ns_records, last_error, verified_at, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as SendingDomainRow[]);
}

export async function fetchSendingDomain(id: string): Promise<SendingDomainRow | null> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("customer_sending_domains")
    .select(
      "id, domain, subdomain, tier, detected_provider, status, ns_records, last_error, verified_at, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as SendingDomainRow | null;
}
