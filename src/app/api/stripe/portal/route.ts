import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const sb = createServiceClient();
  const { data: org } = await sb
    .from("orgs")
    .select("stripe_customer_id")
    .eq("id", profile.orgId)
    .single();
  const customerId = (org?.stripe_customer_id as string | null) ?? null;
  if (!customerId) {
    return NextResponse.json(
      { error: "No subscription on file. Start a trial first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
