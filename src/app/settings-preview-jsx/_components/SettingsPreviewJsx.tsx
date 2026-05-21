"use client";

// Settings clone · Phase C — client wrapper for the JSX preview.
//
// Owns the active-panel state, syncs it to the URL hash, and routes the
// fetched server-data slices to the corresponding panel components. Phase
// C.1 wires the Profile data only; Phase C.2+ adds the other panel data
// props (attorneys, members, defaults, etc.) and the panels that consume
// them. Until then the remaining panels render their static mockup JSX.

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
import { EmailTemplatesSection } from "./EmailTemplatesSection";
import { SmsTemplatesSection } from "./SmsTemplatesSection";
import { ResearchTemplatesSection } from "./ResearchTemplatesSection";
import { LostReasonsSection } from "./LostReasonsSection";

export type CurrentUser = {
  fullName: string;
  email: string;
  isAdmin: boolean;
};

const RAIL_KEYS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.key)));

export function SettingsPreviewJsx({
  currentUser,
}: {
  currentUser: CurrentUser;
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
          <div className="content">{renderPanel(active, currentUser)}</div>
        </main>
      </div>
    </>
  );
}

function renderPanel(active: string, currentUser: CurrentUser) {
  switch (active) {
    case "profile":
      return <ProfileSection initial={currentUser} />;
    case "password":
      return <SecuritySection />;
    case "notifications":
      return <NotificationsSection />;
    case "email-accounts":
      return <EmailAccountsSection />;
    case "company":
      return <CompanyProfileSection />;
    case "team":
      return <TeamSection />;
    case "billing":
      return <BillingSection />;
    case "defaults":
      return <DefaultsSection />;
    case "pipeline":
      return <PipelineSection />;
    case "attorneys":
      return <AttorneysSection />;
    case "contact-roles":
      return <ContactRolesSection />;
    case "mail-settings":
      return <MailSettingsSection />;
    case "mail-bank":
      return <MailBankAccountsSection />;
    case "templates":
      return <TemplatesSection />;
    case "email-templates":
      return <EmailTemplatesSection />;
    case "sms-templates":
      return <SmsTemplatesSection />;
    case "research-templates":
      return <ResearchTemplatesSection />;
    case "lost-reasons":
      return <LostReasonsSection />;
    default:
      return <Placeholder panelKey={active} />;
  }
}
