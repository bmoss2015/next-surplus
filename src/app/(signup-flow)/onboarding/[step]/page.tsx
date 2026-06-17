import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { FirmStep } from "../_components/FirmStep";
import { ImportStep } from "../_components/ImportStep";
import { InboxStep } from "../_components/InboxStep";
import { TeamStep } from "../_components/TeamStep";

export const dynamic = "force-dynamic";

const VALID_STEPS = ["firm", "import", "inbox", "team"] as const;

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!VALID_STEPS.includes(step as (typeof VALID_STEPS)[number])) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (step === "firm") {
    const admin = createServiceClient();
    const { data: org } = await admin
      .from("orgs")
      .select("name, primary_state")
      .eq("id", profile.orgId)
      .maybeSingle();
    const initialName = (org?.name as string | undefined) ?? "";
    const initialState = (org?.primary_state as string | undefined) ?? "";
    return <FirmStep initialName={initialName} initialState={initialState} />;
  }

  if (step === "import") return <ImportStep />;
  if (step === "inbox") return <InboxStep />;
  return <TeamStep />;
}
