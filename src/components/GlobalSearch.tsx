"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconSearch,
  IconHome2,
  IconScale,
  IconUsers,
  IconMail,
  IconMessage2,
  IconClipboardList,
  IconMailbox,
} from "@tabler/icons-react";
import { cn } from "@/lib/cn";

type Result = {
  group: string;
  groupLabel: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

const GROUP_ICONS: Record<string, typeof IconSearch> = {
  leads: IconHome2,
  mail_jobs: IconMail,
  attorneys: IconScale,
  members: IconUsers,
  email_templates: IconMail,
  sms_templates: IconMessage2,
  research_templates: IconClipboardList,
  mail_templates: IconMailbox,
};

function iconFor(group: string) {
  return GROUP_ICONS[group] ?? IconSearch;
}

// Wrap the first case-insensitive occurrence of `query` inside `text` with a
// bold span so the user can see exactly what matched. Returns the original
// string when there's no match (subtitle fragments often don't contain the
// query — they're contextual breadcrumbs added by the API).
function highlight(text: string, query: string): React.ReactNode {
  if (!text) return text;
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-ink">
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

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

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!wrapRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  const groups: { label: string; group: string; items: Result[] }[] = [];
  for (const r of results) {
    let g = groups.find((x) => x.label === r.groupLabel);
    if (!g) {
      g = { label: r.groupLabel, group: r.group, items: [] };
      groups.push(g);
    }
    g.items.push(r);
  }

  const hasQuery = query.trim().length >= 2;
  const popoverOpen = open && hasQuery;
  const q = query.trim();

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
      </label>

      {popoverOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-[460px] max-w-[90vw] overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-elevated">
          {loading && results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px] text-gray-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px] text-gray-400">
              No matches for <span className="font-mono text-ink">&ldquo;{q}&rdquo;</span>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto py-1">
              {groups.map((g) => {
                const GroupIcon = iconFor(g.group);
                return (
                  <div key={g.label} className="py-1">
                    <div className="flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      <GroupIcon size={11} stroke={2} />
                      {g.label}
                    </div>
                    {g.items.map((r) => {
                      const idx = results.indexOf(r);
                      const isActive = idx === active;
                      const RowIcon = iconFor(r.group);
                      return (
                        <button
                          key={`${r.group}:${r.id}`}
                          type="button"
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go(r)}
                          className={cn(
                            "flex w-full items-start gap-3 px-3 py-2 text-left transition-colors",
                            isActive ? "bg-gray-100" : "hover:bg-gray-50"
                          )}
                        >
                          <span className="mt-[2px] flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                            <RowIcon size={13} stroke={1.75} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-ink">
                              {highlight(r.title, q)}
                            </span>
                            {r.subtitle && (
                              <span className="mt-0.5 block truncate text-[11.5px] text-gray-500 tabular-nums">
                                {highlight(r.subtitle, q)}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
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
