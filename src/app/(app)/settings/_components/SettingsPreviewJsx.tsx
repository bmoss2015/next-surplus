"use client";

// Client wrapper for the Settings page.
//
// Owns the active-panel state, syncs it to the URL hash so reloads land
// back on the same panel, and routes the fetched server-data slices to the
// corresponding panel components.

import { useEffect, useState } from "react";
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
import { LobPricingSection } from "./LobPricingSection";
import { TemplatesSection } from "./TemplatesSection";

import type {
  AppSettings,
  AttorneyRow,
  LobPricingSettings,
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
  lobPricing: LobPricingSettings | null;
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

  // Live counts pulled from the fetched data so the rail's trailing-count
  // chips reflect real records instead of mockup placeholders.
  const counts: Record<string, number> = {
    "email-accounts": data.emailAccounts.length,
    team: data.members.length,
    attorneys: data.attorneys.length,
    "mail-bank": data.mailBank.length,
    templates:
      data.templates.length + data.research.length,
  };

  // Settings now sits inside AppShell, so the portal-wide IconSidebar
  // and Topbar handle the global chrome. This component only renders the
  // settings-internal sub-rail + active panel.
  return (
    <div className="flex h-full">
      <SubRail
        active={railActive}
        onSelect={pick}
        isAdmin={currentUser.isAdmin}
        counts={counts}
      />
      <main className="flex-1 overflow-y-auto scroll-area">
        <div className="content">{renderPanel(active, currentUser, data)}</div>
      </main>
    </div>
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
      return (
        <AttorneysSection
          initial={data.attorneys}
          canEdit={currentUser.isAdmin}
        />
      );
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
    case "mail-pricing":
      return data.lobPricing ? (
        <LobPricingSection initial={data.lobPricing} />
      ) : (
        <AdminGate />
      );
    case "templates":
      return (
        <TemplatesSection
          templates={data.templates}
          research={data.research}
          canEdit={currentUser.isAdmin}
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
