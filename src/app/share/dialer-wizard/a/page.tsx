"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconCheck,
  IconPlus,
  IconUserCircle,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";

type FilterValue = string | { min?: number; max?: number };
type ActiveFilter = { type: string; value: FilterValue };

type QuickPick = {
  id: string;
  name: string;
  filters: ActiveFilter[];
  count: number;
};

const QUICK_PICKS: QuickPick[] = [
  {
    id: "callback-today",
    name: "Callback Today",
    count: 8,
    filters: [
      { type: "Stage", value: "Callback Scheduled" },
      { type: "Scheduled", value: "Today" },
    ],
  },
  {
    id: "first-contact-due",
    name: "First Contact Due",
    count: 47,
    filters: [
      { type: "Stage", value: "Researched" },
      { type: "Has Phone", value: "Yes" },
      { type: "Last Touched", value: "Never" },
    ],
  },
  {
    id: "no-contact-60",
    name: "No Contact 60+ Days",
    count: 34,
    filters: [
      { type: "Last Touched", value: "60+ Days Ago" },
    ],
  },
  {
    id: "high-surplus",
    name: "High Surplus",
    count: 23,
    filters: [
      { type: "Surplus", value: { min: 50000 } },
    ],
  },
];

const FILTER_TYPE_OPTIONS = [
  "Stage",
  "State",
  "County",
  "Sale Type",
  "Owner Status",
  "Surplus",
  "Last Touched",
  "Has Phone",
  "Litigation",
];

const FILTER_VALUE_OPTIONS: Record<string, string[]> = {
  "Stage": ["Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed", "Callback Scheduled"],
  "State": ["Texas", "North Carolina", "Arizona", "Georgia", "Ohio", "Florida"],
  "County": ["Travis", "Mecklenburg", "Maricopa", "Fulton", "Cuyahoga", "Harris"],
  "Sale Type": ["Tax Sale", "Mortgage Foreclosure"],
  "Owner Status": ["Living", "Deceased", "Any"],
  "Surplus": ["Any", "$20k+", "$50k+", "$100k+"],
  "Last Touched": ["Never", "30+ Days Ago", "60+ Days Ago", "90+ Days Ago", "Any"],
  "Has Phone": ["Yes", "No", "Any"],
  "Litigation": ["Skip Litigated", "Include All"],
  "Scheduled": ["Today", "This Week", "Any"],
};

const CALLER_IDS = [
  { id: "auto", label: "Auto Map By State" },
  { id: "tx", label: "(512) 555 0188 · Austin TX" },
  { id: "nc", label: "(704) 555 0212 · Charlotte NC" },
  { id: "az", label: "(602) 555 0177 · Phoenix AZ" },
];

const VOICEMAILS = [
  { id: "off", label: "Don't Leave A Voicemail" },
  { id: "default", label: "Default Outreach" },
  { id: "heir", label: "Heir Outreach" },
  { id: "living", label: "Living Owner" },
];

const PREVIEW_LEADS_BY_PICK: Record<string, { name: string; county: string; surplus: string; status: string }[]> = {
  "callback-today": [
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
    { name: "Daniel Brooks Estate", county: "Travis, TX", surplus: "$19,420", status: "Deceased" },
  ],
  "first-contact-due": [
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
    { name: "Marcus Hayes Estate", county: "Mecklenburg, NC", surplus: "$31,640", status: "Deceased" },
    { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  ],
  "no-contact-60": [
    { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
    { name: "Thomas Whitfield", county: "Mecklenburg, NC", surplus: "$38,900", status: "Living" },
    { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  ],
  "high-surplus": [
    { name: "Elena Rodriguez", county: "Maricopa, AZ", surplus: "$62,150", status: "Living" },
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
  ],
  "custom": [
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Elena Rodriguez", county: "Maricopa, AZ", surplus: "$62,150", status: "Living" },
  ],
};

function filtersEqual(a: ActiveFilter[], b: ActiveFilter[]): boolean {
  if (a.length !== b.length) return false;
  const aSorted = [...a].sort((x, y) => x.type.localeCompare(y.type));
  const bSorted = [...b].sort((x, y) => x.type.localeCompare(y.type));
  return aSorted.every((f, i) => f.type === bSorted[i].type && JSON.stringify(f.value) === JSON.stringify(bSorted[i].value));
}

function formatFilterValue(v: FilterValue): string {
  if (typeof v === "string") return v;
  if (v.min && v.max) return `$${v.min.toLocaleString()} to $${v.max.toLocaleString()}`;
  if (v.min) return `$${v.min.toLocaleString()}+`;
  if (v.max) return `Up to $${v.max.toLocaleString()}`;
  return "Any";
}

export default function VariantA() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(QUICK_PICKS[1].filters);
  const [editingFilterIdx, setEditingFilterIdx] = useState<number | null>(null);
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingDefaults, setEditingDefaults] = useState(false);
  const [callerId, setCallerId] = useState(CALLER_IDS[0].id);
  const [voicemail, setVoicemail] = useState(VOICEMAILS[0].id);
  const [voicemailInfoOpen, setVoicemailInfoOpen] = useState(false);
  const [skipWrap, setSkipWrap] = useState(false);
  const [wrapUp, setWrapUp] = useState(30);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const addFilterRef = useRef<HTMLDivElement>(null);
  const filterEditRef = useRef<HTMLDivElement>(null);
  const voicemailInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (addFilterRef.current && !addFilterRef.current.contains(t)) {
        setAddFilterOpen(false);
      }
      if (filterEditRef.current && !filterEditRef.current.contains(t)) {
        setEditingFilterIdx(null);
      }
      if (voicemailInfoRef.current && !voicemailInfoRef.current.contains(t)) {
        setVoicemailInfoOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matchingPick = useMemo(
    () => QUICK_PICKS.find((p) => filtersEqual(p.filters, activeFilters)) ?? null,
    [activeFilters],
  );

  const leadCount = matchingPick?.count ?? 124;
  const previewKey = matchingPick?.id ?? "custom";
  const previewLeads = PREVIEW_LEADS_BY_PICK[previewKey] ?? [];

  const callerIdLabel = CALLER_IDS.find((c) => c.id === callerId)?.label ?? "";
  const voicemailLabel = VOICEMAILS.find((v) => v.id === voicemail)?.label ?? "";
  const voicemailDisplay = voicemail === "off" ? "Off" : voicemailLabel;
  const wrapUpLabel = skipWrap
    ? "Off"
    : wrapUp < 60
      ? `${wrapUp} Seconds`
      : `${Math.floor(wrapUp / 60)}m ${(wrapUp % 60).toString().padStart(2, "0")}s`;

  function setQuickPick(p: QuickPick) {
    setActiveFilters(p.filters);
  }

  function removeFilter(idx: number) {
    setActiveFilters((f) => f.filter((_, i) => i !== idx));
    setEditingFilterIdx(null);
  }

  function updateFilterValue(idx: number, val: string) {
    setActiveFilters((f) => f.map((x, i) => (i === idx ? { ...x, value: val } : x)));
    setEditingFilterIdx(null);
  }

  function addFilter(type: string) {
    const options = FILTER_VALUE_OPTIONS[type];
    const defaultVal = options?.[0] ?? "Any";
    setActiveFilters((f) => [...f, { type, value: defaultVal }]);
    setAddFilterOpen(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-49px)] items-start justify-center px-6 py-10">
      <div className="w-full max-w-[620px]">
        <div className="mb-6 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Variant A · Just Pick A List · Interactive v2
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-[#0f1729]">
            Start A Dialer Session
          </h1>
          <div className="mt-1.5 text-[13px] text-[#6b7280]">
            Pick a quick list or build a filter. Everything stays on this card.
          </div>
        </div>

        <div
          className="rounded-[14px] bg-white p-7"
          style={{
            boxShadow:
              "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.12)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-[#0f1729]">
              Calling List
            </h2>
            <button
              type="button"
              onClick={() => setPreviewOpen((o) => !o)}
              className="cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
            >
              {previewOpen ? "Hide Preview" : "Preview"}
            </button>
          </div>

          <div className="mt-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9ca3af]">
              Quick Picks
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_PICKS.map((p) => {
                const active = matchingPick?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setQuickPick(p)}
                    className={[
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                      active
                        ? "border-[#0f1729] bg-[#0f1729] text-white"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0f1729]",
                    ].join(" ")}
                  >
                    {p.name}
                    <span
                      className={[
                        "rounded px-1.5 py-0.5 text-[11px] tabular-nums",
                        active ? "bg-white/15 text-white" : "bg-[#f1f2f4] text-[#6b7280]",
                      ].join(" ")}
                    >
                      {p.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9ca3af]">
              Filters
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {activeFilters.map((f, i) => (
                <div key={`${f.type}-${i}`} className="relative">
                  <button
                    type="button"
                    onClick={() => setEditingFilterIdx(editingFilterIdx === i ? null : i)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white py-1.5 pl-3 pr-2 text-[12px] text-[#374151] transition hover:border-[#0f1729]"
                  >
                    <span className="font-medium text-[#9ca3af]">{f.type}:</span>
                    <span className="font-semibold text-[#0f1729]">{formatFilterValue(f.value)}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter(i);
                      }}
                      className="ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f1f2f4] hover:text-[#0f1729]"
                    >
                      <IconX size={11} stroke={2.25} />
                    </span>
                  </button>

                  {editingFilterIdx === i && (
                    <div
                      ref={filterEditRef}
                      className="absolute left-0 top-full z-30 mt-1 w-[200px] overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white"
                      style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18)" }}
                    >
                      <div className="border-b border-[#f1f2f4] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                        {f.type}
                      </div>
                      <div className="max-h-[200px] overflow-y-auto py-1">
                        {(FILTER_VALUE_OPTIONS[f.type] ?? []).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateFilterValue(i, opt)}
                            className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[12px] text-[#374151] transition hover:bg-[#f7f8f9]"
                          >
                            {opt}
                            {formatFilterValue(f.value) === opt && <IconCheck size={12} stroke={2.5} className="text-[#13644e]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div ref={addFilterRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAddFilterOpen((o) => !o)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-[#9ca3af] px-2.5 py-1.5 text-[12px] font-medium text-[#6b7280] transition hover:border-[#0f1729] hover:text-[#0f1729]"
                >
                  <IconPlus size={12} stroke={2.5} />
                  Add Filter
                </button>

                {addFilterOpen && (
                  <div
                    className="absolute left-0 top-full z-30 mt-1 w-[180px] overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white"
                    style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18)" }}
                  >
                    <div className="border-b border-[#f1f2f4] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                      Add A Filter
                    </div>
                    <div className="max-h-[240px] overflow-y-auto py-1">
                      {FILTER_TYPE_OPTIONS.filter((t) => !activeFilters.find((f) => f.type === t)).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => addFilter(t)}
                          className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12px] text-[#374151] transition hover:bg-[#f7f8f9]"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-[13px] text-[#6b7280]">
                <span className="font-semibold tabular-nums text-[#0f1729]">{leadCount}</span> Leads Match
              </div>
              {!matchingPick && activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSaveDialogOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
                >
                  <IconPlus size={12} stroke={2.5} />
                  Save As A New Calling List
                </button>
              )}
            </div>

            {saveDialogOpen && (
              <div className="mt-3 rounded-[8px] border border-[#e5e7eb] bg-[#f7f8f9] p-3">
                <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b7280]">
                  Name This Calling List
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. Texas Tax Sales, High Surplus"
                    className="h-9 flex-1 rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Would save "${newListName}" as a Quick Pick with the current filter combo.`);
                      setSaveDialogOpen(false);
                      setNewListName("");
                    }}
                    disabled={!newListName.trim()}
                    className="h-9 cursor-pointer rounded-md bg-[#0f1729] px-4 text-[12px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveDialogOpen(false);
                      setNewListName("");
                    }}
                    className="h-9 cursor-pointer rounded-md border border-[#e5e7eb] bg-white px-3 text-[12px] font-medium text-[#374151] transition hover:border-[#0f1729]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {previewOpen && (
            <div className="mt-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
              <div className="flex items-center justify-between border-b border-[#f1f2f4] px-4 py-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                  First In Queue
                </span>
                <span className="text-[11px] text-[#6b7280]">
                  Plus {Math.max(leadCount - previewLeads.length, 0)} More
                </span>
              </div>
              <div className="divide-y divide-[#f1f2f4]">
                {previewLeads.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f7f8f9] text-[#9ca3af]">
                      <IconUserCircle size={18} stroke={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold tabular-nums text-[#9ca3af]">
                          {i + 1}.
                        </span>
                        <span className="truncate text-[12.5px] font-semibold text-[#0f1729]">
                          {l.name}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#6b7280]">
                        {l.county} · {l.status}
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold tabular-nums text-[#0f1729]">
                      {l.surplus}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 border-t border-[#f1f2f4] pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold tracking-[-0.005em] text-[#0f1729]">
                Defaults
              </h2>
              <button
                type="button"
                onClick={() => setEditingDefaults((e) => !e)}
                className="cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
              >
                {editingDefaults ? "Use Defaults" : "Change For This Session"}
              </button>
            </div>

            {!editingDefaults ? (
              <div className="mt-3 divide-y divide-[#f1f2f4]">
                <ReadRow label="Caller ID" value={callerIdLabel} />
                <ReadRow
                  label={
                    <span className="inline-flex items-center gap-1">
                      Voicemail
                      <span ref={voicemailInfoRef} className="relative inline-flex">
                        <button
                          type="button"
                          onClick={() => setVoicemailInfoOpen((o) => !o)}
                          className="inline-flex h-4 w-4 cursor-pointer items-center justify-center text-[#9ca3af] hover:text-[#0f1729]"
                        >
                          <IconInfoCircle size={13} stroke={2} />
                        </button>
                        {voicemailInfoOpen && (
                          <span
                            className="absolute left-1/2 top-full z-30 mt-1.5 w-[240px] -translate-x-1/2 rounded-[8px] border border-[#e5e7eb] bg-white p-3 text-[11.5px] leading-relaxed text-[#374151]"
                            style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18)" }}
                          >
                            When the call reaches voicemail, your recording plays automatically and the dialer hangs up. Pick a recording or leave this off.
                          </span>
                        )}
                      </span>
                    </span>
                  }
                  value={voicemailDisplay}
                />
                <ReadRow label="Wrap Up" value={wrapUpLabel} />
                <ReadRow label="Email Followup" value="4 Templates Set" />
              </div>
            ) : (
              <div className="mt-3 divide-y divide-[#f1f2f4]">
                <EditRow label="Caller ID">
                  <select
                    value={callerId}
                    onChange={(e) => setCallerId(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e]"
                  >
                    {CALLER_IDS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </EditRow>
                <EditRow
                  label={
                    <span className="inline-flex items-center gap-1">
                      Voicemail
                      <span ref={voicemailInfoRef} className="relative inline-flex">
                        <button
                          type="button"
                          onClick={() => setVoicemailInfoOpen((o) => !o)}
                          className="inline-flex h-4 w-4 cursor-pointer items-center justify-center text-[#9ca3af] hover:text-[#0f1729]"
                        >
                          <IconInfoCircle size={13} stroke={2} />
                        </button>
                        {voicemailInfoOpen && (
                          <span
                            className="absolute left-1/2 top-full z-30 mt-1.5 w-[240px] -translate-x-1/2 rounded-[8px] border border-[#e5e7eb] bg-white p-3 text-[11.5px] leading-relaxed text-[#374151]"
                            style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18)" }}
                          >
                            When the call reaches voicemail, your recording plays automatically and the dialer hangs up. Pick a recording or leave this off.
                          </span>
                        )}
                      </span>
                    </span>
                  }
                >
                  <select
                    value={voicemail}
                    onChange={(e) => setVoicemail(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e]"
                  >
                    {VOICEMAILS.map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </EditRow>
                <EditRow label="Wrap Up">
                  <div className="w-full">
                    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#374151]">
                      <input
                        type="checkbox"
                        checked={skipWrap}
                        onChange={(e) => setSkipWrap(e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-[#13644e]"
                      />
                      Skip Wrap Up Entirely
                    </label>
                    {!skipWrap && (
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="range"
                          min={10}
                          max={300}
                          step={5}
                          value={wrapUp}
                          onChange={(e) => setWrapUp(Number(e.target.value))}
                          className="h-2 flex-1 cursor-pointer accent-[#13644e]"
                        />
                        <span className="w-[72px] text-right text-[12px] font-semibold tabular-nums text-[#0f1729]">
                          {wrapUpLabel}
                        </span>
                      </div>
                    )}
                    <div className="mt-1.5 text-[11px] leading-relaxed text-[#9ca3af]">
                      Only runs after a Spoke call. Every other outcome (Voicemail, No Answer, Wrong Number) advances right away. Hit Pause Session in the dialer header if you need more time.
                    </div>
                  </div>
                </EditRow>
                <EditRow label="Email Followup">
                  <button
                    type="button"
                    onClick={() => setTemplatesOpen(true)}
                    className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-3 text-left text-[12.5px] font-medium text-[#0f1729] transition hover:border-[#0f1729]"
                  >
                    4 Templates Set
                    <IconChevronDown size={12} stroke={2} className="text-[#9ca3af]" />
                  </button>
                </EditRow>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-7 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#0a3d4a] to-[#13644e] text-[14px] font-semibold tracking-[-0.005em] text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_8px_20px_-4px_rgba(13,75,58,0.30)] transition hover:opacity-95"
          >
            Start Session
            <IconArrowRight size={15} stroke={2.25} />
          </button>

          {started && (
            <div className="mt-4 rounded-[10px] border border-[#0f1729] bg-[#0f1729] px-4 py-3 text-[12.5px] text-white">
              <div className="font-semibold">Session Would Start Now</div>
              <div className="mt-1 text-[11.5px] text-[#9ca3af]">
                {leadCount} Leads · {matchingPick?.name ?? "Custom Filter"} · Caller ID: {callerIdLabel} · Voicemail: {voicemailDisplay} · Wrap Up: {wrapUpLabel}
              </div>
              <button
                type="button"
                onClick={() => setStarted(false)}
                className="mt-2 cursor-pointer text-[11px] font-medium text-[#9ca3af] hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-[11.5px] text-[#9ca3af]">
          Time zone gate active. Will not dial before 8am or after 9pm local to each lead.
        </div>
      </div>

      {templatesOpen && (
        <TemplatesPanel onClose={() => setTemplatesOpen(false)} />
      )}
    </div>
  );
}

function ReadRow({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <div className="text-[12.5px] text-[#6b7280]">{label}</div>
      <div className="text-[12.5px] font-medium text-[#0f1729]">{value}</div>
    </div>
  );
}

function EditRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className="pt-1.5 text-[12.5px] text-[#6b7280]">{label}</div>
      {children}
    </div>
  );
}

const OUTCOMES = [
  { name: "Called", default: "Spoke Call Recap" },
  { name: "Voicemail", default: "Voicemail Followup" },
  { name: "No Answer", default: "Do Not Send" },
  { name: "Wrong Number", default: "Do Not Send" },
];

const TEMPLATES = [
  "Spoke Call Recap",
  "Voicemail Followup",
  "Heir Outreach Recap",
  "Living Owner Recap",
  "Do Not Send",
];

function TemplatesPanel({ onClose }: { onClose: () => void }) {
  const [picks, setPicks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    OUTCOMES.forEach((o) => (init[o.name] = o.default));
    return init;
  });

  return (
    <div className="fixed inset-0 z-40">
      <div
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-[#0f1729]/30"
      />
      <div className="absolute right-0 top-0 flex h-full w-[420px] flex-col bg-white" style={{ boxShadow: "-12px 0 32px -8px rgba(15,23,41,0.18)" }}>
        <div className="flex items-center justify-between border-b border-[#f1f2f4] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold tracking-[-0.005em] text-[#0f1729]">
              Email Followup Templates
            </h3>
            <div className="mt-0.5 text-[12px] text-[#6b7280]">
              Pick the template that auto-sends after each call outcome.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f1f2f4] hover:text-[#0f1729]"
          >
            <IconX size={16} stroke={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="divide-y divide-[#f1f2f4]">
            {OUTCOMES.map((o) => (
              <div key={o.name} className="py-3 first:pt-0">
                <div className="text-[12.5px] font-semibold text-[#0f1729]">
                  {o.name}
                </div>
                <select
                  value={picks[o.name]}
                  onChange={(e) => setPicks((p) => ({ ...p, [o.name]: e.target.value }))}
                  className="mt-1.5 h-9 w-full cursor-pointer rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e]"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#f1f2f4] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-[120px] cursor-pointer rounded-md border border-[#e5e7eb] bg-white text-[12.5px] font-medium text-[#374151] transition hover:border-[#0f1729]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-[120px] cursor-pointer rounded-md bg-[#0f1729] text-[12.5px] font-semibold text-white transition hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
