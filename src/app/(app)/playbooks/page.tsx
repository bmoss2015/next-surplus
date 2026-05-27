import { readFileSync } from "node:fs";
import path from "node:path";
import { fetchPlaybooks } from "@/lib/playbooks/fetch-list";
import { PlaybooksClient } from "./_components/PlaybooksClient";

export const dynamic = "force-dynamic";

// Playbooks index. Server-side fetches the list + injects the same
// preview.css that Settings uses so the shared TemplateEditorDrawer
// component renders with its drawer chrome on this page too.
export default async function PlaybooksPage() {
  const playbooks = await fetchPlaybooks();
  const cssText = readFileSync(
    path.join(process.cwd(), "src", "app", "(app)", "settings", "preview.css"),
    "utf8"
  );

  return (
    <>
      {/* Lucide icon font for any .icon.* glyphs inside the shared
          TemplateEditorDrawer. Loaded the same way /settings does. */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/lucide-static@0.460.0/font/lucide.css"
      />
      <style
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: cssText }}
      />
      <PlaybooksClient playbooks={playbooks} />
    </>
  );
}
