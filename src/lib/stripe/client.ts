import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  cached = new Stripe(secret, {
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });
  return cached;
}

export function getStripePriceId(): string {
  const id = process.env.STRIPE_PRICE_ID;
  if (!id) throw new Error("STRIPE_PRICE_ID is not set");
  return id;
}

export type BillingStatus =
  | "none"
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled";

export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): BillingStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "incomplete";
  }
}
