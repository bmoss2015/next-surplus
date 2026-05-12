"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal state when URL changes (e.g., back button, Clear all)
  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  function commit(next: string) {
    const sp = new URLSearchParams(params.toString());
    if (next.trim()) sp.set("q", next.trim());
    else sp.delete("q");
    sp.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => commit(e.target.value), 250);
  }

  function clear() {
    setValue("");
    if (debounce.current) clearTimeout(debounce.current);
    commit("");
  }

  return (
    <div className="relative w-72">
      <IconSearch
        size={14}
        stroke={1.75}
        className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search by lead ID, address, or owner name..."
        className="w-full rounded-md border border-[#e2e8f0] bg-white py-[6px] pl-8 pr-8 text-xs text-ink outline-none transition-colors placeholder:not-italic placeholder:text-[#94a3b8] focus:border-[#0d6c7d]"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-[8px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink"
          aria-label="Clear search"
        >
          <IconX size={13} stroke={2} />
        </button>
      )}
    </div>
  );
}
