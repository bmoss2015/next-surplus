// Settings clone · Phase C.1 — wire Profile to real data.
//
// page.tsx is now a Server Component. It runs the same auth check as the
// (app) layout (getCurrentProfile → redirect /login if not signed in) and
// fetches the slice of data Profile needs. Phase C.2+ will batch in the
// remaining fetchers (attorneys, members, defaults, etc.) and pass them
// through to the corresponding panels.
//
// Route still lives outside the (app) group so it bypasses AppShell — the
// mockup ships its own top bar. Phase D will swap /settings over to this.

import { readFileSync } from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { SettingsPreviewJsx } from "./_components/SettingsPreviewJsx";

export const dynamic = "force-dynamic";

export default async function SettingsPreviewJsxPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

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
          isAdmin: profile.isAdmin,
        }}
      />
    </>
  );
}
