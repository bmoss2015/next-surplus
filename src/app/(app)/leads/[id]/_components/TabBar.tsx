"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "contacts", label: "Contacts" },
  { key: "research", label: "Research" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "discussion", label: "Discussion" },
  { key: "activity", label: "Activity" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function TabBar({ active }: { active: TabKey }) {
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
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => go(tab.key)}
            className={cn(
              "cursor-pointer rounded-md px-[14px] py-[7px] text-xs transition-colors",
              isActive
                ? "bg-petrol-500 font-medium text-white"
                : "text-gray-500 hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
