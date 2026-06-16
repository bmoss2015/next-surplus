import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, priceIdFor } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;
  const email = userData.user.email ?? undefined;

  const body = (await req.json().catch(() => ({}))) as {
    interval?: "monthly" | "annual";
  };
  const interval: "monthly" | "annual" =
    body.interval === "annual" ? "annual" : "monthly";

  const admin = createServiceClient();
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single();
  if (profileErr || !profile?.org_id) {
    return NextResponse.json(
      { error: "profile_missing_org" },
      { status: 400 }
    );
  }

  const { data: org, error: orgErr } = await admin
    .from("orgs")
    .select("id, plan_tier, stripe_customer_id")
    .eq("id", profile.org_id)
    .single();
  if (orgErr || !org) {
    return NextResponse.json({ error: "org_not_found" }, { status: 404 });
  }

  const priceId = priceIdFor(
    org.plan_tier as "founder" | "beta_founder" | "standard",
    interval
  );

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://app.nextsurplus.com";

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: org.stripe_customer_id ?? undefined,
    customer_email: org.stripe_customer_id ? undefined : email,
    subscription_data: {
      trial_period_days: 14,
      metadata: { org_id: org.id },
    },
    client_reference_id: org.id,
    metadata: { org_id: org.id },
    success_url: `${origin}/settings?billing=success`,
    cancel_url: `${origin}/settings?billing=cancel`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
