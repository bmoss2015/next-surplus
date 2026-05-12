import { redirect } from "next/navigation";
import {
  fetchAppSettings,
  fetchAttorneys,
  fetchLostReasonsAdmin,
  fetchTemplates,
  fetchResearchTemplates,
  fetchOrgMembers,
  fetchNeedsActionThreshold,
} from "@/lib/settings/fetch";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { DefaultsSection } from "./_components/DefaultsSection";
import { AttorneysSection } from "./_components/AttorneysSection";
import { LostReasonsSection } from "./_components/LostReasonsSection";
import { PipelineRulesSection } from "./_components/PipelineRulesSection";
import { TemplatesSection } from "./_components/TemplatesSection";
import { SmsTemplatesSection } from "./_components/SmsTemplatesSection";
import { ResearchTemplatesSection } from "./_components/ResearchTemplatesSection";
import { TeamSection } from "./_components/TeamSection";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) redirect("/");

  const [
    defaults,
    attorneys,
    lostReasons,
    templates,
    researchTemplates,
    members,
    needsActionThreshold,
  ] = await Promise.all([
    fetchAppSettings(),
    fetchAttorneys(),
    fetchLostReasonsAdmin(),
    fetchTemplates(),
    fetchResearchTemplates(),
    fetchOrgMembers(),
    fetchNeedsActionThreshold(),
  ]);

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Settings
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Team, defaults, attorneys, lost reasons, templates, and research
          templates.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[18px]">
        <div className="col-span-2">
          <TeamSection initial={members} currentUserId={profile.id} />
        </div>
        <div className="col-span-2">
          <PipelineRulesSection initial={needsActionThreshold} />
        </div>
        <DefaultsSection initial={defaults} />
        <LostReasonsSection initial={lostReasons} />
        <AttorneysSection initial={attorneys} />
        <TemplatesSection initial={templates} />
        <SmsTemplatesSection initial={templates} />
        <div className="col-span-2">
          <ResearchTemplatesSection initial={researchTemplates} />
        </div>
      </div>
    </div>
  );
}
