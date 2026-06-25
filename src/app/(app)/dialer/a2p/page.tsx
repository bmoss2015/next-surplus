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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.nextsurplus.com";
  const hostedPrivacyUrl = `${baseUrl}/legal/${profile.orgId}/privacy`;
  const hostedTermsUrl = `${baseUrl}/legal/${profile.orgId}/terms`;

  return (
    <A2pWizard
      initialBrand={brand}
      orgInfo={orgInfo}
      hostedPrivacyUrl={hostedPrivacyUrl}
      hostedTermsUrl={hostedTermsUrl}
    />
  );
}
