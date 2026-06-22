"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconSearch,
  IconFileUpload,
  IconBookmark,
  IconWorld,
  IconArrowNarrowRight,
} from "@tabler/icons-react";

type BaseSet = {
  id: string;
  name: string;
  count: number;
  kind: "all" | "import" | "saved";
  meta?: string;
  states?: string[];
};

const BASE_SETS: BaseSet[] = [
  { id: "all-leads", name: "All Leads", count: 412, kind: "all" },
  { id: "fort-bend", name: "Fort Bend County, Texas", count: 47, kind: "import", meta: "Imported Jun 21, 2026", states: ["Texas"] },
  { id: "mecklenburg", name: "Mecklenburg County, North Carolina", count: 23, kind: "import", meta: "Imported Jun 19, 2026", states: ["North Carolina"] },
  { id: "heir-batch", name: "Heir Research Batch", count: 12, kind: "import", meta: "Imported Jun 17, 2026", states: ["Texas", "North Carolina", "Arizona"] },
  { id: "travis-may", name: "Travis County, Texas", count: 31, kind: "import", meta: "Imported May 28, 2026", states: ["Texas"] },
  { id: "high-surplus", name: "High Surplus All States", count: 38, kind: "saved" },
  { id: "no-contact-60", name: "No Contact 60+ Days", count: 34, kind: "saved", states: ["Texas", "North Carolina", "Arizona", "Georgia", "Ohio"] },
];

const STAGES = ["New Lead", "Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed", "Closed Won", "Closed Lost", "Callback Scheduled", "Do Not Pursue"];
const STATES = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Florida", "Georgia", "Illinois", "Indiana", "Iowa", "Kentucky", "Louisiana", "Maryland", "Michigan", "Mississippi", "Missouri", "Nevada", "New Mexico", "New York", "North Carolina", "Ohio", "Oklahoma", "Pennsylvania", "South Carolina", "Tennessee", "Texas", "Virginia", "Washington", "Wisconsin"];
const COUNTIES_BY_STATE: Record<string, string[]> = {
  "Texas": ["Travis", "Harris", "Dallas", "Fort Bend", "Bexar", "Tarrant"],
  "North Carolina": ["Mecklenburg", "Wake", "Guilford", "Forsyth", "Durham"],
  "Arizona": ["Maricopa", "Pima", "Pinal", "Yavapai"],
  "Georgia": ["Fulton", "Gwinnett", "Cobb", "DeKalb", "Clayton"],
  "Ohio": ["Cuyahoga", "Franklin", "Hamilton", "Summit"],
  "Florida": ["Miami-Dade", "Broward", "Palm Beach", "Orange", "Hillsborough"],
};
const SALE_TYPES = ["Tax Sale", "Mortgage Foreclosure"];
const OWNER_STATUS = ["Living", "Deceased"];
const LAST_TOUCHED = [
  { id: "any", label: "Any" },
  { id: "30", label: "30+ Days" },
  { id: "60", label: "60+ Days" },
  { id: "90", label: "90+ Days" },
];

function formatCurrency(v: string): string {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString();
}

function PopoverMultiSelect({
  options,
  values,
  onChange,
  placeholder,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const summary = values.length === 0 ? placeholder : values.length === 1 ? values[0] : `${values[0]} +${values.length - 1}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex h-9 w-full cursor-pointer items-center justify-between rounded-[8px] border bg-white px-3.5 text-left text-[13px] transition",
          values.length > 0
            ? "border-[#0f1729] font-semibold text-[#0f1729]"
            : "border-[#e5e7eb] text-[#9ca3af] hover:border-[#9ca3af]",
        ].join(" ")}
      >
        <span className="truncate">{summary}</span>
        {open ? (
          <IconChevronUp size={14} stroke={2} className="ml-2 shrink-0 text-[#9ca3af]" />
        ) : (
          <IconChevronDown size={14} stroke={2} className="ml-2 shrink-0 text-[#9ca3af]" />
        )}
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white"
          style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18), 0 2px 6px rgba(15,23,41,0.06)" }}
        >
          <div className="flex items-center gap-2 border-b border-[#f1f2f4] px-3 py-2">
            <IconSearch size={13} stroke={2} className="text-[#9ca3af]" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-[12.5px] text-[#0f1729] outline-none placeholder:text-[#9ca3af]"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-[#9ca3af]">No matches</div>
            ) : (
              filtered.map((o) => {
                const checked = values.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onChange(checked ? values.filter((x) => x !== o) : [...values, o])}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-[12.5px] text-[#374151] transition hover:bg-[#f7f8f9]"
                  >
                    <span className={checked ? "font-semibold text-[#0f1729]" : "font-medium"}>{o}</span>
                    {checked && <IconCheck size={12} stroke={2.5} className="text-[#13644e]" />}
                  </button>
                );
              })
            )}
          </div>
          {values.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer border-t border-[#f1f2f4] px-3 py-2 text-left text-[11.5px] font-medium text-[#6b7280] hover:bg-[#f7f8f9]"
            >
              Clear {values.length} selection{values.length === 1 ? "" : "s"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BaseSetPicker({ value, onChange }: { value: BaseSet; onChange: (v: BaseSet) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const filtered = BASE_SETS.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  const groups = [
    { key: "all", label: "Everyone In The Database", icon: <IconWorld size={11} stroke={2.25} /> },
    { key: "import", label: "Imports", icon: <IconFileUpload size={11} stroke={2.25} /> },
    { key: "saved", label: "Saved Lists", icon: <IconBookmark size={11} stroke={2.25} /> },
  ] as const;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[#0f1729] bg-white px-5 py-4 text-left transition hover:bg-[#fbfbfc]"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold tracking-[-0.005em] text-[#0f1729]">
            {value.name}
          </div>
          {value.meta && (
            <div className="mt-0.5 text-[12px] text-[#6b7280]">
              {value.meta}
            </div>
          )}
        </div>
        <div className="ml-3 flex items-center gap-2">
          <span className="rounded-md bg-[#0f1729] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
            {value.count}
          </span>
          {open ? (
            <IconChevronUp size={16} stroke={2} className="text-[#9ca3af]" />
          ) : (
            <IconChevronDown size={16} stroke={2} className="text-[#9ca3af]" />
          )}
        </div>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white"
          style={{ boxShadow: "0 16px 40px -8px rgba(15,23,41,0.18), 0 4px 8px rgba(15,23,41,0.06)" }}
        >
          <div className="flex items-center gap-2 border-b border-[#f1f2f4] px-4 py-3">
            <IconSearch size={14} stroke={2} className="text-[#9ca3af]" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Starting Sets"
              className="w-full bg-transparent text-[13px] text-[#0f1729] outline-none placeholder:text-[#9ca3af]"
            />
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {groups.map((g) => {
              const items = filtered.filter((b) => b.kind === g.key);
              if (items.length === 0) return null;
              return (
                <div key={g.key} className="border-b border-[#f1f2f4] py-2 last:border-b-0">
                  <div className="flex items-center gap-1.5 px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                    {g.icon}
                    {g.label}
                  </div>
                  {items.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onChange(b);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={[
                        "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2 text-left transition",
                        b.id === value.id ? "bg-[#f7f8f9]" : "hover:bg-[#f7f8f9]",
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <div className={["truncate text-[13px]", b.id === value.id ? "font-semibold text-[#0f1729]" : "font-medium text-[#374151]"].join(" ")}>
                          {b.name}
                        </div>
                        {b.meta && (
                          <div className="mt-0.5 text-[11.5px] text-[#9ca3af]">{b.meta}</div>
                        )}
                      </div>
                      <span className="shrink-0 text-[12px] tabular-nums text-[#6b7280]">{b.count}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VariantF() {
  const [base, setBase] = useState<BaseSet>(BASE_SETS[0]);
  const [stage, setStage] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [saleType, setSaleType] = useState<string[]>([]);
  const [ownerStatus, setOwnerStatus] = useState<string[]>(["Living"]);
  const [surplusMin, setSurplusMin] = useState("");
  const [surplusMax, setSurplusMax] = useState("");
  const [lastTouched, setLastTouched] = useState("any");
  const [skipLitigated, setSkipLitigated] = useState(true);
  const [skipDnc, setSkipDnc] = useState(true);
  const [dncAcknowledged, setDncAcknowledged] = useState(false);
  const [name, setName] = useState("");

  const availableStates = base.states ?? STATES;
  const effectiveStates = states.filter((s) => availableStates.includes(s));
  const availableCounties = effectiveStates.length === 0
    ? availableStates.flatMap((s) => (COUNTIES_BY_STATE[s] ?? []).map((c) => `${c}, ${s.slice(0, 2).toUpperCase()}`))
    : effectiveStates.flatMap((s) => (COUNTIES_BY_STATE[s] ?? []).map((c) => `${c}, ${s.slice(0, 2).toUpperCase()}`));

  const narrowCount = stage.length + states.length + counties.length + saleType.length + ownerStatus.length + (surplusMin || surplusMax ? 1 : 0) + (lastTouched !== "any" ? 1 : 0) + (skipLitigated ? 1 : 0);
  const narrowedTotal = narrowCount === 0 ? base.count : Math.max(Math.floor(base.count * 0.6), 4);

  return (
    <div className="mx-auto max-w-[860px] px-6 py-12">
      <div className="mb-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Variant F · Stripe Quiet Power
        </div>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.025em] text-[#0f1729]">
          Build A Calling List
        </h1>
        <div className="mt-1 text-[13.5px] text-[#6b7280]">
          Pick a starting point. Narrow it down. Save it.
        </div>
      </div>

      <BaseSetPicker value={base} onChange={setBase} />

      <div
        className="mt-5 overflow-hidden rounded-[12px] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 8px 24px -8px rgba(15,23,41,0.08)" }}
      >
        <div className="flex items-center justify-between border-b border-[#f1f2f4] bg-[#fbfbfc] px-5 py-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
            Narrow By
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] tabular-nums text-[#9ca3af] line-through">{base.count}</span>
            <IconArrowNarrowRight size={16} stroke={2} className="self-center text-[#9ca3af]" />
            <span className="text-[22px] font-semibold tabular-nums tracking-[-0.01em] text-[#0f1729]">{narrowedTotal}</span>
            <span className="text-[12.5px] font-medium text-[#6b7280]">Leads</span>
          </div>
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#f1f2f4] px-5 py-3.5 last:border-b-0">
          <div className="pt-1.5 text-[12.5px] font-medium text-[#374151]">Stage</div>
          <PopoverMultiSelect options={STAGES} values={stage} onChange={setStage} placeholder="Any Stage" />
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#f1f2f4] px-5 py-3.5">
          <div className="pt-1.5 text-[12.5px] font-medium text-[#374151]">
            State
            {base.states && (
              <div className="mt-0.5 text-[10.5px] text-[#9ca3af]">
                Limited to this list&apos;s {base.states.length === 1 ? "state" : "states"}
              </div>
            )}
          </div>
          <PopoverMultiSelect options={availableStates} values={effectiveStates} onChange={setStates} placeholder={base.states && base.states.length === 1 ? `Any ${base.states[0]} Lead` : "Any State"} />
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#f1f2f4] px-5 py-3.5">
          <div className="pt-1.5 text-[12.5px] font-medium text-[#374151]">
            County
            {states.length > 0 && (
              <div className="mt-0.5 text-[10.5px] text-[#9ca3af]">
                Limited to {states.length === 1 ? states[0] : `${states.length} states`}
              </div>
            )}
          </div>
          <PopoverMultiSelect options={availableCounties} values={counties} onChange={setCounties} placeholder="Any County" />
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#f1f2f4] px-5 py-3.5">
          <div className="pt-1.5 text-[12.5px] font-medium text-[#374151]">Sale Type</div>
          <PopoverMultiSelect options={SALE_TYPES} values={saleType} onChange={setSaleType} placeholder="Any Sale Type" />
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#f1f2f4] px-5 py-3.5">
          <div className="pt-1.5 text-[12.5px] font-medium text-[#374151]">Owner Status</div>
          <PopoverMultiSelect options={OWNER_STATUS} values={ownerStatus} onChange={setOwnerStatus} placeholder="Any Owner Status" />
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#f1f2f4] px-5 py-3.5">
          <div className="pt-1.5 text-[12.5px] font-medium text-[#374151]">Surplus Range</div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] text-[#9ca3af]">$</span>
              <input
                type="text"
                value={surplusMin}
                onChange={(e) => setSurplusMin(formatCurrency(e.target.value))}
                placeholder="No min"
                className="h-9 w-full rounded-[8px] border border-[#e5e7eb] bg-white pl-7 pr-3 text-[13px] tabular-nums text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
              />
            </div>
            <span className="text-[12px] text-[#9ca3af]">to</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] text-[#9ca3af]">$</span>
              <input
                type="text"
                value={surplusMax}
                onChange={(e) => setSurplusMax(formatCurrency(e.target.value))}
                placeholder="No max"
                className="h-9 w-full rounded-[8px] border border-[#e5e7eb] bg-white pl-7 pr-3 text-[13px] tabular-nums text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#f1f2f4] px-5 py-3.5">
          <div className="pt-1.5 text-[12.5px] font-medium text-[#374151]">Last Touched</div>
          <div className="flex h-9 overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white">
            {LAST_TOUCHED.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setLastTouched(o.id)}
                className={[
                  "flex-1 cursor-pointer text-[12px] font-medium transition",
                  i > 0 ? "border-l border-[#e5e7eb]" : "",
                  lastTouched === o.id
                    ? "bg-[#0f1729] text-white"
                    : "bg-white text-[#374151] hover:bg-[#f7f8f9]",
                ].join(" ")}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
          <div className="pt-0.5 text-[12.5px] font-medium text-[#374151]">Compliance</div>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#374151]">
              <input
                type="checkbox"
                checked={skipDnc}
                onChange={(e) => setSkipDnc(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#13644e]"
              />
              Skip DNC Leads
              <span className="text-[11px] text-[#9ca3af]">recommended</span>
            </label>
            {!skipDnc && (
              <div className="rounded-[8px] border border-[#0f1729] bg-[#fbfbfc] px-3 py-2">
                <label className="flex cursor-pointer items-start gap-2 text-[11.5px] leading-relaxed text-[#374151]">
                  <input
                    type="checkbox"
                    checked={dncAcknowledged}
                    onChange={(e) => setDncAcknowledged(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-[#13644e]"
                  />
                  I certify I have a TCPA exception (existing business relationship, prior written consent, or other legal basis) to call leads on the Do Not Call list.
                </label>
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-[#374151]">
              <input
                type="checkbox"
                checked={skipLitigated}
                onChange={(e) => setSkipLitigated(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#13644e]"
              />
              Skip Litigated Leads
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name This List (e.g. Fort Bend Living Owners)"
          className="h-11 flex-1 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[13px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
        />
        <button
          type="button"
          className="h-11 cursor-pointer rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] transition hover:border-[#0f1729]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!name.trim()}
          className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#0a3d4a] to-[#13644e] px-5 text-[13px] font-semibold text-white shadow-[0_2px_4px_rgba(13,75,58,0.20),0_8px_20px_-4px_rgba(13,75,58,0.30)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save &amp; Use
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] tabular-nums">{narrowedTotal}</span>
        </button>
      </div>
    </div>
  );
}
