"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, priceIdFor } from "@/lib/stripe/client";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

type SignupResult =
  | { ok: true; checkoutUrl: string; sessionId: string }
  | { ok: false; error: string };

const AFFILIATE_COUPON_BY_REF: Record<string, string> = {
  NICK30: "NICK30",
};

function normalizeRef(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toUpperCase().slice(0, 32);
  return /^[A-Z0-9_-]+$/.test(cleaned) ? cleaned : null;
}

export async function signUp(input: {
  email: string;
  password: string;
  firmName: string;
  ref?: string | null;
}): Promise<SignupResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const firmName = input.firmName.trim();
  const ref = normalizeRef(input.ref);

  const ip = await clientIp();
  const limit = rateLimit(`signup:${ip}`, 10, 60 * 1000);
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many signup attempts. Try again in ${limit.retryAfterSec} seconds.`,
    };
  }

  if (!email || !password || !firmName) {
    return { ok: false, error: "Company name, email, and password are required." };
  }
  if (password.length < 12) {
    return { ok: false, error: "Password must be at least 12 characters." };
  }

  const sb = await createClient();
  const admin = createServiceClient();

  const { data: createData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !createData.user) {
    const msg = createErr?.message ?? "";
    if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
      return {
        ok: false,
        error: "An account with this email already exists. Try logging in.",
      };
    }
    return { ok: false, error: msg || "Could not create your account." };
  }

  const userId = createData.user.id;

  const { data: org, error: orgErr } = await admin
    .from("orgs")
    .insert({ name: firmName, plan_tier: "beta_founder" })
    .select("id")
    .single();
  if (orgErr || !org) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: orgErr?.message ?? "Could not create your workspace.",
    };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    org_id: org.id,
    email,
    full_name: firmName,
    role: "owner",
  });
  if (profileErr) {
    await admin.from("orgs").delete().eq("id", org.id);
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: profileErr.message ?? "Could not finish setting up your workspace.",
    };
  }

  const { error: signInErr } = await sb.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    return {
      ok: false,
      error:
        "Account created. Please sign in from the login page to continue.",
    };
  }

  const h = await headers();
  const origin = `https://${h.get("host") ?? "app.nextsurplus.com"}`;

  const priceId = priceIdFor("beta_founder", "monthly");

  const couponId = ref ? AFFILIATE_COUPON_BY_REF[ref] : undefined;
  const metadata: Record<string, string> = { org_id: org.id };
  if (ref) metadata.affiliate_ref = ref;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      subscription_data: {
        trial_period_days: 14,
        metadata,
      },
      client_reference_id: org.id,
      metadata,
      success_url: `${origin}/signup/verify?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/signup?canceled=1`,
      ...(couponId
        ? { discounts: [{ coupon: couponId }] }
        : { allow_promotion_codes: true }),
    });

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }

    return { ok: true, checkoutUrl: session.url, sessionId: session.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not start checkout.",
    };
  }
}
