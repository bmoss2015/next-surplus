"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { detectDnsProvider, subdomainFor } from "./detect";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function detectAndPrepare(
  rawDomain: string
): Promise<
  ActionResult<{
    domain: string;
    subdomain: string;
    providerId: string;
    providerName: string;
    tier: string;
    nameservers: string[];
  }>
> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const result = await detectDnsProvider(rawDomain);
  if (result.error) return { ok: false, error: result.error };

  return {
    ok: true,
    data: {
      domain: result.domain,
      subdomain: subdomainFor(result.domain),
      providerId: result.provider.id,
      providerName: result.provider.name,
      tier: result.provider.tier,
      nameservers: result.nameservers,
    },
  };
}

export async function startSubdomainDelegation(
  domain: string
): Promise<
  ActionResult<{
    id: string;
    subdomain: string;
    nsRecords: string[];
  }>
> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: profile } = await sb
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return { ok: false, error: "No organization" };

  const detected = await detectDnsProvider(domain);
  if (detected.error) return { ok: false, error: detected.error };

  const subdomain = subdomainFor(detected.domain);
  const nsRecords = await provisionRoute53Zone(subdomain);

  const svc = createServiceClient();
  const { data: inserted, error } = await svc
    .from("customer_sending_domains")
    .upsert(
      {
        org_id: profile.org_id,
        domain: detected.domain,
        subdomain,
        tier: "tier_c_delegation",
        detected_provider: detected.provider.id,
        status: "pending",
        ns_records: nsRecords,
      },
      { onConflict: "org_id,domain" }
    )
    .select("id")
    .maybeSingle();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }

  revalidatePath("/settings");
  return {
    ok: true,
    data: {
      id: inserted.id as string,
      subdomain,
      nsRecords,
    },
  };
}

export async function checkDomainVerification(
  id: string
): Promise<
  ActionResult<{
    status: "pending" | "verifying" | "verified" | "failed";
    lastError: string | null;
  }>
> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const svc = createServiceClient();
  const { data: row } = await svc
    .from("customer_sending_domains")
    .select("id, subdomain, status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, error: "Domain not found" };

  const verified = await checkSesIdentityVerified(row.subdomain as string);

  const next: "verifying" | "verified" =
    verified ? "verified" : "verifying";

  await svc
    .from("customer_sending_domains")
    .update({
      status: next,
      verified_at: verified ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath("/settings");
  return { ok: true, data: { status: next, lastError: null } };
}

export async function disconnectSendingDomain(
  id: string
): Promise<ActionResult> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const svc = createServiceClient();
  const { error } = await svc
    .from("customer_sending_domains")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true, data: undefined };
}

async function provisionRoute53Zone(subdomain: string): Promise<string[]> {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return realProvisionRoute53Zone(subdomain);
  }
  return [
    "ns-100.awsdns-12.com",
    "ns-1000.awsdns-34.org",
    "ns-1500.awsdns-56.net",
    "ns-2000.awsdns-78.co.uk",
  ];
}

async function realProvisionRoute53Zone(subdomain: string): Promise<string[]> {
  void subdomain;
  throw new Error("AWS Route 53 integration not wired yet");
}

async function checkSesIdentityVerified(subdomain: string): Promise<boolean> {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return realCheckSesIdentity(subdomain);
  }
  return false;
}

async function realCheckSesIdentity(subdomain: string): Promise<boolean> {
  void subdomain;
  return false;
}
