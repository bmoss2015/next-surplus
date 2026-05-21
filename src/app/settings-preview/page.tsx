import { readFileSync } from "fs";
import path from "path";
import Script from "next/script";

// Settings redesign — Phase A pixel clone (with Phase B.2 CSS co-location).
//
// The 3001 mockup is preserved verbatim at src/data/settings-mockup.html and
// its CSS has been lifted into ./preview.css. This route reads the mockup
// body inner HTML from the .html file and the styles from preview.css, then
// injects both via dangerouslySetInnerHTML — same render as before, but the
// CSS is now a proper co-located file an editor can syntax-highlight.
//
// Lives outside the (app) group so it bypasses AppShell — the mockup ships
// its own top bar. Tailwind CDN + Lucide icon font + Google Fonts Inter are
// loaded the same way the mockup loads them.

export const dynamic = "force-static";

export default function SettingsPreviewPage() {
  const html = readFileSync(
    path.join(process.cwd(), "src", "data", "settings-mockup.html"),
    "utf-8"
  );
  const cssText = readFileSync(
    path.join(process.cwd(), "src", "app", "settings-preview", "preview.css"),
    "utf-8"
  );

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const tailwindConfigMatch = html.match(
    /<script>\s*(tailwind\.config[\s\S]*?)<\/script>/
  );

  const bodyHtml = bodyMatch ? bodyMatch[1] : "";
  const tailwindConfig = tailwindConfigMatch ? tailwindConfigMatch[1] : "";

  return (
    <>
      {/* Fonts — match mockup exactly: Inter 400–800 + JetBrains Mono 400/500. */}
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
      {/* Lucide icon font — same CDN the mockup uses. */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/font/lucide.css"
      />

      {/* Tailwind CDN — same loader the mockup uses. CDN script first, then
          the inline tailwind.config (matches mockup ordering exactly). Brief
          FOUC is acceptable here; Phase B replaces with bundled Tailwind. */}
      <Script
        src="https://cdn.tailwindcss.com"
        strategy="afterInteractive"
      />
      <Script id="tw-config" strategy="afterInteractive">
        {tailwindConfig}
      </Script>

      {/* Lift the mockup's <style> block verbatim. Scoped to this route's
          lifecycle — when the user navigates away, the <style> element
          unmounts and its rules stop applying. */}
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: cssText }}
      />

      {/* Lift the mockup's <body> inner HTML verbatim. The browser normalizes
          self-closing voids + attribute casing on parse, so React's diff
          complains even though the DOM is correct. Suppression here is safe
          — there's no React tree underneath to hydrate. */}
      <div
        className="settings-preview-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </>
  );
}
