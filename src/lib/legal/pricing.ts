import { createServiceClient } from "@/lib/supabase/service";

export type LegalPricing = {
  monthlyCents: number;
  monthlyFormatted: string;
};

export async function fetchLegalPricing(): Promise<LegalPricing> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("app_pricing_config")
    .select("subscription_monthly_cents")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error(
      `fetchLegalPricing: app_pricing_config row id=1 missing (${error?.message ?? "no data"})`
    );
  }

  const cents = Number(data.subscription_monthly_cents);
  return {
    monthlyCents: cents,
    monthlyFormatted: formatUsdCents(cents),
  };
}

function formatUsdCents(cents: number): string {
  const dollars = cents / 100;
  if (Number.isInteger(dollars)) {
    return `$${dollars}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}
