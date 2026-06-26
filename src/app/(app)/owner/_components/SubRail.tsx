// Owner area sub-rail. Inline styles mirror preview.css (.rail,
// .rail-section, .nav-item) so Owner + Settings sub-rails render identically.

import { Fragment } from "react";

export type RailItem = {
  key: string;
  label: string;
};

export type RailGroup = {
  name: string;
  items: RailItem[];
};

export const GROUPS: RailGroup[] = [
  {
    name: "Letters",
    items: [
      { key: "customer-pricing", label: "Customer Pricing" },
      { key: "provider-costs", label: "Lob Rate" },
      { key: "reports", label: "Reports" },
    ],
  },
  {
    name: "Power Dialer",
    items: [
      { key: "dialer-pricing", label: "Pricing" },
      { key: "dialer-reports", label: "Reports" },
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
      style={{
        width: 244,
        flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid #ebedf0",
        paddingTop: 20,
        paddingBottom: 20,
        position: "sticky",
        top: 56,
        height: "calc(100vh - 56px)",
        overflowY: "auto",
      }}
    >
      {GROUPS.map((g, gi) => (
        <Fragment key={g.name}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#374151",
              padding: gi === 0 ? "8px 18px 8px 18px" : "18px 18px 8px 18px",
              marginTop: gi === 0 ? 0 : 6,
              borderTop: gi === 0 ? "none" : "1px solid #ebedf0",
            }}
          >
            {g.name}
          </div>
          {g.items.map((i) => {
            const isActive = active === i.key;
            return (
              <div
                key={i.key}
                onClick={() => onSelect(i.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "0 10px",
                  padding: "7px 12px",
                  borderRadius: 7,
                  fontSize: 13.25,
                  color: isActive ? "#fff" : "#5b606a",
                  fontWeight: isActive ? 500 : 400,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background 0.12s, color 0.12s",
                  position: "relative",
                  background: isActive ? "#0d4b3a" : "transparent",
                  boxShadow: isActive
                    ? "0 1px 2px rgba(13,75,58,0.20), 0 4px 12px -4px rgba(13,75,58,0.30), inset 0 1px 0 rgba(255,255,255,0.10)"
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(12,13,16,0.04)";
                    e.currentTarget.style.color = "#0a0d14";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#5b606a";
                  }
                }}
              >
                {i.label}
              </div>
            );
          })}
        </Fragment>
      ))}
    </aside>
  );
}
