"use client";

// Searchable combobox-style multi-select for US states. Replaces the
// inline chip grid for places where the user picks from all 50 states
// (Attorney drawer, future Research template editor). Pattern: tag
// input + popover with search. Notion / Linear / Attio style.

import { useEffect, useMemo, useRef, useState } from "react";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { US_STATES } from "./StatesPicker";

const ALL_CODES = US_STATES.map((s) => s.code);

export function StatesPickerCombobox({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const allSelected = value.length >= ALL_CODES.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return US_STATES;
    return US_STATES.filter(
      (s) =>
        s.code.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function toggle(code: string) {
    if (value.includes(code)) onChange(value.filter((c) => c !== code));
    else onChange([...value, code].sort());
  }

  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange([...ALL_CODES]);
  }

  function removeOne(code: string) {
    onChange(value.filter((c) => c !== code));
  }

  return (
    <div ref={rootRef} className="relative" style={{ width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-left text-[13px] text-ink"
        style={{ border: "1px solid #ebedf0", minHeight: 38 }}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-gray-400 text-[12.5px]">
              Pick states this attorney covers, or All States for national…
            </span>
          ) : allSelected ? (
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium"
              style={{ background: "#0d4b3a", color: "#fff" }}
            >
              All States (National)
            </span>
          ) : (
            value.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium"
                style={{ background: "#0d4b3a", color: "#fff" }}
              >
                {code}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOne(code);
                  }}
                  className="cursor-pointer rounded-sm hover:bg-white/20"
                  aria-label={`Remove ${code}`}
                >
                  <IconX size={11} stroke={2.5} />
                </button>
              </span>
            ))
          )}
        </div>
        <IconChevronDown
          size={14}
          stroke={1.75}
          className="text-gray-400 shrink-0"
        />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 w-full rounded-md bg-white shadow-lg"
          style={{ border: "1px solid #ebedf0", maxHeight: 320 }}
        >
          <div className="p-2" style={{ borderBottom: "1px solid #ebedf0" }}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code or name…"
              className="w-full rounded-md px-2 py-1 text-[12.5px] text-ink focus:outline-none"
              style={{ border: "1px solid #ebedf0" }}
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            <label
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12.5px] text-ink hover:bg-gray-50"
              style={{ borderBottom: "1px solid #f1f2f4" }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="cursor-pointer accent-petrol-500"
              />
              <span className="font-medium">All States (National)</span>
              <span className="text-gray-500 text-[11.5px]">
                ({ALL_CODES.length} codes)
              </span>
            </label>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-gray-500">
                No matches.
              </div>
            ) : (
              filtered.map((s) => {
                const on = value.includes(s.code);
                return (
                  <label
                    key={s.code}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[12.5px] text-ink hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(s.code)}
                      className="cursor-pointer accent-petrol-500"
                    />
                    <span className="font-medium tabular-nums w-6">
                      {s.code}
                    </span>
                    <span className="text-gray-700">{s.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
