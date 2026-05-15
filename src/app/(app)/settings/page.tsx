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
import { ProfileSection } from "./_components/ProfileSection";
import { EmailAccountsSection } from "./_components/EmailAccountsSection";
import { OtherContactRolesSection } from "./_components/OtherContactRolesSection";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { fetchOrgCustomRoles } from "@/lib/leads/lead-parties";

export const dynamic = "force-dynamic";

// Fix ZZZZ2 PART 4: Settings is no longer admin-only. Members see Lost Reasons,
// Attorney Directory, Email Templates, SMS Templates, and Research Templates.
// Team, Pipeline Rules, and Defaults stay admin-only (and their data is only
// fetched for admins). Admins see everything, unchanged.
export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  const isAdmin = profile.isAdmin;

  const [
    attorneys,
    lostReasons,
    templates,
    researchTemplates,
    emailAccounts,
    customContactRoles,
  ] = await Promise.all([
    fetchAttorneys(),
    fetchLostReasonsAdmin(),
    fetchTemplates(),
    fetchResearchTemplates(),
    fetchMyEmailAccounts(),
    fetchOrgCustomRoles(),
  ]);
  const [defaults, members, needsActionThreshold] = isAdmin
    ? await Promise.all([fetchAppSettings(), fetchOrgMembers(), fetchNeedsActionThreshold()])
    : [null, null, null];

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">Settings</h1>
        <div className="mt-1 text-[13px] text-gray-500">
          {isAdmin
            ? "Team, defaults, attorneys, lost reasons, templates, and research templates."
            : "Attorneys, lost reasons, templates, and research templates."}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[18px]">
        <ProfileSection
          initialFullName={profile.fullName}
          initialEmail={profile.email ?? ""}
        />
        <EmailAccountsSection initial={emailAccounts} />
        {isAdmin && (
          <div className="col-span-2">
            <TeamSection initial={members!} currentUserId={profile.id} />
          </div>
        )}
        {isAdmin && (
          <div className="col-span-2">
            <PipelineRulesSection initial={needsActionThreshold!} />
          </div>
        )}
        {isAdmin && <DefaultsSection initial={defaults!} />}
        <LostReasonsSection initial={lostReasons} />
        <AttorneysSection initial={attorneys} />
        <OtherContactRolesSection initial={customContactRoles} />
        <TemplatesSection initial={templates} />
        <SmsTemplatesSection initial={templates} />
        <div className="col-span-2">
          <ResearchTemplatesSection initial={researchTemplates} />
        </div>
      </div>
    </div>
  );
}
