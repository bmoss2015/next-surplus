// Settings clone · Phase B.3 — JSX shell at /settings-preview-jsx.
//
// Real JSX replacement for the static mockup at /settings-preview. The
// chrome (topbar, sub-rail, main scroll area) is component-based. The
// Profile panel is the first to be converted to real JSX; every other rail
// item shows a <Placeholder /> until later phases convert them.
//
// CSS is still the lifted preview.css (shared with /settings-preview). The
// Tailwind CDN is gone — the Tailwind v4 build in the app picks up the
// utility classes inside this route's JSX automatically. Lucide icon font
// stays for the <i class="icon icon-X"> glyphs the mockup uses (most of
// which render empty at 3001 anyway).
//
// Lives outside the (app) group so it bypasses AppShell.

import { readFileSync } from "fs";
import path from "path";
import { SettingsPreviewJsx } from "./_components/SettingsPreviewJsx";

export const dynamic = "force-static";

export default function SettingsPreviewJsxPage() {
  const cssText = readFileSync(
    path.join(process.cwd(), "src", "app", "settings-preview", "preview.css"),
    "utf-8"
  );

  return (
    <>
      {/* Fonts — match mockup: Inter 400-800 + JetBrains Mono 400/500. */}
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

      {/* Lifted mockup CSS — same source file the static /settings-preview
          uses. Injected as inline <style> so it's scoped to this route's
          lifecycle and doesn't leak into other portal pages. */}
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: cssText }}
      />

      <SettingsPreviewJsx />
    </>
  );
}
