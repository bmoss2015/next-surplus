import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchProviderCosts, fetchCustomerPricing } from "@/lib/owner/fetch";
import { OwnerView } from "./_components/OwnerView";

// Owner area entry point. Owner-only — admins and members hit redirect.
// The sidebar already hides the nav item, this is the URL-typed defense.
//
// All owner-scoped data is fetched here (server) in parallel, then handed
// to <OwnerView> which manages the sub-rail / active-panel state on the
// client. Pattern mirrors /settings.

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isOwner) redirect("/");

  const [providerCosts, customerPricing] = await Promise.all([
    fetchProviderCosts(),
    fetchCustomerPricing(),
  ]);

  return (
    <OwnerView data={{ providerCosts, customerPricing }} />
  );
}
