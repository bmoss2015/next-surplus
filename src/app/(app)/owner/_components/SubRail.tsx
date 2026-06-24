// Owner area sub-rail. Visual style matches Settings sub-rail
// (preview.css .nav-item / .nav-item.active): solid brand-emerald
// background on the active item, subtle gray on hover. Keeps the
// portal's left rails feeling like one product.

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
      className="w-[220px] shrink-0 overflow-y-auto bg-white py-3"
      style={{
        position: "sticky",
        top: 0,
        height: "calc(100vh - 56px)",
        borderRight: "1px solid #ebedf0",
      }}
    >
      {GROUPS.map((g) => (
        <Fragment key={g.name}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#5b606a",
              padding: "16px 18px 8px 18px",
            }}
          >
            {g.name}
          </div>
          {g.items.map((i) => {
            const isActive = active === i.key;
            return (
              <button
                key={i.key}
                type="button"
                onClick={() => onSelect(i.key)}
                style={{
                  display: "flex",
                  width: "calc(100% - 20px)",
                  margin: "0 10px",
                  padding: "7px 12px",
                  alignItems: "center",
                  textAlign: "left",
                  borderRadius: 7,
                  fontSize: 13.25,
                  fontWeight: isActive ? 500 : 400,
                  cursor: "pointer",
                  transition: "background 0.12s, color 0.12s",
                  background: isActive ? "#0d4b3a" : "transparent",
                  color: isActive ? "#fff" : "#5b606a",
                  boxShadow: isActive
                    ? "0 1px 2px rgba(13, 75, 58, 0.20), 0 4px 12px -4px rgba(13, 75, 58, 0.30), inset 0 1px 0 rgba(255,255,255,0.10)"
                    : "none",
                  border: "none",
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
              </button>
            );
          })}
        </Fragment>
      ))}
    </aside>
  );
}
