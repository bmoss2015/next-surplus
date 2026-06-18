import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { FullFrame } from "../_layouts/FullFrame";
import { V45 } from "../_layouts/V45";

export default async function V45Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <FullFrame label="V45 · Centered Cockpit + Drawer">
      <V45 />
    </FullFrame>
  );
}
