import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { V5Modal } from "./_v5";

export default async function V5Page() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return <V5Modal />;
}
