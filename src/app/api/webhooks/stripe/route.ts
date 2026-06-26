import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/client";
import { rateLimit, ipFromRequest } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const limit = rateLimit(`stripe-webhook:${ip}`, 100, 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json(
      { error: "missing_signature_or_secret" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_signature", detail: (err as Error).message },
      { status: 400 }
    );
  }

  const admin = createServiceClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = (sub.metadata?.org_id as string | undefined) ?? null;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      if (orgId) {
        await admin
          .from("orgs")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            subscription_status: sub.status,
          })
          .eq("id", orgId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = (sub.metadata?.org_id as string | undefined) ?? null;
      if (orgId) {
        await admin
          .from("orgs")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("id", orgId);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (customerId) {
        await admin
          .from("orgs")
          .update({
            subscription_status: "active",
            last_invoice_paid_at: new Date(
              invoice.status_transitions?.paid_at
                ? invoice.status_transitions.paid_at * 1000
                : Date.now()
            ).toISOString(),
          })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (customerId) {
        await admin
          .from("orgs")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = (session.metadata?.org_id as string | undefined) ?? null;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;
      if (orgId && customerId) {
        await admin
          .from("orgs")
          .update({
            stripe_customer_id: customerId,
            ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
          })
          .eq("id", orgId);
      }
      break;
    }

    default:
      console.warn(
        `[stripe-webhook] unhandled event type: ${event.type} (id=${event.id})`
      );
      break;
  }

  return NextResponse.json({ received: true });
}
