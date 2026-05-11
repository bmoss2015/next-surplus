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
        placeholder="Search lead ID, address, owner..."
        className="w-full rounded-md border border-gray-200 bg-surface py-[6px] pl-8 pr-8 text-xs text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
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
