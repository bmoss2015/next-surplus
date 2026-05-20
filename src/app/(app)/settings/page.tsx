import { redirect } from "next/navigation";
import {
  fetchAppSettings,
  fetchAttorneys,
  fetchLostReasonsAdmin,
  fetchTemplates,
  fetchResearchTemplates,
  fetchOrgMembers,
  fetchNeedsActionThreshold,
  fetchOrgInfo,
  fetchMailSettings,
  fetchMailBankAccounts,
  fetchMyNotificationPrefs,
} from "@/lib/settings/fetch";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { CompanyInfoSection } from "./_components/CompanyInfoSection";
import { DefaultsSection } from "./_components/DefaultsSection";
import { AttorneysSection } from "./_components/AttorneysSection";
import { LostReasonsSection } from "./_components/LostReasonsSection";
import { PipelineRulesSection } from "./_components/PipelineRulesSection";
import { TemplatesSection } from "./_components/TemplatesSection";
import { SmsTemplatesSection } from "./_components/SmsTemplatesSection";
import { ResearchTemplatesSection } from "./_components/ResearchTemplatesSection";
import { TeamSection } from "./_components/TeamSection";
import { ProfileSection } from "./_components/ProfileSection";
import { ChangePasswordSection } from "./_components/ChangePasswordSection";
import { EmailAccountsSection } from "./_components/EmailAccountsSection";
import { OtherContactRolesSection } from "./_components/OtherContactRolesSection";
import { MailSettingsSection } from "./_components/MailSettingsSection";
import { MailBankAccountsSection } from "./_components/MailBankAccountsSection";
import { BillingSection } from "./_components/BillingSection";
import { NotificationsSection } from "./_components/NotificationsSection";
import { SettingsLayout } from "./_components/SettingsLayout";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { fetchOrgCustomRoles } from "@/lib/leads/lead-parties";

export const dynamic = "force-dynamic";

// Settings redesign — sub-rail layout. Sections grouped Account / Workspace /
// Leads / Mail / Templates. Member visibility unchanged: Lost Reasons,
// Attorneys, Templates, Contact Roles, Profile, Security, Notifications,
// Email Accounts are visible to all signed-in users; the rest are admin-only.
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
    notificationPrefs,
  ] = await Promise.all([
    fetchAttorneys(),
    fetchLostReasonsAdmin(),
    fetchTemplates(),
    fetchResearchTemplates(),
    fetchMyEmailAccounts(),
    fetchOrgCustomRoles(),
    fetchMyNotificationPrefs(),
  ]);
  const [
    defaults,
    members,
    needsActionThreshold,
    orgInfo,
    mailSettings,
    mailBankAccounts,
  ] = isAdmin
    ? await Promise.all([
        fetchAppSettings(),
        fetchOrgMembers(),
        fetchNeedsActionThreshold(),
        fetchOrgInfo(),
        fetchMailSettings(),
        fetchMailBankAccounts(),
      ])
    : [null, null, null, null, null, null];

  // Available panels for the current user. Admin-only sections render to null
  // for members and don't appear in the rail.
  const panels: Record<string, React.ReactNode> = {
    profile: (
      <ProfileSection
        initialFullName={profile.fullName}
        initialEmail={profile.email ?? ""}
        isAdmin={isAdmin}
      />
    ),
    security: <ChangePasswordSection />,
    notifications: <NotificationsSection initial={notificationPrefs} />,
    "email-accounts": <EmailAccountsSection initial={emailAccounts} />,
    attorneys: <AttorneysSection initial={attorneys} />,
    "lost-reasons": <LostReasonsSection initial={lostReasons} />,
    "contact-roles": <OtherContactRolesSection initial={customContactRoles} />,
    "email-templates": <TemplatesSection initial={templates} />,
    "sms-templates": <SmsTemplatesSection initial={templates} />,
    "research-templates": <ResearchTemplatesSection initial={researchTemplates} />,
  };

  // Admin-only panels.
  if (isAdmin) {
    panels["company"] = <CompanyInfoSection initial={orgInfo!} />;
    panels["billing"] = <BillingSection orgId={profile.orgId} />;
    panels["team"] = <TeamSection initial={members!} currentUserId={profile.id} />;
    panels["defaults"] = <DefaultsSection initial={defaults!} />;
    panels["pipeline"] = <PipelineRulesSection initial={needsActionThreshold!} />;
    panels["mail-settings"] = <MailSettingsSection initial={mailSettings!} />;
    panels["mail-bank"] = <MailBankAccountsSection initial={mailBankAccounts!} />;
  }

  // Rail structure. Admin-only items omitted for members.
  const groups = [
    {
      name: "Account",
      items: [
        { key: "profile", label: "Profile" },
        { key: "security", label: "Security" },
        { key: "notifications", label: "Notifications" },
        { key: "email-accounts", label: "Email Accounts", count: emailAccounts.length },
      ],
    },
    ...(isAdmin
      ? [
          {
            name: "Workspace",
            items: [
              { key: "company", label: "Company Profile" },
              { key: "team", label: "Members", count: members?.length ?? 0 },
              { key: "billing", label: "Billing" },
            ],
          },
        ]
      : []),
    {
      name: "Leads",
      items: [
        ...(isAdmin
          ? [
              { key: "defaults", label: "Defaults" },
              { key: "pipeline", label: "Pipeline Rules" },
            ]
          : []),
        { key: "attorneys", label: "Attorneys", count: attorneys.length },
        { key: "lost-reasons", label: "Lost Reasons" },
        { key: "contact-roles", label: "Contact Roles" },
      ],
    },
    ...(isAdmin
      ? [
          {
            name: "Mail",
            items: [
              { key: "mail-settings", label: "Configuration" },
              { key: "mail-bank", label: "Bank Accounts", count: mailBankAccounts?.length ?? 0 },
            ],
          },
        ]
      : []),
    {
      name: "Templates",
      items: [
        { key: "email-templates", label: "Email" },
        { key: "sms-templates", label: "SMS" },
        { key: "research-templates", label: "Research" },
      ],
    },
  ];

  return <SettingsLayout groups={groups} panels={panels} isAdmin={isAdmin} />;
}
