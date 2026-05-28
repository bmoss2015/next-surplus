import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { fetchResearchTemplates } from "@/lib/settings/fetch";
import { PlaybookEditPage } from "../_components/PlaybookEditPage";

export const dynamic = "force-dynamic";

export default async function EditPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { id } = await params;
  const all = await fetchResearchTemplates();
  const row = all.find((r) => r.id === id);
  if (!row) notFound();
  return <PlaybookEditPage row={row} canEdit={profile.isAdmin} />;
}
