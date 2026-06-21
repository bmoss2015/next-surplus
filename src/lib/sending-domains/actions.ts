"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { detectDnsProvider, subdomainFor } from "./detect";
import {
  awsConfigured,
  createHostedZone,
  createOrGetEmailIdentity,
  writeDkimCnames,
  getIdentityVerificationStatus,
  deleteSendingDomainResources,
} from "./aws";

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
  const svc = createServiceClient();

  if (!awsConfigured()) {
    const placeholderNs = [
      "ns-100.awsdns-12.com",
      "ns-1000.awsdns-34.org",
      "ns-1500.awsdns-56.net",
      "ns-2000.awsdns-78.co.uk",
    ];
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
          ns_records: placeholderNs,
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
        nsRecords: placeholderNs,
      },
    };
  }

  let zoneId: string;
  let nameservers: string[];
  let dkimTokens: string[];
  try {
    const zone = await createHostedZone(subdomain);
    zoneId = zone.zoneId;
    nameservers = zone.nameservers;
    const identity = await createOrGetEmailIdentity(subdomain);
    dkimTokens = identity.dkimTokens;
    await writeDkimCnames(zoneId, subdomain, dkimTokens);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `AWS provisioning failed: ${msg}` };
  }

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
        ns_records: nameservers,
        route53_zone_id: zoneId,
        aws_ses_identity_arn: subdomain,
        written_records: { dkim_tokens: dkimTokens },
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
      nsRecords: nameservers,
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

  if (!awsConfigured()) {
    await svc
      .from("customer_sending_domains")
      .update({ status: "verifying" })
      .eq("id", id);
    revalidatePath("/settings");
    return { ok: true, data: { status: "verifying", lastError: null } };
  }

  let verified = false;
  let dkimStatus = "NOT_STARTED";
  try {
    const ident = await getIdentityVerificationStatus(row.subdomain as string);
    verified = ident.verified;
    dkimStatus = ident.dkimStatus;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await svc
      .from("customer_sending_domains")
      .update({ status: "failed", last_error: msg })
      .eq("id", id);
    return { ok: false, error: msg };
  }

  const next: "verifying" | "verified" = verified ? "verified" : "verifying";

  await svc
    .from("customer_sending_domains")
    .update({
      status: next,
      verified_at: verified ? new Date().toISOString() : null,
      last_error: verified ? null : `DKIM ${dkimStatus}`,
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
  const { data: row } = await svc
    .from("customer_sending_domains")
    .select("subdomain, route53_zone_id")
    .eq("id", id)
    .maybeSingle();

  if (row && awsConfigured()) {
    await deleteSendingDomainResources(
      row.subdomain as string,
      (row.route53_zone_id as string | null) ?? null
    );
  }

  const { error } = await svc
    .from("customer_sending_domains")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true, data: undefined };
}
