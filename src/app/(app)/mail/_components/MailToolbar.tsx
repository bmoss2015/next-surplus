"use client";

import { useEffect, useRef, useState } from "react";
import { IconSearch, IconX, IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/cn";

// Linear-style filter toolbar — slim search input on the left, chip
// dropdowns on the right. Multi-select chips show a count badge when
// active. Filters apply client-side over the rows the page already
// fetched (last 30 days, capped at 200); section grouping is preserved
// underneath, only the contents narrow.
//
// State lives in URL params so a filtered view is shareable.

export type MailFilterState = {
  q: string;
  status: string[];
  mailClass: string[];
  dateRange: "7d" | "30d";
  provider: string[];
};

export const DEFAULT_MAIL_FILTERS: MailFilterState = {
  q: "",
  status: [],
  mailClass: [],
  dateRange: "30d",
  provider: [],
};

export function filtersAreActive(f: MailFilterState): boolean {
  return (
    f.q.trim().length > 0 ||
    f.status.length > 0 ||
    f.mailClass.length > 0 ||
    f.dateRange !== "30d" ||
    f.provider.length > 0
  );
}

type Option = { value: string; label: string };

const STATUS_OPTIONS: Option[] = [
  { value: "processing", label: "Processing" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
];

const CLASS_OPTIONS: Option[] = [
  { value: "first_class", label: "First Class" },
  { value: "certified", label: "Certified" },
  { value: "standard", label: "Standard" },
];

const PROVIDER_OPTIONS: Option[] = [
  { value: "click2mail", label: "Click2Mail" },
  { value: "lob", label: "Lob" },
];

const DATE_OPTIONS: { value: MailFilterState["dateRange"]; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function MailToolbar({
  filters,
  onChange,
}: {
  filters: MailFilterState;
  onChange: (next: MailFilterState) => void;
}) {
  const active = filtersAreActive(filters);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <SearchInput
        value={filters.q}
        onChange={(q) => onChange({ ...filters, q })}
      />

      <ChipMulti
        label="Status"
        values={filters.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <ChipMulti
        label="Class"
        values={filters.mailClass}
        options={CLASS_OPTIONS}
        onChange={(mailClass) => onChange({ ...filters, mailClass })}
      />
      <ChipSingle
        label="Date"
        value={filters.dateRange}
        options={DATE_OPTIONS}
        onChange={(dateRange) => onChange({ ...filters, dateRange })}
      />
      {/* Provider chip removed — customer-side doesn't need to know
          whether mail goes through Lob or anyone else. The portal is
          provider-agnostic from their perspective. */}

      {active && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_MAIL_FILTERS)}
          className="ml-auto inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-[11.5px] font-medium text-ink hover:border-petrol-500"
        >
          <IconX size={13} stroke={2} />
          Clear filters
        </button>
      )}
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative w-[320px]">
      <IconSearch
        size={14}
        stroke={1.75}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search recipient, address, tracking…"
        className="h-[30px] w-full rounded-md border border-gray-200 bg-white pl-7 pr-2 text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
      />
    </div>
  );
}

function ChipBase({
  label,
  active,
  count,
  open,
  onToggle,
  children,
}: {
  label: string;
  active: boolean;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onToggle();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium",
          active
            ? "border-petrol-500 bg-petrol-500 text-white"
            : "border-gray-200 bg-white text-ink hover:border-petrol-500"
        )}
      >
        {label}
        {count !== undefined && count > 0 && !active && (
          <span className="rounded-full bg-petrol-50 px-1.5 text-[10px] font-semibold text-petrol-700">
            {count}
          </span>
        )}
        {active && count !== undefined && count > 0 && (
          <span className="rounded-full bg-white/25 px-1.5 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
        <IconChevronDown size={12} stroke={2} />
      </button>
      {open && (
        <div className="absolute left-0 top-[34px] z-20 min-w-[180px] rounded-md border border-gray-200 bg-white p-1 shadow-card">
          {children}
        </div>
      )}
    </div>
  );
}

function ChipMulti({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: Option[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = values.length > 0;

  function toggle(v: string) {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
    // Multi-select stays open across clicks. Outside click via
    // ChipBase's document mousedown listener closes the dropdown.
  }

  return (
    <ChipBase
      label={label}
      active={active}
      count={values.length}
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      {options.map((opt) => {
        const checked = values.includes(opt.value);
        return (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-[12px] text-ink hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="cursor-pointer accent-petrol-500"
            />
            {opt.label}
          </label>
        );
      })}
      {active && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-1 block w-full cursor-pointer rounded-sm border-t border-gray-100 px-2 py-1.5 text-left text-[11px] text-gray-500 hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </ChipBase>
  );
}

function ChipSingle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  // Single-select chip never reads as "active" on its own — Date always
  // has a value. Show only the current label as the chip text.
  const current = options.find((o) => o.value === value);

  return (
    <ChipBase
      label={current ? `${label}: ${current.label}` : label}
      active={false}
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            onChange(opt.value);
            setOpen(false);
          }}
          className={cn(
            "block w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-[12px] hover:bg-gray-50",
            opt.value === value ? "text-petrol-700 font-medium" : "text-ink"
          )}
        >
          {opt.label}
        </button>
      ))}
    </ChipBase>
  );
}

// ---- URL ↔ filter state helpers ----

export function readFiltersFromParams(
  params: URLSearchParams
): MailFilterState {
  const q = params.get("q") ?? "";
  const status = (params.get("status") ?? "").split(",").filter(Boolean);
  const mailClass = (params.get("class") ?? "").split(",").filter(Boolean);
  const provider = (params.get("provider") ?? "").split(",").filter(Boolean);
  const dr = params.get("date");
  const dateRange: MailFilterState["dateRange"] = dr === "7d" ? "7d" : "30d";
  return { q, status, mailClass, dateRange, provider };
}

export function writeFiltersToParams(
  params: URLSearchParams,
  f: MailFilterState
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  if (f.q.trim()) next.set("q", f.q.trim());
  else next.delete("q");
  if (f.status.length > 0) next.set("status", f.status.join(","));
  else next.delete("status");
  if (f.mailClass.length > 0) next.set("class", f.mailClass.join(","));
  else next.delete("class");
  if (f.provider.length > 0) next.set("provider", f.provider.join(","));
  else next.delete("provider");
  if (f.dateRange !== "30d") next.set("date", f.dateRange);
  else next.delete("date");
  return next;
}
