import { Fragment } from "react";

export type RailItem = { key: string; label: string };
export type RailGroup = { name: string; items: RailItem[] };

export const GROUPS: RailGroup[] = [
  {
    name: "Inbound",
    items: [{ key: "web-form", label: "Web Form" }],
  },
];

export function AutomationsSubRail({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <aside
      className="w-[220px] shrink-0 border-r border-gray-200 bg-white px-3 py-5"
      style={{ position: "sticky", top: 56, height: "calc(100vh - 56px)" }}
    >
      {GROUPS.map((g) => (
        <Fragment key={g.name}>
          <div className="mt-2 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {g.name}
          </div>
          {g.items.map((i) => (
            <div
              key={i.key}
              onClick={() => onSelect(i.key)}
              className={
                "cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] " +
                (active === i.key
                  ? "bg-[#e6f1ec] font-medium text-[#0a3d4a]"
                  : "text-gray-700 hover:bg-gray-50")
              }
            >
              {i.label}
            </div>
          ))}
        </Fragment>
      ))}
    </aside>
  );
}
