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
  fetchTemplates,
  fetchResearchTemplates,
} from "@/lib/settings/fetch";
import { fetchMyEmailAccounts } from "@/lib/email/fetch";
import { fetchOrgCustomRoles } from "@/lib/leads/lead-parties";
import { getValidationUsage } from "@/lib/phone-validate";
import { SettingsPreviewJsx } from "./_components/SettingsPreviewJsx";

export const dynamic = "force-dynamic";

export default async function SettingsPreviewJsxPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.isAdmin;

  // Member-visible data — attorneys + lost reasons + contact roles +
  // connected email accounts (per-user, not per-org) + templates (visible to
  // members so they can pick from them in the lead composer).
  const [attorneys, customContactRoles, emailAccounts, templates, research] =
    await Promise.all([
      fetchAttorneys(),
      fetchOrgCustomRoles(),
      fetchMyEmailAccounts(),
      fetchTemplates(),
      fetchResearchTemplates(),
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
    phoneUsage,
  ] = isAdmin
    ? await Promise.all([
        fetchAppSettings(),
        fetchNeedsActionThreshold(),
        fetchLostReasonsAdmin(),
        fetchOrgMembers(),
        fetchOrgInfo(),
        fetchMailSettings(),
        fetchMailBankAccounts(),
        getValidationUsage(profile.orgId),
      ])
    : [null, null, [], [], null, null, [], null];

  const cssText = readFileSync(
    path.join(process.cwd(), "src", "app", "settings-preview", "preview.css"),
    "utf-8"
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
      />
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
          `,
        }}
      />

      <SettingsPreviewJsx
        currentUser={{
          fullName: profile.fullName,
          email: profile.email ?? "",
          isAdmin,
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
          templates,
          research,
          phoneUsage,
        }}
      />
    </>
  );
}
