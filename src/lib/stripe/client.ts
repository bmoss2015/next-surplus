import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  cached = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
  return cached;
}

export function priceIdFor(
  planTier: "founder" | "beta_founder" | "standard",
  interval: "monthly" | "annual"
): string {
  if (planTier === "founder") {
    return requireEnv("STRIPE_BETA_FOUNDER_MONTHLY_PRICE_ID");
  }
  if (planTier === "beta_founder") {
    return interval === "annual"
      ? requireEnv("STRIPE_BETA_FOUNDER_ANNUAL_PRICE_ID")
      : requireEnv("STRIPE_BETA_FOUNDER_MONTHLY_PRICE_ID");
  }
  return requireEnv("STRIPE_STANDARD_MONTHLY_PRICE_ID");
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}
