"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, priceIdFor } from "@/lib/stripe/client";

type SignupResult =
  | { ok: true; checkoutUrl: string; sessionId: string }
  | { ok: false; error: string };

export async function signUp(input: {
  email: string;
  password: string;
  firmName: string;
}): Promise<SignupResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const firmName = input.firmName.trim();

  if (!email || !password || !firmName) {
    return { ok: false, error: "Firm name, email, and password are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const sb = await createClient();
  const admin = createServiceClient();

  const { data: signUpData, error: signUpErr } = await sb.auth.signUp({
    email,
    password,
  });
  if (signUpErr || !signUpData.user) {
    return {
      ok: false,
      error: signUpErr?.message ?? "Could not create your account.",
    };
  }

  const { data: org, error: orgErr } = await admin
    .from("orgs")
    .insert({ name: firmName, plan_tier: "beta_founder" })
    .select("id")
    .single();
  if (orgErr || !org) {
    return {
      ok: false,
      error: orgErr?.message ?? "Could not create your workspace.",
    };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: signUpData.user.id,
    org_id: org.id,
    email,
    full_name: firmName,
    role: "owner",
  });
  if (profileErr) {
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
        "Account created but sign in failed. Try signing in from the login page.",
    };
  }

  const h = await headers();
  const origin =
    h.get("origin") ??
    `https://${h.get("host") ?? "app.nextsurplus.com"}`;

  const priceId = priceIdFor("beta_founder", "monthly");

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      subscription_data: {
        trial_period_days: 14,
        metadata: { org_id: org.id },
      },
      client_reference_id: org.id,
      metadata: { org_id: org.id },
      success_url: `${origin}/signup/verify?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/signup?canceled=1`,
      allow_promotion_codes: true,
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
