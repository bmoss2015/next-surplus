// Settings clone · Phase C — Settings JSX preview wired to real data.
//
// Server Component. Runs the same auth check the (app) layout uses, fetches
// every panel's slice of data in parallel, and passes the bundle to the
// client wrapper. Admin-only fetches are gated behind isAdmin so non-admins
// don't trigger RLS denials on data they can't see.
//
// Route still lives outside the (app) group so it bypasses AppShell — the
// mockup ships its own top bar. Phase D will swap /settings over to this.

import { readFileSync } from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  fetchAppSettings,
  fetchNeedsActionThreshold,
  fetchLostReasonsAdmin,
  fetchAttorneys,
  fetchOrgMembers,
  fetchOrgInfo,
  fetchMailSettings,
  fetchMailBankAccounts,
  fetchLobPricingSettings,
  fetchMyCustomerPricing,
  fetchTemplates,
  fetchEmailTemplates,
  fetchEmailTemplateFolders,
  fetchResearchTemplates,
  fetchMyNotificationPrefs,
  fetchPhoneNumbers,
  fetchTelnyxPricingSettings,
  fetchA2pBrand,
} from "@/lib/settings/fetch";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { fetchOrgCustomRoles } from "@/lib/leads/lead-parties";
import { fetchOrgStages } from "@/lib/stages/fetch";
import { SettingsPreviewJsx } from "./_components/SettingsPreviewJsx";

export const dynamic = "force-dynamic";

export default async function SettingsPreviewJsxPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.isAdmin;

  // Member-visible data — attorneys + lost reasons + contact roles +
  // connected email accounts (per-user, not per-org) + templates (visible to
  // members so they can pick from them in the lead composer).
  const [
    attorneys,
    customContactRoles,
    emailAccounts,
    templates,
    emailTemplates,
    emailTemplateFolders,
    research,
    notificationPrefs,
    customerPricing,
    orgStages,
  ] = await Promise.all([
    fetchAttorneys(),
    fetchOrgCustomRoles(),
    fetchMyEmailAccounts(),
    fetchTemplates(),
    fetchEmailTemplates(),
    fetchEmailTemplateFolders(),
    fetchResearchTemplates(),
    fetchMyNotificationPrefs(),
    fetchMyCustomerPricing(),
    fetchOrgStages(),
  ]);

  // Admin-only data.
  const [
    defaults,
    needsActionThreshold,
    lostReasons,
    members,
    orgInfo,
    mailSettings,
    mailBank,
    lobPricing,
    phoneNumbers,
    telnyxPricing,
    a2pBrand,
  ] = isAdmin
    ? await Promise.all([
        fetchAppSettings(),
        fetchNeedsActionThreshold(),
        fetchLostReasonsAdmin(),
        fetchOrgMembers(),
        fetchOrgInfo(),
        fetchMailSettings(),
        fetchMailBankAccounts(),
        fetchLobPricingSettings(),
        fetchPhoneNumbers(),
        fetchTelnyxPricingSettings(),
        fetchA2pBrand(),
      ])
    : [null, null, [], [], null, null, [], null, [], null, null];

  const cssText = readFileSync(
    path.join(process.cwd(), "src", "app", "(app)", "settings", "preview.css"),
    "utf-8"
  );

  return (
    <>
      {/* Fonts (Inter + JetBrains Mono) now load globally from the root
          layout. Lucide icon font still loads here since it's only used
          by the Settings sub-rail breadcrumbs + a few mockup-style
          icons inside panels. */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/font/lucide.css"
      />
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: cssText }}
      />

      {/* Local overrides layered on top of the lifted mockup CSS. Loaded
          AFTER preview.css so the cascade picks them up. */}
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
            /* Bree's review (Phase C.6): the gray .section-desc was capped at
               60ch which made even short descriptions wrap awkwardly and
               long ones (Contact Roles) wrap to 3+ lines well short of the
               divider line below. Unconstrain it so short copy stays one
               line and long copy uses the full content-column width before
               wrapping. */
            .section-desc { max-width: none; }

            /* Phase C.7: shift the right-side control in a settings-card head
               down so its top edge sits on the .settings-card-title line, not
               the eyebrow above. Mockup put both flush-top which left the
               14-days input visibly higher than "Needs Action Threshold". */
            .settings-card-head .settings-card-control { margin-top: 18px; }
          `,
        }}
      />

      <SettingsPreviewJsx
        currentUser={{
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email ?? "",
          isAdmin,
          avatarUrl: profile.avatarUrl,
          timeZone: profile.timeZone,
        }}
        data={{
          defaults,
          needsActionThreshold,
          lostReasons,
          attorneys,
          customContactRoles,
          members,
          orgInfo,
          orgName: orgInfo?.name ?? "Your Organization",
          emailAccounts,
          mailSettings,
          mailBank,
          lobPricing,
          templates,
          emailTemplates,
          emailTemplateFolders,
          research,
          notificationPrefs,
          customerPricing,
          orgStages,
          phoneNumbers,
          telnyxPricing,
          a2pBrand,
        }}
      />
    </>
  );
}
