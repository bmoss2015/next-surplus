import { redirect } from "next/navigation";
import {
  fetchAppSettings,
  fetchAttorneys,
  fetchStateRules,
  fetchLostReasonsAdmin,
  fetchTemplates,
  fetchOrgMembers,
} from "@/lib/settings/fetch";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { DefaultsSection } from "./_components/DefaultsSection";
import { AttorneysSection } from "./_components/AttorneysSection";
import { StateRulesSection } from "./_components/StateRulesSection";
import { LostReasonsSection } from "./_components/LostReasonsSection";
import { TemplatesSection } from "./_components/TemplatesSection";
import { TeamSection } from "./_components/TeamSection";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) redirect("/");

  const [defaults, attorneys, stateRules, lostReasons, templates, members] =
    await Promise.all([
      fetchAppSettings(),
      fetchAttorneys(),
      fetchStateRules(),
      fetchLostReasonsAdmin(),
      fetchTemplates(),
      fetchOrgMembers(),
    ]);

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Settings
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Team, defaults, attorneys, state rules, lost reasons, and templates.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[18px]">
        <div className="col-span-2">
          <TeamSection initial={members} currentUserId={profile.id} />
        </div>
        <DefaultsSection initial={defaults} />
        <LostReasonsSection initial={lostReasons} />
        <div className="col-span-2">
          <StateRulesSection initial={stateRules} />
        </div>
        <AttorneysSection initial={attorneys} />
        <TemplatesSection initial={templates} />
      </div>
    </div>
  );
}
