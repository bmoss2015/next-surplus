import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { PlaybookEditPage } from "@/app/(app)/settings/playbooks/_components/PlaybookEditPage";

export const dynamic = "force-dynamic";

// Create a new playbook from inside the Playbooks tab. Mirrors
// /settings/playbooks/new but stays in the playbooks namespace so users
// don't get bounced into Settings. Hard-gated to admins (owner inherits).
export default async function NewPlaybookFromPlaybooksPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isAdmin) redirect("/playbooks");
  return <PlaybookEditPage row={null} canEdit={true} returnTo="playbooks" />;
}
