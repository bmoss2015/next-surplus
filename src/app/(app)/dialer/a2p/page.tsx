import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchA2pBrand, fetchOrgInfo } from "@/lib/settings/fetch";
import { A2pWizard } from "./_components/A2pWizard";

export const dynamic = "force-dynamic";

export default async function A2pPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/settings");

  const [brand, orgInfo] = await Promise.all([fetchA2pBrand(), fetchOrgInfo()]);

  return <A2pWizard initialBrand={brand} orgInfo={orgInfo} />;
}
