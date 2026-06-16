import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { FullFrame } from "../_layouts/FullFrame";
import { V48 } from "../_layouts/V48";

export default async function V48Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return (
    <FullFrame label="V48 · Asymmetric L Shape">
      <V48 />
    </FullFrame>
  );
}
