import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
  }

  const stripe = getStripe();
  let orgId: string | null = null;
  let subStatus: string | null = null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    orgId =
      (session.metadata?.org_id as string | undefined) ??
      (session.client_reference_id as string | null);

    if (typeof session.subscription === "string") {
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      subStatus = sub.status;
    } else if (session.subscription && typeof session.subscription === "object") {
      subStatus = session.subscription.status;
    }
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "stripe_lookup_failed",
      },
      { status: 200 }
    );
  }

  if (!orgId) {
    return NextResponse.json({ status: subStatus ?? "pending" });
  }

  const admin = createServiceClient();
  const { data: org } = await admin
    .from("orgs")
    .select("subscription_status, stripe_subscription_id")
    .eq("id", orgId)
    .maybeSingle();

  const status =
    org?.subscription_status ?? subStatus ?? "pending";

  return NextResponse.json({ status, orgId });
}
