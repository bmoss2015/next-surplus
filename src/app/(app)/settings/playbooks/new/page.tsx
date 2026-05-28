import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { PlaybookEditPage } from "../_components/PlaybookEditPage";

export const dynamic = "force-dynamic";

export default async function NewPlaybookPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return <PlaybookEditPage row={null} canEdit={profile.isAdmin} />;
}
