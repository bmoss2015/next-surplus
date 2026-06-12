import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BillingStatus } from "@/lib/stripe/client";

export type OrgBilling = {
  status: BillingStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  gracePeriodDays: number;
};

export async function fetchOrgBilling(): Promise<OrgBilling> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("orgs")
    .select(
      "billing_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, current_period_end, grace_period_days"
    )
    .single();
  if (error) throw error;
  const raw = (data.billing_status as string | null) ?? "none";
  const status: BillingStatus =
    raw === "incomplete" ||
    raw === "trialing" ||
    raw === "active" ||
    raw === "past_due" ||
    raw === "cancelled"
      ? raw
      : "none";
  return {
    status,
    stripeCustomerId: (data.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (data.stripe_subscription_id as string | null) ?? null,
    trialEndsAt: (data.trial_ends_at as string | null) ?? null,
    currentPeriodEnd: (data.current_period_end as string | null) ?? null,
    gracePeriodDays: Number(data.grace_period_days ?? 7),
  };
}
