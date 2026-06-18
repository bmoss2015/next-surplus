import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { TemplatesVariants } from "./_variants";

export default async function EmailTemplatesVariantsPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return <TemplatesVariants />;
}
