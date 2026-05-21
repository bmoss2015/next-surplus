"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import { cn } from "@/lib/cn";

type Result = {
  group: string;
  groupLabel: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

// Global search bar — lives in TopNav. Calls /api/search/global with a small
// debounce, groups hits by category, shows a popover beneath the input with
// arrow-key navigation + Enter to open the highlighted result.
export function GlobalSearch() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  // Debounced fetch
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const json = (await res.json()) as Result[];
          setResults(json);
          setActive(0);
        }
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  // Close popover when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!wrapRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Cmd/Ctrl+K focuses the input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r);
    }
  }

  function go(r: Result) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(r.href);
  }

  // Group results by category (preserve API order)
  const groups: { label: string; items: Result[] }[] = [];
  for (const r of results) {
    let g = groups.find((x) => x.label === r.groupLabel);
    if (!g) {
      g = { label: r.groupLabel, items: [] };
      groups.push(g);
    }
    g.items.push(r);
  }

  const hasQuery = query.trim().length >= 2;
  const popoverOpen = open && hasQuery;

  return (
    <div ref={wrapRef} className="relative">
      <label className="flex h-8 cursor-text items-center gap-2 rounded-md border border-transparent bg-gray-100 px-3 text-[12.5px] text-gray-500 hover:bg-gray-150 focus-within:border-gray-200 focus-within:bg-surface">
        <IconSearch size={13} stroke={1.75} />
        <input
          ref={inputRef}
          id="topnav-search"
          type="search"
          placeholder="Search leads, attorneys, members…"
          className="w-56 bg-transparent text-ink outline-none placeholder:text-gray-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        <kbd className="rounded border border-gray-200 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-gray-500 font-mono">⌘K</kbd>
      </label>

      {popoverOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-[440px] max-w-[90vw] overflow-hidden rounded-md border border-gray-200 bg-surface shadow-card-hover">
          {loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px] text-gray-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px] text-gray-400">
              No matches for <span className="font-mono text-ink">&ldquo;{query.trim()}&rdquo;</span>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto py-1">
              {groups.map((g) => (
                <div key={g.label} className="py-1">
                  <div className="px-3 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {g.label}
                  </div>
                  {g.items.map((r) => {
                    const idx = results.indexOf(r);
                    const isActive = idx === active;
                    return (
                      <button
                        key={`${r.group}:${r.id}`}
                        type="button"
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(r)}
                        className={cn(
                          "block w-full px-3 py-2 text-left",
                          isActive ? "bg-gray-100" : "hover:bg-gray-50"
                        )}
                      >
                        <div className="truncate text-[13px] font-medium text-ink">{r.title}</div>
                        {r.subtitle && (
                          <div className="truncate text-[11.5px] text-gray-500 mt-0.5 tabular-nums">{r.subtitle}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-gray-150 px-3 py-1.5 text-[11px] text-gray-400">
            <span className="font-mono">↑↓</span> navigate · <span className="font-mono">⏎</span> open · <span className="font-mono">esc</span> close
          </div>
        </div>
      )}
    </div>
  );
}
