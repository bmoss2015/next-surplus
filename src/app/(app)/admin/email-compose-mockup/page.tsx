import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { EmailMockup } from "./_mockup";

export default async function EmailComposeMockupPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();
  return <EmailMockup />;
}
