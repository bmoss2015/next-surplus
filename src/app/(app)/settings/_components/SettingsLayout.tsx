"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type RailItem = {
  key: string;
  label: string;
  count?: number;
};

type RailGroup = {
  name: string;
  items: RailItem[];
};

// Settings redesign — left sub-rail + single-panel content area.
// One panel visible at a time. Active section persists in the URL hash so
// reloads land back on the same panel.

export function SettingsLayout({
  groups,
  panels,
  isAdmin,
}: {
  groups: RailGroup[];
  panels: Record<string, React.ReactNode>;
  isAdmin: boolean;
}) {
  // First key in the rail is the default panel.
  const firstKey = groups[0]?.items[0]?.key ?? "profile";
  const [active, setActive] = useState<string>(firstKey);

  // Hydrate active panel from URL hash if present.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash.replace(/^#/, "");
    if (h && panels[h]) setActive(h);
  }, [panels]);

  function pick(key: string) {
    setActive(key);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = key;
      window.history.replaceState(null, "", url.toString());
    }
  }

  // Find the section header for the active panel (for the breadcrumb).
  let activeGroup = "";
  let activeLabel = "";
  for (const g of groups) {
    for (const i of g.items) {
      if (i.key === active) {
        activeGroup = g.name;
        activeLabel = i.label;
      }
    }
  }

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 56px)" }}>
      {/* Sub-rail */}
      <aside
        className="sticky shrink-0 overflow-y-auto border-r border-gray-200 bg-surface"
        style={{ top: 56, height: "calc(100vh - 56px)", width: 224 }}
      >
        <div className="py-5 pl-5 pr-3">
          {groups.map((g) => (
            <div key={g.name} className="mb-5">
              <div className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400">
                {g.name}
              </div>
              {g.items.map((i) => (
                <button
                  key={i.key}
                  type="button"
                  onClick={() => pick(i.key)}
                  className={cn(
                    "mb-0.5 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                    active === i.key
                      ? "bg-gray-100 font-medium text-ink"
                      : "text-gray-600 hover:bg-gray-50 hover:text-ink"
                  )}
                >
                  <span>{i.label}</span>
                  {typeof i.count === "number" && (
                    <span className="text-[11px] tabular-nums text-gray-400">{i.count}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-7">
          {/* Breadcrumb */}
          <div className="mb-2 flex items-center gap-1.5 text-[11.5px] text-gray-400">
            <span>Settings</span>
            <span>·</span>
            <span>{activeGroup}</span>
          </div>
          <h1 className="m-0 text-[24px] font-semibold tracking-tight text-ink">{activeLabel}</h1>

          {/* Active panel — single-column inside the constrained max-w */}
          <div className="mt-6">{panels[active]}</div>
        </div>
      </div>
    </div>
  );
}
