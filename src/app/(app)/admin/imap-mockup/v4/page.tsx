import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { V4Modal } from "./_v4";

export default async function V4Page() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return <V4Modal />;
}
