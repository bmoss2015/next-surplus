import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { DialerSession } from "./_components/DialerSession";

export default async function DialerPage() {
  const profile = await getCurrentProfile();
  if (!profile?.isOwner) notFound();
  return <DialerSession />;
}
