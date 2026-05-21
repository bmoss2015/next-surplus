"use client";

// Settings clone · Phase B — client wrapper for the JSX preview.
//
// Owns the active-panel state and syncs it to the URL hash so reloads land
// back on the same panel. Renders the topbar + rail + main content area
// exactly the way the mockup does (<div class="flex"> with sticky aside +
// flex-1 main). Every panel is now real JSX — the rail's 14 routable keys
// plus the 3 fallback panel ids (email-templates, sms-templates,
// research-templates) addressable via URL hash.

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

// Rail key → panel component. Three extra ids (the fallback template panels,
// plus lost-reasons which is rendered inside the Pipeline panel by the
// mockup) are addressable via URL hash for parity with the static mockup.
const PANELS: Record<string, () => React.JSX.Element> = {
  profile: ProfileSection,
  password: SecuritySection,
  notifications: NotificationsSection,
  "email-accounts": EmailAccountsSection,
  company: CompanyProfileSection,
  team: TeamSection,
  billing: BillingSection,
  defaults: DefaultsSection,
  pipeline: PipelineSection,
  attorneys: AttorneysSection,
  "contact-roles": ContactRolesSection,
  "mail-settings": MailSettingsSection,
  "mail-bank": MailBankAccountsSection,
  templates: TemplatesSection,
  "email-templates": EmailTemplatesSection,
  "sms-templates": SmsTemplatesSection,
  "research-templates": ResearchTemplatesSection,
  "lost-reasons": LostReasonsSection,
};

const RAIL_KEYS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.key)));
const ALL_KEYS = new Set(Object.keys(PANELS));

export function SettingsPreviewJsx() {
  const [active, setActive] = useState<string>("profile");

  // Hydrate from the URL hash on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash.replace(/^#/, "");
    if (h && ALL_KEYS.has(h)) setActive(h);
  }, []);

  function pick(key: string) {
    setActive(key);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = key;
      window.history.replaceState(null, "", url.toString());
    }
  }

  const Panel = PANELS[active];
  // For panels not in the rail (the fallback template panels and the lost
  // reasons drill-down), don't highlight any rail item.
  const railActive = RAIL_KEYS.has(active) ? active : "";

  return (
    <>
      <Topbar />
      <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
        <SubRail active={railActive} onSelect={pick} />
        <main className="flex-1 overflow-y-auto scroll-area">
          <div className="content">
            {Panel ? <Panel /> : <Placeholder panelKey={active} />}
          </div>
        </main>
      </div>
    </>
  );
}
