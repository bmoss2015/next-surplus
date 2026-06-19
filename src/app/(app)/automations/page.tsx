import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { fetchOrgMembers } from "@/lib/settings/fetch";
import { fetchOrgStages } from "@/lib/stages/fetch";
import { AutomationsShell } from "./_components/AutomationsShell";

export const dynamic = "force-dynamic";

export type WebFormRow = {
  id: string;
  org_id: string;
  name: string;
  is_active: boolean;
  assignment_type: "specific" | "round_robin";
  assigned_to: string | null;
  round_robin_users: string[];
  default_stage: string;
  lead_source: string;
  success_message: string;
};

export default async function AutomationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.isOwner) redirect("/");

  const sb = await createClient();

  const [{ data: forms }, members, stages] = await Promise.all([
    sb
      .from("web_forms")
      .select(
        "id, org_id, name, is_active, assignment_type, assigned_to, round_robin_users, default_stage, lead_source, success_message"
      )
      .order("created_at", { ascending: true })
      .limit(1),
    fetchOrgMembers(),
    fetchOrgStages(),
  ]);

  const form = (forms?.[0] ?? null) as WebFormRow | null;

  return (
    <AutomationsShell
      form={form}
      members={members}
      stages={stages}
    />
  );
}
