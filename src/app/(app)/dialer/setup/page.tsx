import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { DialerSetupWizard } from "../_components/DialerSetupWizard";

export default async function DialerSetupPage() {
  const profile = await getCurrentProfile();
  if (!profile?.isOwner) notFound();
  return <DialerSetupWizard />;
}
