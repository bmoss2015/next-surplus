import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { V3Modal } from "./_v3";

export default async function V3Page() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return <V3Modal />;
}
