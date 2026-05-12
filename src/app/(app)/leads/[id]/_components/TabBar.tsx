"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "property", label: "Property Info" },
  { key: "contacts", label: "Contacts" },
  { key: "research", label: "Research" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "tasks", label: "Tasks" },
  { key: "discussion", label: "Discussion" },
  { key: "activity", label: "Activity" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function TabBar({
  active,
  openTaskCount = 0,
}: {
  active: TabKey;
  openTaskCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function go(key: TabKey) {
    const sp = new URLSearchParams(params.toString());
    if (key === "overview") sp.delete("tab");
    else sp.set("tab", key);
    const qs = sp.toString();
    startTransition(() => {
      // Fix UU: keep the scroll position — never jump to the top of the page
      // when switching tabs.
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="mb-4 inline-flex gap-[3px] rounded-lg bg-gray-150 p-1">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const showBadge = tab.key === "tasks" && openTaskCount > 0;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => go(tab.key)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-[14px] py-[7px] text-xs transition-colors",
              isActive
                ? "bg-petrol-500 font-medium text-white"
                : "text-gray-500 hover:text-ink"
            )}
          >
            {tab.label}
            {showBadge && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-[1px] text-[10px] font-semibold leading-none",
                  isActive ? "bg-white/25 text-white" : "bg-petrol-100 text-petrol-700"
                )}
              >
                {openTaskCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
