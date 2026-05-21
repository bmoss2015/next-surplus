"use client";

// Client wrapper for the Settings page.
//
// Owns the active-panel state, syncs it to the URL hash so reloads land
// back on the same panel, and routes the fetched server-data slices to the
// corresponding panel components.

import { useEffect, useState } from "react";
import { Topbar } from "./Topbar";
import { SubRail, GROUPS } from "./SubRail";
import { Placeholder } from "./Placeholder";

import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";
import { NotificationsSection } from "./NotificationsSection";
import { EmailAccountsSection } from "./EmailAccountsSection";
import { CompanyProfileSection } from "./CompanyProfileSection";
import { TeamSection } from "./TeamSection";
import { BillingSection } from "./BillingSection";
import { DefaultsSection } from "./DefaultsSection";
import { PipelineSection } from "./PipelineSection";
import { AttorneysSection } from "./AttorneysSection";
import { ContactRolesSection } from "./ContactRolesSection";
import { MailSettingsSection } from "./MailSettingsSection";
import { MailBankAccountsSection } from "./MailBankAccountsSection";
import { TemplatesSection } from "./TemplatesSection";

import type {
  AppSettings,
  AttorneyRow,
  LostReasonAdminRow,
  MailBankAccountRow,
  MailSettings,
  OrgInfo,
  OrgMemberRow,
  ResearchTemplateRow,
  TemplateRow,
} from "@/lib/settings/fetch";
import type { EmailAccountRow } from "@/lib/email/types";
import type { PhoneValidationUsage } from "./BillingSection";

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  avatarUrl: string | null;
  timeZone: string | null;
};

export type SettingsData = {
  defaults: AppSettings | null;
  needsActionThreshold: number | null;
  lostReasons: LostReasonAdminRow[];
  attorneys: AttorneyRow[];
  customContactRoles: string[];
  members: OrgMemberRow[];
  orgInfo: OrgInfo | null;
  orgName: string;
  emailAccounts: EmailAccountRow[];
  mailSettings: MailSettings | null;
  mailBank: MailBankAccountRow[];
  templates: TemplateRow[];
  research: ResearchTemplateRow[];
  phoneUsage: PhoneValidationUsage | null;
  notificationPrefs: Record<string, boolean>;
};

const RAIL_KEYS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.key)));

export function SettingsPreviewJsx({
  currentUser,
  data,
}: {
  currentUser: CurrentUser;
  data: SettingsData;
}) {
  const [active, setActive] = useState<string>("profile");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash.replace(/^#/, "");
    if (h) setActive(h);
  }, []);

  function pick(key: string) {
    setActive(key);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = key;
      window.history.replaceState(null, "", url.toString());
    }
  }

  const railActive = RAIL_KEYS.has(active) ? active : "";

  return (
    <>
      <Topbar currentUser={currentUser} />
      <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
        <SubRail active={railActive} onSelect={pick} />
        <main className="flex-1 overflow-y-auto scroll-area">
          <div className="content">{renderPanel(active, currentUser, data)}</div>
        </main>
      </div>
    </>
  );
}

function renderPanel(
  active: string,
  currentUser: CurrentUser,
  data: SettingsData
) {
  switch (active) {
    case "profile":
      return <ProfileSection initial={currentUser} />;
    case "defaults":
      return data.defaults ? (
        <DefaultsSection initial={data.defaults} />
      ) : (
        <AdminGate />
      );
    case "pipeline":
      return data.defaults != null ? (
        <PipelineSection
          initialNeedsActionThreshold={data.needsActionThreshold}
          initialLostReasons={data.lostReasons}
        />
      ) : (
        <AdminGate />
      );
    case "password":
      return <SecuritySection />;
    case "notifications":
      return <NotificationsSection initial={data.notificationPrefs} />;
    case "email-accounts":
      return <EmailAccountsSection initial={data.emailAccounts} />;
    case "company":
      return data.orgInfo ? (
        <CompanyProfileSection initial={data.orgInfo} />
      ) : (
        <AdminGate />
      );
    case "team":
      return data.members.length > 0 || currentUser.isAdmin ? (
        <TeamSection
          initial={data.members}
          orgName={data.orgName}
          currentUserId={currentUser.id}
        />
      ) : (
        <AdminGate />
      );
    case "billing":
      return data.phoneUsage ? (
        <BillingSection
          phoneUsage={data.phoneUsage}
          invoiceEmail={currentUser.email}
        />
      ) : (
        <AdminGate />
      );
    case "attorneys":
      return <AttorneysSection initial={data.attorneys} />;
    case "contact-roles":
      return <ContactRolesSection initial={data.customContactRoles} />;
    case "mail-settings":
      return data.mailSettings ? (
        <MailSettingsSection initial={data.mailSettings} />
      ) : (
        <AdminGate />
      );
    case "mail-bank":
      return <MailBankAccountsSection initial={data.mailBank} />;
    case "templates":
      return (
        <TemplatesSection
          templates={data.templates}
          research={data.research}
        />
      );
    default:
      return <Placeholder panelKey={active} />;
  }
}

function AdminGate() {
  return (
    <section className="panel active">
      <h1 className="section-h1">Admin only</h1>
      <p className="section-desc">
        This panel is restricted to org admins. Ask your admin for access.
      </p>
    </section>
  );
}
