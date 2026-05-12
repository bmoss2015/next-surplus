"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { IconArrowUp, IconArrowDown, IconArrowsSort } from "@tabler/icons-react";
import type { SortColumn, SortDir } from "@/lib/leads/types";
import { cn } from "@/lib/cn";

export function SortHeader({
  column,
  label,
  align = "left",
  className,
  title,
}: {
  column: SortColumn;
  label: string;
  align?: "left" | "right";
  className?: string;
  title?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentSort = params.get("sort") as SortColumn | null;
  const currentDir = (params.get("dir") as SortDir | null) ?? "desc";
  const isActive = currentSort === column;

  function toggle() {
    const sp = new URLSearchParams(params.toString());
    if (!isActive) {
      sp.set("sort", column);
      sp.set("dir", "desc");
    } else if (currentDir === "desc") {
      sp.set("dir", "asc");
    } else {
      sp.delete("sort");
      sp.delete("dir");
    }
    sp.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }

  const Icon = !isActive
    ? IconArrowsSort
    : currentDir === "asc"
      ? IconArrowUp
      : IconArrowDown;

  return (
    <button
      type="button"
      onClick={toggle}
      title={title}
      className={cn(
        "group flex w-full items-center gap-1 text-[11px] tracking-[0.4px] text-gray-500 hover:text-ink",
        align === "right" && "justify-end",
        isActive && "text-ink",
        className
      )}
    >
      <span>{label}</span>
      <Icon
        size={12}
        stroke={2}
        className={cn(
          "transition-opacity",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        )}
      />
    </button>
  );
}
