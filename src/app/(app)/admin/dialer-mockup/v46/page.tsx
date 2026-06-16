import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { FullFrame } from "../_layouts/FullFrame";
import { V46 } from "../_layouts/V46";

export default async function V46Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <FullFrame label="V46 · Horizontal Banner + Wide Data Strip">
      <V46 />
    </FullFrame>
  );
}
