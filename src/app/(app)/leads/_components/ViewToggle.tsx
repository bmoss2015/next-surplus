"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS = [
  { label: "Daily Work", href: "/leads/daily" },
  { label: "Kanban", href: "/leads/kanban" },
  { label: "Table", href: "/leads" },
] as const;

export function ViewToggle({ active }: { active: "daily" | "kanban" | "table" }) {
  const map = { daily: "Daily Work", kanban: "Kanban", table: "Table" } as const;
  return (
    <div className="inline-flex gap-0 rounded-[7px] bg-gray-150 p-[3px]">
      {TABS.map((tab) => {
        const isActive = tab.label === map[active];
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "rounded-[5px] px-3 py-[6px] text-xs transition-colors",
              isActive
                ? "bg-surface text-ink font-medium shadow-card-hover"
                : "text-gray-500 hover:text-ink"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
