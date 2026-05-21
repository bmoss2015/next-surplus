import { readFileSync } from "fs";
import path from "path";
import Script from "next/script";

// Settings redesign — Phase A pixel clone.
//
// The 3001 mockup (C:\Users\info\moss-equity-settings-mockup\index.html) is
// copied verbatim into src/data/settings-mockup.html. This route extracts the
// mockup's <style> block and its <body> inner HTML and renders both via
// dangerouslySetInnerHTML inside a route OUTSIDE the (app) group — bypassing
// AppShell, since the mockup brings its own top bar.
//
// The mockup uses Tailwind CDN + Lucide icon font + Google Fonts Inter; all
// three are loaded here exactly as the mockup loads them, so the rendered
// output is byte-comparable to localhost:3001.
//
// Phase B will split this single page into real JSX components.

export const dynamic = "force-static";

export default function SettingsPreviewPage() {
  const html = readFileSync(
    path.join(process.cwd(), "src", "data", "settings-mockup.html"),
    "utf-8"
  );

  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const tailwindConfigMatch = html.match(
    /<script>\s*(tailwind\.config[\s\S]*?)<\/script>/
  );

  const cssText = styleMatch ? styleMatch[1] : "";
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
