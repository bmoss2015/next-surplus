import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, mapSubscriptionStatus, type BillingStatus } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

async function findOrgIdByCustomer(customerId: string): Promise<string | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("orgs")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.id as string | null) ?? null;
}

async function updateOrgBilling(
  orgId: string,
  patch: {
    billing_status?: BillingStatus;
    stripe_subscription_id?: string | null;
    trial_ends_at?: string | null;
    current_period_end?: string | null;
  }
): Promise<void> {
  const sb = createServiceClient();
  await sb.from("orgs").update(patch).eq("id", orgId);
}

function toIsoOrNull(ts: number | null | undefined): string | null {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  let max: number | null = null;
  for (const item of sub.items.data) {
    const end = item.current_period_end;
    if (typeof end === "number" && (max === null || end > max)) max = end;
  }
  return max;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = getStripe();
  let event: Stripe.Event;
  if (secret) {
    if (!sig) {
      return NextResponse.json({ error: "missing signature" }, { status: 400 });
    }
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch {
      return NextResponse.json({ error: "bad signature" }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(rawBody) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "bad json" }, { status: 400 });
    }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId =
        (session.metadata?.org_id as string | undefined) ??
        (typeof session.customer === "string"
          ? await findOrgIdByCustomer(session.customer)
          : null);
      if (!orgId) break;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;
      await updateOrgBilling(orgId, {
        billing_status: "trialing",
        stripe_subscription_id: subscriptionId,
      });
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await updateOrgBilling(orgId, {
          billing_status: mapSubscriptionStatus(sub.status),
          trial_ends_at: toIsoOrNull(sub.trial_end),
          current_period_end: toIsoOrNull(subscriptionPeriodEnd(sub)),
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const orgId =
        (sub.metadata?.org_id as string | undefined) ??
        (await findOrgIdByCustomer(customerId));
      if (!orgId) break;
      await updateOrgBilling(orgId, {
        billing_status: mapSubscriptionStatus(sub.status),
        stripe_subscription_id: sub.id,
        trial_ends_at: toIsoOrNull(sub.trial_end),
        current_period_end: toIsoOrNull(subscriptionPeriodEnd(sub)),
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const orgId = await findOrgIdByCustomer(customerId);
      if (!orgId) break;
      await updateOrgBilling(orgId, {
        billing_status: "cancelled",
        stripe_subscription_id: null,
        current_period_end: toIsoOrNull(subscriptionPeriodEnd(sub)),
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
      if (!customerId) break;
      const orgId = await findOrgIdByCustomer(customerId);
      if (!orgId) break;
      await updateOrgBilling(orgId, { billing_status: "active" });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;
      if (!customerId) break;
      const orgId = await findOrgIdByCustomer(customerId);
      if (!orgId) break;
      await updateOrgBilling(orgId, { billing_status: "past_due" });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
