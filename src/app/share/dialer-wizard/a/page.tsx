"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconCheck,
  IconPlus,
  IconSearch,
  IconUserCircle,
  IconInfoCircle,
  IconX,
  IconArrowLeft,
} from "@tabler/icons-react";

type SavedList = {
  id: string;
  name: string;
  count: number;
  source: "import" | "system" | "saved";
  importedOn?: string;
};

const INITIAL_LISTS: SavedList[] = [
  { id: "tax-sales-travis", name: "Tax Sales · Travis TX", count: 47, source: "import", importedOn: "Jun 21" },
  { id: "callback-today", name: "Callback Today", count: 8, source: "system" },
  { id: "mortgage-fc-nc", name: "Mortgage Foreclosures · NC", count: 23, source: "import", importedOn: "Jun 19" },
  { id: "first-contact", name: "First Contact Due", count: 47, source: "system" },
  { id: "heir-research", name: "Heir Research Batch", count: 12, source: "import", importedOn: "Jun 17" },
  { id: "high-surplus", name: "High Surplus", count: 23, source: "saved" },
  { id: "no-contact-60", name: "No Contact 60+ Days", count: 34, source: "system" },
];

const PREVIEW_BY_LIST: Record<string, { name: string; county: string; surplus: string; status: string }[]> = {
  "tax-sales-travis": [
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
    { name: "Daniel Brooks Estate", county: "Travis, TX", surplus: "$19,420", status: "Deceased" },
    { name: "Michael Ortiz", county: "Travis, TX", surplus: "$33,100", status: "Living" },
  ],
  "callback-today": [
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
    { name: "Daniel Brooks Estate", county: "Travis, TX", surplus: "$19,420", status: "Deceased" },
  ],
  "mortgage-fc-nc": [
    { name: "Marcus Hayes Estate", county: "Mecklenburg, NC", surplus: "$31,640", status: "Deceased" },
    { name: "Thomas Whitfield", county: "Mecklenburg, NC", surplus: "$38,900", status: "Living" },
    { name: "Karen Booth", county: "Wake, NC", surplus: "$26,140", status: "Living" },
  ],
  "first-contact": [
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
    { name: "Marcus Hayes Estate", county: "Mecklenburg, NC", surplus: "$31,640", status: "Deceased" },
    { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  ],
  "heir-research": [
    { name: "Marcus Hayes Estate", county: "Mecklenburg, NC", surplus: "$31,640", status: "Deceased" },
    { name: "Daniel Brooks Estate", county: "Travis, TX", surplus: "$19,420", status: "Deceased" },
    { name: "Robert Pruitt Estate", county: "Maricopa, AZ", surplus: "$41,200", status: "Deceased" },
  ],
  "high-surplus": [
    { name: "Elena Rodriguez", county: "Maricopa, AZ", surplus: "$62,150", status: "Living" },
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
  ],
  "no-contact-60": [
    { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
    { name: "Thomas Whitfield", county: "Mecklenburg, NC", surplus: "$38,900", status: "Living" },
    { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  ],
};

type FilterChip = { type: string; value: string };

const FILTER_TYPES = [
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

const FILTER_VALUES: Record<string, string[]> = {
  "Stage": ["Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed", "Callback Scheduled"],
  "State": ["Texas", "North Carolina", "Arizona", "Georgia", "Ohio", "Florida"],
  "County": ["Travis", "Mecklenburg", "Maricopa", "Fulton", "Cuyahoga", "Harris"],
  "Sale Type": ["Tax Sale", "Mortgage Foreclosure"],
  "Owner Status": ["Living", "Deceased", "Any"],
  "Surplus": ["Any", "$20k+", "$50k+", "$100k+"],
  "Last Touched": ["Never", "30+ Days Ago", "60+ Days Ago", "90+ Days Ago", "Any"],
  "Has Phone": ["Yes", "No", "Any"],
  "Litigation": ["Skip Litigated", "Include All"],
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

type Mode = "saved" | "building";

export default function VariantA() {
  const [lists, setLists] = useState<SavedList[]>(INITIAL_LISTS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_LISTS[0].id);
  const [mode, setMode] = useState<Mode>("saved");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [buildFilters, setBuildFilters] = useState<FilterChip[]>([]);
  const [editingFilterIdx, setEditingFilterIdx] = useState<number | null>(null);
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [saveNameOpen, setSaveNameOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const [editingDefaults, setEditingDefaults] = useState(false);
  const [callerId, setCallerId] = useState(CALLER_IDS[0].id);
  const [voicemail, setVoicemail] = useState(VOICEMAILS[0].id);
  const [voicemailInfoOpen, setVoicemailInfoOpen] = useState(false);
  const [skipWrap, setSkipWrap] = useState(false);
  const [wrapUp, setWrapUp] = useState(30);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [started, setStarted] = useState(false);

  const pickerRef = useRef<HTMLDivElement>(null);
  const addFilterRef = useRef<HTMLDivElement>(null);
  const filterEditRef = useRef<HTMLDivElement>(null);
  const voicemailInfoRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (pickerRef.current && !pickerRef.current.contains(t)) setPickerOpen(false);
      if (addFilterRef.current && !addFilterRef.current.contains(t)) setAddFilterOpen(false);
      if (filterEditRef.current && !filterEditRef.current.contains(t)) setEditingFilterIdx(null);
      if (voicemailInfoRef.current && !voicemailInfoRef.current.contains(t)) setVoicemailInfoOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selected = lists.find((l) => l.id === selectedId) ?? lists[0];
  const filtered = lists.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  const buildCount = buildFilters.length > 0 ? 38 : 124;
  const buildPreview = PREVIEW_BY_LIST["first-contact"];

  const displayCount = mode === "saved" ? selected.count : buildCount;
  const previewLeads = mode === "saved" ? (PREVIEW_BY_LIST[selected.id] ?? []) : buildPreview;
  const listLabelForStart = mode === "saved" ? selected.name : (buildFilters.length > 0 ? "Custom Filter" : "Any Lead");

  const callerIdLabel = CALLER_IDS.find((c) => c.id === callerId)?.label ?? "";
  const voicemailLabel = VOICEMAILS.find((v) => v.id === voicemail)?.label ?? "";
  const voicemailDisplay = voicemail === "off" ? "Off" : voicemailLabel;
  const wrapUpLabel = skipWrap
    ? "Off"
    : wrapUp < 60
      ? `${wrapUp} Seconds`
      : `${Math.floor(wrapUp / 60)}m ${(wrapUp % 60).toString().padStart(2, "0")}s`;

  function pickList(id: string) {
    setSelectedId(id);
    setPickerOpen(false);
    setSearch("");
  }

  function enterBuildMode() {
    setMode("building");
    setBuildFilters([]);
    setPickerOpen(false);
    setSearch("");
  }

  function cancelBuild() {
    setMode("saved");
    setBuildFilters([]);
    setSaveNameOpen(false);
    setNewListName("");
  }

  function saveBuiltList() {
    const id = `user-${Date.now()}`;
    const newList: SavedList = {
      id,
      name: newListName.trim(),
      count: buildCount,
      source: "saved",
    };
    setLists((prev) => [newList, ...prev]);
    setSelectedId(id);
    setMode("saved");
    setBuildFilters([]);
    setSaveNameOpen(false);
    setNewListName("");
  }

  function removeBuildFilter(idx: number) {
    setBuildFilters((f) => f.filter((_, i) => i !== idx));
    setEditingFilterIdx(null);
  }

  function updateBuildFilter(idx: number, value: string) {
    setBuildFilters((f) => f.map((x, i) => (i === idx ? { ...x, value } : x)));
    setEditingFilterIdx(null);
  }

  function addBuildFilter(type: string) {
    const defaultVal = FILTER_VALUES[type]?.[0] ?? "Any";
    setBuildFilters((f) => [...f, { type, value: defaultVal }]);
    setAddFilterOpen(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-49px)] items-start justify-center px-6 py-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Variant A · Just Pick A List · Interactive v3
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-[#0f1729]">
            Start A Dialer Session
          </h1>
          <div className="mt-1.5 text-[13px] text-[#6b7280]">
            One picker. Recent imports, system lists, and saved combos all live in the same dropdown.
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
            <h2 className="text-[13.5px] font-semibold tracking-[-0.005em] text-[#0f1729]">
              Calling List
            </h2>
            {mode === "saved" && (
              <button
                type="button"
                onClick={() => setPreviewOpen((o) => !o)}
                className="cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
              >
                {previewOpen ? "Hide Preview" : "Preview"}
              </button>
            )}
            {mode === "building" && (
              <button
                type="button"
                onClick={cancelBuild}
                className="flex cursor-pointer items-center gap-1 text-[12px] font-medium text-[#6b7280] hover:text-[#0f1729]"
              >
                <IconArrowLeft size={12} stroke={2.25} />
                Back To Saved Lists
              </button>
            )}
          </div>

          {mode === "saved" && (
            <div className="relative mt-2" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setPickerOpen((o) => !o)}
                className="flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white px-5 py-4 text-left transition hover:border-[#0f1729]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-semibold tracking-[-0.005em] text-[#0f1729]">
                    {selected.name}
                  </div>
                  {selected.importedOn && (
                    <div className="mt-0.5 text-[12px] text-[#6b7280]">
                      Imported {selected.importedOn}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-[#13644e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
                    {selected.count} Leads
                  </span>
                  {pickerOpen ? (
                    <IconChevronUp size={16} stroke={2} className="text-[#9ca3af]" />
                  ) : (
                    <IconChevronDown size={16} stroke={2} className="text-[#9ca3af]" />
                  )}
                </div>
              </button>

              {pickerOpen && (
                <div
                  className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white"
                  style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18), 0 2px 6px rgba(15,23,41,0.08)" }}
                >
                  <div className="flex items-center gap-2 border-b border-[#f1f2f4] px-3 py-2.5">
                    <IconSearch size={14} stroke={2} className="text-[#9ca3af]" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search Lists"
                      className="w-full bg-transparent text-[13px] text-[#0f1729] outline-none placeholder:text-[#9ca3af]"
                    />
                  </div>

                  <div className="max-h-[320px] overflow-y-auto py-1">
                    {filtered.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => pickList(l.id)}
                        className={[
                          "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition",
                          l.id === selected.id ? "bg-[#f7f8f9]" : "hover:bg-[#f7f8f9]",
                        ].join(" ")}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {l.id === selected.id ? (
                            <IconCheck size={13} stroke={2.5} className="shrink-0 text-[#13644e]" />
                          ) : (
                            <span className="w-[13px]" />
                          )}
                          <span
                            className={[
                              "truncate text-[13px]",
                              l.id === selected.id ? "font-semibold text-[#0f1729]" : "font-medium text-[#374151]",
                            ].join(" ")}
                          >
                            {l.name}
                          </span>
                          {l.importedOn && (
                            <span className="text-[11px] text-[#9ca3af]">· {l.importedOn}</span>
                          )}
                        </div>
                        <span className="shrink-0 text-[11.5px] tabular-nums text-[#6b7280]">
                          {l.count}
                        </span>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <div className="px-4 py-6 text-center text-[12px] text-[#9ca3af]">
                        No lists match &quot;{search}&quot;
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={enterBuildMode}
                    className="flex w-full cursor-pointer items-center gap-2 border-t border-[#f1f2f4] px-4 py-3 text-left text-[12.5px] font-medium text-[#13644e] hover:bg-[#f7f8f9]"
                  >
                    <IconPlus size={13} stroke={2.25} />
                    Build A New List
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "building" && (
            <div className="mt-2 rounded-[10px] border border-[#e5e7eb] bg-white p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9ca3af]">
                Filters
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {buildFilters.map((f, i) => (
                  <div key={`${f.type}-${i}`} className="relative">
                    <button
                      type="button"
                      onClick={() => setEditingFilterIdx(editingFilterIdx === i ? null : i)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white py-1.5 pl-3 pr-2 text-[12px] text-[#374151] transition hover:border-[#0f1729]"
                    >
                      <span className="font-medium text-[#9ca3af]">{f.type}:</span>
                      <span className="font-semibold text-[#0f1729]">{f.value}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBuildFilter(i);
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
                          {(FILTER_VALUES[f.type] ?? []).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => updateBuildFilter(i, opt)}
                              className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[12px] text-[#374151] transition hover:bg-[#f7f8f9]"
                            >
                              {opt}
                              {f.value === opt && <IconCheck size={12} stroke={2.5} className="text-[#13644e]" />}
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
                        {FILTER_TYPES.filter((t) => !buildFilters.find((f) => f.type === t)).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => addBuildFilter(t)}
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

              <div className="mt-4 flex items-center justify-between border-t border-[#f1f2f4] pt-3">
                <div className="text-[12.5px] text-[#6b7280]">
                  <span className="font-semibold tabular-nums text-[#0f1729]">{buildCount}</span> Leads Match
                </div>
                {buildFilters.length > 0 && !saveNameOpen && (
                  <button
                    type="button"
                    onClick={() => setSaveNameOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
                  >
                    <IconPlus size={12} stroke={2.5} />
                    Save As A New List
                  </button>
                )}
              </div>

              {saveNameOpen && (
                <div className="mt-3 rounded-[8px] border border-[#e5e7eb] bg-[#f7f8f9] p-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b7280]">
                    Name This List
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
                      onClick={saveBuiltList}
                      disabled={!newListName.trim()}
                      className="h-9 w-[80px] cursor-pointer rounded-md bg-[#0f1729] text-[12px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSaveNameOpen(false);
                        setNewListName("");
                      }}
                      className="h-9 w-[80px] cursor-pointer rounded-md border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] transition hover:border-[#0f1729]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {previewOpen && mode === "saved" && (
            <div className="mt-3 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
              <div className="flex items-center justify-between border-b border-[#f1f2f4] px-4 py-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                  First In Queue
                </span>
                <span className="text-[11px] text-[#6b7280]">
                  Plus {Math.max(displayCount - previewLeads.length, 0)} More
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
              <h2 className="text-[13.5px] font-semibold tracking-[-0.005em] text-[#0f1729]">
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
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
                <ReadCell label="Caller ID" value={callerIdLabel} />
                <ReadCell
                  label={
                    <span className="inline-flex items-center gap-1">
                      Voicemail
                      <span ref={voicemailInfoRef} className="relative inline-flex">
                        <button
                          type="button"
                          onClick={() => setVoicemailInfoOpen((o) => !o)}
                          className="inline-flex h-4 w-4 cursor-pointer items-center justify-center text-[#9ca3af] hover:text-[#0f1729]"
                        >
                          <IconInfoCircle size={12} stroke={2} />
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
                <ReadCell label="Wrap Up" value={wrapUpLabel} />
                <ReadCell label="Email Followup" value="4 Templates Set" />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
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
                          <IconInfoCircle size={12} stroke={2} />
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
                {displayCount} Leads · {listLabelForStart} · Caller ID: {callerIdLabel} · Voicemail: {voicemailDisplay} · Wrap Up: {wrapUpLabel}
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

function ReadCell({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div>
      <div className="text-[11.5px] font-medium text-[#6b7280]">{label}</div>
      <div className="mt-1 text-[13px] font-medium text-[#0f1729]">{value}</div>
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
    <div className="grid grid-cols-[140px_1fr] items-start gap-3">
      <div className="pt-2 text-[12.5px] font-medium text-[#6b7280]">{label}</div>
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
      <div
        className="absolute right-0 top-0 flex h-full w-[420px] flex-col bg-white"
        style={{ boxShadow: "-12px 0 32px -8px rgba(15,23,41,0.18)" }}
      >
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
