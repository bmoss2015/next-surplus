import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchCustomerPricing } from "@/lib/owner/fetch";
import { fetchMailReport } from "@/lib/mail/reports";
import { OwnerView } from "./_components/OwnerView";

// Owner area entry point. Owner-only — admins and members hit redirect.
// The sidebar already hides the nav item, this is the URL-typed defense.

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isOwner) redirect("/");

  const [customerPricing, report] = await Promise.all([
    fetchCustomerPricing(),
    fetchMailReport({ range: "30d" }),
  ]);

  return <OwnerView data={{ customerPricing, report }} />;
}
