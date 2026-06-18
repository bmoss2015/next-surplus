import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { requireOwner } from "@/lib/auth/current-user";
import type { LobPricing } from "@/lib/mail/types";

// Owner-only data fetchers. Everything in this module assumes the caller is
// the SaaS operator (role = 'owner') and reads cross-org. Always gate with
// requireOwner() before calling. Uses the service client so RLS doesn't
// have to be relaxed for owner reads — the gate is the function itself.

export type CustomerPricingData = {
  subscription_monthly_cents: number;
  customer_mail_pricing_cents: LobPricing;
  wholesale_pricing_cents: LobPricing | null;
  wholesale_last_checked_at: string | null;
};

const DEFAULT_CUSTOMER_PRICING: LobPricing = {
  tier_label: "Standard",
  check_base: 145,
  check_extra_attachment_page: 30,
  letter_first_class_bw: 125,
  letter_first_class_color: 145,
  letter_standard_bw: 99,
  letter_standard_color: 118,
  letter_certified_bw: 175,
  letter_certified_color: 195,
  letter_extra_page_bw: 15,
  letter_extra_page_color: 30,
};

export async function fetchCustomerPricing(): Promise<CustomerPricingData> {
  const gate = await requireOwner();
  if (!gate.ok) {
    return {
      subscription_monthly_cents: 7900,
      customer_mail_pricing_cents: DEFAULT_CUSTOMER_PRICING,
      wholesale_pricing_cents: null,
      wholesale_last_checked_at: null,
    };
  }
  const admin = createServiceClient();
  const { data } = await admin
    .from("app_pricing_config")
    .select(
      "subscription_monthly_cents, customer_mail_pricing_cents, wholesale_pricing_cents, wholesale_last_checked_at"
    )
    .eq("id", 1)
    .maybeSingle();
  return {
    subscription_monthly_cents:
      (data?.subscription_monthly_cents as number | null) ?? 7900,
    customer_mail_pricing_cents:
      (data?.customer_mail_pricing_cents as LobPricing | null) ??
      DEFAULT_CUSTOMER_PRICING,
    wholesale_pricing_cents:
      (data?.wholesale_pricing_cents as LobPricing | null) ?? null,
    wholesale_last_checked_at:
      (data?.wholesale_last_checked_at as string | null) ?? null,
  };
}

export type ProviderCostsData = {
  // Lob's published Developer-tier rates from the weekly cron. Source of
  // truth for "what does Lob charge us per piece". null if the cron has
  // not run yet (fresh install) or fetch failed.
  lob: {
    published: LobPricing | null;
    lastCheckedAt: string | null;
  };
};

export async function fetchProviderCosts(): Promise<ProviderCostsData> {
  const gate = await requireOwner();
  if (!gate.ok) {
    return {
      lob: { published: null, lastCheckedAt: null },
    };
  }
  const admin = createServiceClient();

  const { data: lobRow } = await admin
    .from("orgs")
    .select("lob_published_pricing_cents, lob_pricing_last_checked_at")
    .order("lob_pricing_last_checked_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return {
    lob: {
      published: (lobRow?.lob_published_pricing_cents as LobPricing | null) ?? null,
      lastCheckedAt: (lobRow?.lob_pricing_last_checked_at as string | null) ?? null,
    },
  };
}
