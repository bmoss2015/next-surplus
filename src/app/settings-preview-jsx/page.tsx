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
} from "@/lib/settings/fetch";
import { SettingsPreviewJsx } from "./_components/SettingsPreviewJsx";

export const dynamic = "force-dynamic";

export default async function SettingsPreviewJsxPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isAdmin = profile.isAdmin;

  // Member-visible data (Lost Reasons admin includes archived rows, which is
  // why it's behind isAdmin even though the panel itself is admin-only).
  const [lostReasons] = await Promise.all([
    isAdmin ? fetchLostReasonsAdmin() : Promise.resolve([]),
  ]);

  // Admin-only data. Promise.all keeps the wait time bounded by the slowest
  // single fetcher rather than summed.
  const [defaults, needsActionThreshold] = isAdmin
    ? await Promise.all([fetchAppSettings(), fetchNeedsActionThreshold()])
    : [null, null];

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
        }}
      />
    </>
  );
}
