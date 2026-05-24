import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ErrorPreviewClient } from "./_client";

// Visual showcase of every error / warning state customers can hit on
// the Send Mail flow. Static rendering — no actual sends fire. Useful
// for "what does the user actually see if X happens" without manually
// reproducing each scenario in the UI.

export const dynamic = "force-dynamic";

export default async function ErrorPreviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/");
  return <ErrorPreviewClient />;
}
