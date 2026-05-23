"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireOwner } from "@/lib/auth/current-user";
import type { LobPricing } from "@/lib/mail/types";

// Owner-only server actions. Each must call requireOwner() before any
// write. RLS additionally enforces auth_is_owner() on app_pricing_config
// so this is defense-in-depth, not the only gate.

const PRICING_KEYS: Array<keyof Omit<LobPricing, "tier_label">> = [
  "check_base",
  "check_extra_attachment_page",
  "letter_first_class_bw",
  "letter_first_class_color",
  "letter_standard_bw",
  "letter_standard_color",
  "letter_certified_bw",
  "letter_certified_color",
  "letter_extra_page_bw",
  "letter_extra_page_color",
];

function sanitizePricing(input: unknown): LobPricing | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const out: Partial<LobPricing> = {
    tier_label:
      typeof src.tier_label === "string" && src.tier_label.trim().length > 0
        ? src.tier_label.trim()
        : "Standard",
  };
  for (const k of PRICING_KEYS) {
    const v = src[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return null;
    out[k] = Math.round(v);
  }
  return out as LobPricing;
}

export async function updateCustomerPricing(input: {
  subscription_monthly_cents: number;
  customer_mail_pricing_cents: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireOwner();
  if (!gate.ok) return { ok: false, error: gate.error };

  if (
    !Number.isFinite(input.subscription_monthly_cents) ||
    input.subscription_monthly_cents < 0
  ) {
    return { ok: false, error: "Subscription fee must be a positive number" };
  }
  const sanitized = sanitizePricing(input.customer_mail_pricing_cents);
  if (!sanitized) {
    return {
      ok: false,
      error: "Every mail rate must be a non-negative number",
    };
  }

  const admin = createServiceClient();
  const { error } = await admin
    .from("app_pricing_config")
    .update({
      subscription_monthly_cents: Math.round(input.subscription_monthly_cents),
      customer_mail_pricing_cents: sanitized,
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/owner");
  revalidatePath("/settings");
  return { ok: true };
}
