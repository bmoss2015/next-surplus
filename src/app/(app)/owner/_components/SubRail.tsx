// Owner area sub-rail. Mirrors the Settings rail pattern (group headers
// + items) but with owner-only sections. New panels can be added by
// appending to GROUPS. The /owner route page renders this on the left
// and OwnerView swaps the active panel into the content column.

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
    name: "Mail",
    items: [{ key: "provider-costs", label: "Provider Costs" }],
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
      className="w-[220px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white py-5"
      style={{ position: "sticky", top: 0, height: "calc(100vh - 56px)" }}
    >
      {GROUPS.map((g) => (
        <Fragment key={g.name}>
          <div className="px-5 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {g.name}
          </div>
          {g.items.map((i) => {
            const isActive = active === i.key;
            return (
              <button
                key={i.key}
                type="button"
                onClick={() => onSelect(i.key)}
                className={
                  "flex w-full cursor-pointer items-center px-5 py-2 text-left text-[13px] transition-colors " +
                  (isActive
                    ? "bg-petrol-50 font-medium text-petrol-700"
                    : "text-ink hover:bg-gray-50")
                }
                style={
                  isActive
                    ? {
                        boxShadow: "inset 3px 0 0 var(--color-petrol-500)",
                      }
                    : undefined
                }
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
