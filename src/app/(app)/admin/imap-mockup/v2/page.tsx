import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { V2Modal } from "./_v2";

export default async function V2Page() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return <V2Modal />;
}
