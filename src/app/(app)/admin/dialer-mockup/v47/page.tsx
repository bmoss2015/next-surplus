import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { FullFrame } from "../_layouts/FullFrame";
import { V47 } from "../_layouts/V47";

export default async function V47Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <FullFrame label="V47 · Card Stack">
      <V47 />
    </FullFrame>
  );
}
