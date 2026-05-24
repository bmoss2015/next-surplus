"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { IconSearch, IconX } from "@tabler/icons-react";

type SearchHit = { id: string; lead_id: string; address: string; owner: string | null };

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();
  const commitDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Fix FFF Patch: inline results dropdown rendered via createPortal ----
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Sync internal state when URL changes (e.g., back button, Clear all)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(params.get("q") ?? "");
  }, [params]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (wrapRef.current && !wrapRef.current.contains(t) && !t.closest("[data-search-results]")) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function refreshRect() {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width });
  }

  function commit(next: string) {
    const sp = new URLSearchParams(params.toString());
    if (next.trim()) sp.set("q", next.trim());
    else sp.delete("q");
    sp.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }

  async function lookup(q: string) {
    const term = q.trim();
    if (!term) {
      setHits([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    refreshRect();
    setOpen(true);
    try {
      const res = await fetch(`/api/leads/search?q=${encodeURIComponent(term)}`);
      const data = (await res.json()) as SearchHit[];
      setHits(Array.isArray(data) ? data : []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (commitDebounce.current) clearTimeout(commitDebounce.current);
    commitDebounce.current = setTimeout(() => commit(next), 250);
    if (lookupDebounce.current) clearTimeout(lookupDebounce.current);
    lookupDebounce.current = setTimeout(() => lookup(next), 300);
  }

  function clear() {
    setValue("");
    setHits([]);
    setOpen(false);
    if (commitDebounce.current) clearTimeout(commitDebounce.current);
    if (lookupDebounce.current) clearTimeout(lookupDebounce.current);
    commit("");
  }

  function go(id: string) {
    setOpen(false);
    router.push(`/leads/${id}`);
  }

  return (
    <div className="relative w-72" ref={wrapRef}>
      <IconSearch
        size={14}
        stroke={1.75}
        className="pointer-events-none absolute left-[10px] top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => {
          if (value.trim() && hits.length > 0) {
            refreshRect();
            setOpen(true);
          }
        }}
        placeholder="Search by lead ID, address, or owner name..."
        className="w-full rounded-md border border-[#e2e8f0] bg-white py-[6px] pl-8 pr-8 text-xs text-ink outline-none transition-colors placeholder:not-italic placeholder:text-[#94a3b8] focus:border-[#13644e]"
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

      {mounted &&
        open &&
        rect &&
        createPortal(
          <div
            data-search-results
            className="absolute z-[9999] max-h-[320px] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-elevated"
            style={{ top: rect.top + 4, left: rect.left, width: rect.width }}
          >
            {loading ? (
              <div className="px-3 py-2 text-[12px] text-gray-400">Searching…</div>
            ) : hits.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-gray-500">No leads found</div>
            ) : (
              hits.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => go(h.id)}
                  className="block w-full cursor-pointer truncate px-3 py-2 text-left text-[12px] text-ink hover:bg-[#f3f4f6]"
                >
                  <span className="font-mono text-[11px] text-gray-500">{h.lead_id}</span>
                  {" · "}
                  {h.address}
                  {h.owner ? ` · ${h.owner}` : ""}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
