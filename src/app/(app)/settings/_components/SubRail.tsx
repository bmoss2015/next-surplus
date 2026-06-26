// Settings · sub-rail (left sidebar).
//
// GROUPS is the single source of truth for the rail structure, the panel
// breadcrumbs, and access-level (admin vs member) per item. Exported so the
// chrome + the breadcrumb lookup both read from it. Counts are passed in
// from the page as a separate map so this file stays static-data-only.

import { Fragment } from "react";

export type RailItem = {
  key: string;
  label: string;
  // True if only admins can see this rail item (and the panel behind it).
  // Members never see admin-only items in the rail; if they hit the URL
  // hash directly, the panel renders <AdminGate />.
  adminOnly?: boolean;
};

export type RailGroup = {
  name: string;
  items: RailItem[];
};

// Standard CRM access model — Account is per-user (everyone). Workspace +
// admin-only Leads rules + Mail are admin-only. Attorneys + Templates are
// view-for-all in the rail; the server actions enforce admin on edits and
// the panels hide Add/Edit/Delete buttons for non-admins.
export const GROUPS: RailGroup[] = [
  {
    name: "Account",
    items: [
      { key: "profile", label: "Profile" },
      { key: "password", label: "Security" },
      { key: "notifications", label: "Notifications" },
      { key: "email-accounts", label: "Email Accounts" },
    ],
  },
  {
    name: "Workspace",
    items: [
      { key: "company", label: "Company Profile", adminOnly: true },
      { key: "team", label: "Members", adminOnly: true },
      { key: "billing", label: "Billing", adminOnly: true },
    ],
  },
  {
    name: "Leads",
    items: [
      { key: "defaults", label: "Defaults", adminOnly: true },
      { key: "pipeline", label: "Pipeline & Lost Reasons", adminOnly: true },
      { key: "attorneys", label: "Attorneys" },
      { key: "contact-roles", label: "Contact Roles" },
    ],
  },
  {
    name: "Letters",
    items: [
      { key: "mail-settings", label: "Configuration", adminOnly: true },
      { key: "mail-bank", label: "Bank Accounts", adminOnly: true },
      { key: "mail-customer-pricing", label: "Pricing", adminOnly: true },
    ],
  },
  {
    name: "Templates",
    items: [
      { key: "templates", label: "Letters" },
      { key: "email-templates", label: "Emails" },
    ],
  },
  {
    name: "Power Dialer",
    items: [
      { key: "phone-numbers", label: "Phone Numbers", adminOnly: true },
      { key: "dialer-defaults", label: "Defaults", adminOnly: true },
    ],
  },
  {
    name: "Playbooks",
    items: [{ key: "playbooks", label: "All Playbooks" }],
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
  isAdmin,
  counts,
}: {
  active: string;
  onSelect: (key: string) => void;
  isAdmin: boolean;
  counts?: Record<string, number>;
}) {
  // Filter each group's items by isAdmin, then drop any group that ends up
  // empty (members otherwise see a "Workspace" header with no children).
  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => isAdmin || !i.adminOnly),
  })).filter((g) => g.items.length > 0);

  return (
    <aside
      className="rail py-5 overflow-y-auto scroll-area"
      style={{ position: "sticky", top: 56, height: "calc(100vh - 56px)" }}
    >
      {visibleGroups.map((g) => (
        <Fragment key={g.name}>
          <div className="rail-section">{g.name}</div>
          {g.items.map((i) => {
            const count = counts?.[i.key];
            return (
              <div
                key={i.key}
                className={"nav-item" + (active === i.key ? " active" : "")}
                onClick={() => onSelect(i.key)}
                data-target={i.key}
              >
                {i.label}
                {typeof count === "number" && count > 0 && (
                  <span className="nav-trail-count">{count}</span>
                )}
              </div>
            );
          })}
        </Fragment>
      ))}
    </aside>
  );
}
