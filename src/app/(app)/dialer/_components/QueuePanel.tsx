"use client";

import { IconSearch, IconCheck } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { DialerLead } from "../_mock-data";

export function QueuePanel({
  leads,
  activeLeadId,
  onSelect,
  calledLeadIds,
}: {
  leads: DialerLead[];
  activeLeadId: string;
  onSelect: (id: string) => void;
  calledLeadIds: Set<string>;
}) {
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = leads.filter((l) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      l.primaryName.toLowerCase().includes(needle) ||
      l.caseNumber.toLowerCase().includes(needle) ||
      l.propertyAddress.toLowerCase().includes(needle)
    );
  });

  const activeIndex = leads.findIndex((l) => l.id === activeLeadId);

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-gray-200">
      <div className="px-5 pb-3 pt-5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-gray-500">
          Queue
        </div>
        <div className="mt-1 text-[14px] font-semibold text-ink">
          Lead {Math.max(0, activeIndex) + 1} of {leads.length}
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="relative">
          <IconSearch
            size={14}
            stroke={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads"
            className="h-9 w-full rounded-md bg-[#F5F5F5] pl-8 pr-9 text-[12.5px] text-ink placeholder:text-gray-400 outline-none transition focus:bg-white focus:ring-1 focus:ring-petrol-500"
          />
          <span
            title="Press / to focus"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-500"
          >
            /
          </span>
        </div>
      </div>

      <div className="queue-scroll flex-1 overflow-y-auto px-2 pb-4">
        {filtered.map((lead, i) => {
          const idx = leads.findIndex((l) => l.id === lead.id) + 1;
          const isActive = lead.id === activeLeadId;
          const isCalled = calledLeadIds.has(lead.id) || lead.completed;
          return (
            <button
              key={lead.id + "-" + i}
              type="button"
              onClick={() => onSelect(lead.id)}
              className={[
                "group relative mx-1 mb-1 flex w-[calc(100%-8px)] items-start gap-2.5 rounded-md px-2.5 py-2.5 text-left transition",
                isCalled && !isActive ? "opacity-55" : "",
                isActive ? "bg-gray-50" : "hover:bg-gray-50",
              ].join(" ")}
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-petrol-500"
                />
              )}
              <div
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  isActive
                    ? "bg-petrol-500 text-white"
                    : isCalled
                      ? "bg-petrol-500/80 text-white"
                      : "bg-gray-200 text-gray-600",
                ].join(" ")}
              >
                {isCalled && !isActive ? <IconCheck size={11} stroke={3} /> : idx}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={[
                    "truncate text-[13px] font-medium",
                    isCalled && !isActive ? "text-gray-500 line-through" : "text-ink",
                  ].join(" ")}
                >
                  {lead.primaryName}
                </div>
                <div className="truncate text-[11.5px] text-gray-500">
                  {lead.county}, {lead.state}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-petrol-500 tabular-nums">
                  ${lead.surplus.toLocaleString()} Surplus
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] text-gray-500">
            No matches
          </div>
        )}
      </div>

      <style jsx global>{`
        .queue-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(107, 114, 128, 0.4) #e5e7eb;
        }
        .queue-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .queue-scroll::-webkit-scrollbar-track {
          background: #e5e7eb;
        }
        .queue-scroll::-webkit-scrollbar-thumb {
          background: rgba(107, 114, 128, 0.4);
          border-radius: 3px;
        }
        .queue-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.65);
        }
      `}</style>
    </aside>
  );
}
