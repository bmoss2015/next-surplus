"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

const STAGES = [
  { key: "all", label: "All" },
  { key: "with_attorney", label: "With Attorney" },
  { key: "claim_filed", label: "Claim Filed" },
  { key: "won", label: "Won" },
] as const;

export function ClaimsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const active = params.get("stage") ?? "all";

  function pick(key: string) {
    const sp = new URLSearchParams(params.toString());
    if (key === "all") sp.delete("stage");
    else sp.set("stage", key);
    sp.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }

  return (
    <div className="mb-4 inline-flex gap-[3px] rounded-lg bg-gray-150 p-1">
      {STAGES.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => pick(s.key)}
          className={cn(
            "rounded-md px-[14px] py-[6px] text-xs transition-colors",
            active === s.key
              ? "bg-petrol-500 font-medium text-white"
              : "text-gray-500 hover:text-ink"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
