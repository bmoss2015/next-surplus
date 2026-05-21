"use client";

// Settings clone · Phase B.3 — client wrapper for the JSX preview.
//
// Owns the active-panel state and syncs it to the URL hash so reloads land
// back on the same panel. Renders the topbar + rail + main content area
// exactly the way the mockup does (<div class="flex"> with sticky aside +
// flex-1 main). Only the Profile panel is converted to real JSX in B.3 —
// every other rail item routes to <Placeholder /> until later phases.

import { useEffect, useState } from "react";
import { Topbar } from "./Topbar";
import { SubRail, GROUPS } from "./SubRail";
import { ProfileSection } from "./ProfileSection";
import { Placeholder } from "./Placeholder";

const ALL_KEYS = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.key)));

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

  return (
    <>
      <Topbar />
      <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
        <SubRail active={active} onSelect={pick} />
        <main className="flex-1 overflow-y-auto scroll-area">
          <div className="content">
            {active === "profile" ? (
              <ProfileSection />
            ) : (
              <Placeholder panelKey={active} />
            )}
          </div>
        </main>
      </div>
    </>
  );
}
