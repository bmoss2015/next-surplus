import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { V1Modal } from "./_v1";

export default async function V1Page() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return <V1Modal />;
}
