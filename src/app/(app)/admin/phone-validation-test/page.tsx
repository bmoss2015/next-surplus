import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { getValidationUsage, DEFAULT_CREDIT_COST_USD } from "@/lib/phone-validate";
import { HarnessClient } from "./_components/HarnessClient";

export const dynamic = "force-dynamic";

// Admin-only phone validation test harness. Lets Bree exercise every validator
// path (fresh number, repeat number for cache hit, invalid number, backfill
// preview) from a single page so she doesn't have to click through real lead
// cards to verify behavior after every fix.
export default async function PhoneValidationTestPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/");
  if (!profile.orgId) redirect("/");

  const initialUsage = await getValidationUsage(profile.orgId);

  return (
    <HarnessClient
      initialUsage={initialUsage}
      costPerCreditUsd={DEFAULT_CREDIT_COST_USD}
    />
  );
}
