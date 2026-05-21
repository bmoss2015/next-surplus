// Settings clone · Phase B.3 — sub-rail (left sidebar).
//
// Lifts the mockup's <aside class="rail">…</aside> markup verbatim into JSX.
// GROUPS is the single source of truth for the rail structure, the panel
// breadcrumbs, and the active-panel routing — it's exported so the chrome
// (SettingsPreviewJsx) and the breadcrumb lookup (each panel) both read from
// it.

import { Fragment } from "react";

export type RailItem = {
  key: string;
  label: string;
  count?: number;
};

export type RailGroup = {
  name: string;
  items: RailItem[];
};

// Order, labels, and counts come straight from the mockup. Counts are
// hardcoded for the preview — Phase B.X+ will source them from real data.
export const GROUPS: RailGroup[] = [
  {
    name: "Account",
    items: [
      { key: "profile", label: "Profile" },
      { key: "password", label: "Security" },
      { key: "notifications", label: "Notifications" },
      { key: "email-accounts", label: "Email Accounts", count: 1 },
    ],
  },
  {
    name: "Workspace",
    items: [
      { key: "company", label: "Company Profile" },
      { key: "team", label: "Members", count: 4 },
      { key: "billing", label: "Billing" },
    ],
  },
  {
    name: "Leads",
    items: [
      { key: "defaults", label: "Defaults" },
      { key: "pipeline", label: "Pipeline & Lost Reasons" },
      { key: "attorneys", label: "Attorneys", count: 6 },
      { key: "contact-roles", label: "Contact Roles" },
    ],
  },
  {
    name: "Mail",
    items: [
      { key: "mail-settings", label: "Configuration" },
      { key: "mail-bank", label: "Bank Accounts", count: 2 },
    ],
  },
  {
    name: "Templates",
    items: [
      { key: "templates", label: "All Templates", count: 25 },
    ],
  },
];

export function findItem(key: string): { group: string; item: RailItem } | null {
  for (const g of GROUPS) {
    for (const i of g.items) {
      if (i.key === key) return { group: g.name, item: i };
    }
  }
  return null;
}

export function SubRail({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <aside
      className="rail py-5 overflow-y-auto scroll-area"
      style={{ position: "sticky", top: 56, height: "calc(100vh - 56px)" }}
    >
      {GROUPS.map((g) => (
        <Fragment key={g.name}>
          <div className="rail-section">{g.name}</div>
          {g.items.map((i) => (
            <div
              key={i.key}
              className={"nav-item" + (active === i.key ? " active" : "")}
              onClick={() => onSelect(i.key)}
              data-target={i.key}
            >
              {i.label}
              {typeof i.count === "number" && (
                <span className="nav-trail-count">{i.count}</span>
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </aside>
  );
}
