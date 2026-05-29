import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchResearchTemplates } from "@/lib/settings/fetch";
import { PlaybookEditPage } from "@/app/(app)/settings/playbooks/_components/PlaybookEditPage";

export const dynamic = "force-dynamic";

// Edit an existing playbook from inside the Playbooks tab. Same editor
// component as Settings; routes back to /playbooks on save/delete. Hard-
// gated to admins (owner inherits via isAdmin in current-user.ts).
export default async function EditPlaybookFromPlaybooksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { id } = await params;
  if (!profile.isAdmin) redirect(`/playbooks/${id}`);
  const all = await fetchResearchTemplates();
  const row = all.find((r) => r.id === id);
  if (!row) notFound();
  return <PlaybookEditPage row={row} canEdit={true} returnTo="playbooks" />;
}
