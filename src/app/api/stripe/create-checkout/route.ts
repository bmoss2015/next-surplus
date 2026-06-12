import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, getStripePriceId } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const sb = createServiceClient();
  const { data: org, error: orgErr } = await sb
    .from("orgs")
    .select("id, name, email, stripe_customer_id, billing_status")
    .eq("id", profile.orgId)
    .single();
  if (orgErr || !org) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  const stripe = getStripe();

  let customerId = (org.stripe_customer_id as string | null) ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (org.email as string | null) ?? profile.email ?? undefined,
      name: (org.name as string | null) ?? undefined,
      metadata: { org_id: org.id as string },
    });
    customerId = customer.id;
    await sb
      .from("orgs")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getStripePriceId(), quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { org_id: org.id as string },
    },
    metadata: { org_id: org.id as string },
    success_url: `${SITE_URL}/settings?billing=trial-started`,
    cancel_url: `${SITE_URL}/settings?billing=checkout-cancelled`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a URL" }, { status: 500 });
  }
  return NextResponse.json({ url: session.url });
}
