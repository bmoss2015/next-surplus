import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { FullFrame } from "../_layouts/FullFrame";
import { V44 } from "../_layouts/V44";

export default async function V44Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <FullFrame label="V44 · Three Zone Columns">
      <V44 />
    </FullFrame>
  );
}
