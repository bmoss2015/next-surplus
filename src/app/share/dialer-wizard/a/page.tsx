"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconPhone,
  IconMicrophone,
  IconClock,
  IconMail,
  IconArrowRight,
  IconCheck,
  IconSearch,
  IconPlus,
  IconUserCircle,
  IconExternalLink,
} from "@tabler/icons-react";

type SavedView = {
  id: string;
  name: string;
  count: number;
  group: "pinned" | "all";
};

const SAVED_VIEWS: SavedView[] = [
  { id: "first-contact-due", name: "First Contact Due", count: 47, group: "pinned" },
  { id: "callback-today", name: "Callback Today", count: 8, group: "pinned" },
  { id: "awaiting-signature", name: "Awaiting Signature", count: 12, group: "pinned" },
  { id: "all-researched", name: "All Researched Leads", count: 124, group: "all" },
  { id: "high-surplus", name: "High Surplus > $50k", count: 23, group: "all" },
  { id: "tax-sale-tx", name: "Tax Sale, Texas Only", count: 18, group: "all" },
  { id: "no-contact-60", name: "No Contact, 60+ Days", count: 34, group: "all" },
];

const PREVIEW_LEADS_BY_VIEW: Record<string, { name: string; county: string; surplus: string; status: string }[]> = {
  "first-contact-due": [
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
    { name: "Marcus Hayes Estate", county: "Mecklenburg, NC", surplus: "$31,640", status: "Deceased" },
    { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  ],
  "callback-today": [
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
    { name: "Daniel Brooks Estate", county: "Travis, TX", surplus: "$19,420", status: "Deceased" },
  ],
  "awaiting-signature": [
    { name: "Elena Rodriguez", county: "Maricopa, AZ", surplus: "$62,150", status: "Living" },
    { name: "Thomas Whitfield", county: "Mecklenburg, NC", surplus: "$38,900", status: "Living" },
    { name: "Joseph Cline", county: "Fulton, GA", surplus: "$28,475", status: "Living" },
  ],
  "all-researched": [
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Elena Rodriguez", county: "Maricopa, AZ", surplus: "$62,150", status: "Living" },
  ],
  "high-surplus": [
    { name: "Elena Rodriguez", county: "Maricopa, AZ", surplus: "$62,150", status: "Living" },
    { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
  ],
  "tax-sale-tx": [
    { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
    { name: "Daniel Brooks Estate", county: "Travis, TX", surplus: "$19,420", status: "Deceased" },
    { name: "Michael Ortiz", county: "Harris, TX", surplus: "$33,100", status: "Living" },
  ],
  "no-contact-60": [
    { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
    { name: "Thomas Whitfield", county: "Mecklenburg, NC", surplus: "$38,900", status: "Living" },
    { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  ],
};

const CALLER_IDS = [
  { id: "auto", label: "Auto Map By State" },
  { id: "tx", label: "(512) 555 0188 · Austin TX" },
  { id: "nc", label: "(704) 555 0212 · Charlotte NC" },
  { id: "az", label: "(602) 555 0177 · Phoenix AZ" },
];

const VOICEMAILS = [
  { id: "default", label: "Default Outreach" },
  { id: "heir", label: "Heir Outreach" },
  { id: "living", label: "Living Owner" },
  { id: "off", label: "Don't Drop A Voicemail" },
];

export default function VariantA() {
  const [view, setView] = useState<SavedView>(SAVED_VIEWS[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingDefaults, setEditingDefaults] = useState(false);
  const [search, setSearch] = useState("");
  const [callerId, setCallerId] = useState(CALLER_IDS[0].id);
  const [voicemail, setVoicemail] = useState(VOICEMAILS[0].id);
  const [wrapUp, setWrapUp] = useState(30);
  const [started, setStarted] = useState<null | string>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const filtered = SAVED_VIEWS.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()),
  );
  const pinned = filtered.filter((v) => v.group === "pinned");
  const others = filtered.filter((v) => v.group === "all");

  const previewLeads = PREVIEW_LEADS_BY_VIEW[view.id] ?? [];
  const callerIdLabel = CALLER_IDS.find((c) => c.id === callerId)?.label ?? "";
  const voicemailLabel = VOICEMAILS.find((v) => v.id === voicemail)?.label ?? "";
  const wrapUpLabel =
    wrapUp < 60
      ? `${wrapUp} Seconds`
      : `${Math.floor(wrapUp / 60)}m ${(wrapUp % 60).toString().padStart(2, "0")}s`;

  return (
    <div className="flex min-h-[calc(100vh-49px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Variant A &middot; Just Pick A List &middot; Interactive
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-[#0f1729]">
            Start A Dialer Session
          </h1>
          <div className="mt-1.5 text-[13px] text-[#6b7280]">
            Every control on this card is clickable. Try the picker, Preview link, and Change For This Session.
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
            <label className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
              Calling List
            </label>
            <button
              type="button"
              onClick={() => setPreviewOpen((o) => !o)}
              className="cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
            >
              {previewOpen ? "Hide Preview" : "Preview"}
            </button>
          </div>

          <div className="relative mt-2" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white px-5 py-4 text-left transition hover:border-[#0f1729]"
            >
              <div className="min-w-0">
                <div className="text-[16px] font-semibold tracking-[-0.005em] text-[#0f1729]">
                  {view.name}
                </div>
                <div className="mt-0.5 text-[12px] text-[#6b7280]">
                  Saved View &middot; Updated Jun 21, 2026
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-[#13644e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
                  {view.count} Leads
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
                style={{
                  boxShadow:
                    "0 12px 32px -8px rgba(15,23,41,0.18), 0 2px 6px rgba(15,23,41,0.08)",
                }}
              >
                <div className="flex items-center gap-2 border-b border-[#f1f2f4] px-3 py-2.5">
                  <IconSearch size={14} stroke={2} className="text-[#9ca3af]" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Views"
                    className="w-full bg-transparent text-[13px] text-[#0f1729] outline-none placeholder:text-[#9ca3af]"
                  />
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {pinned.length > 0 && (
                    <div className="py-1.5">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                        Pinned
                      </div>
                      {pinned.map((v) => (
                        <ViewRow
                          key={v.id}
                          view={v}
                          active={v.id === view.id}
                          onPick={() => {
                            setView(v);
                            setPickerOpen(false);
                            setSearch("");
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {others.length > 0 && (
                    <div className="border-t border-[#f1f2f4] py-1.5">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                        All Views
                      </div>
                      {others.map((v) => (
                        <ViewRow
                          key={v.id}
                          view={v}
                          active={v.id === view.id}
                          onPick={() => {
                            setView(v);
                            setPickerOpen(false);
                            setSearch("");
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {filtered.length === 0 && (
                    <div className="px-4 py-6 text-center text-[12px] text-[#9ca3af]">
                      No views match &quot;{search}&quot;
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPickerOpen(false);
                    alert("Would navigate to /leads with the filter panel open and a Save This View action primed.");
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 border-t border-[#f1f2f4] px-4 py-3 text-left text-[12.5px] font-medium text-[#13644e] hover:bg-[#f7f8f9]"
                >
                  <IconPlus size={13} stroke={2.25} />
                  Create A New View
                  <IconExternalLink size={12} stroke={2} className="ml-auto text-[#9ca3af]" />
                </button>
              </div>
            )}
          </div>

          {previewOpen && (
            <div className="mt-3 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
              <div className="flex items-center justify-between border-b border-[#f1f2f4] px-4 py-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                  First In Queue
                </span>
                <span className="text-[11px] text-[#6b7280]">
                  Plus {Math.max(view.count - previewLeads.length, 0)} More
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
                        {l.county} &middot; {l.status}
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

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
                Using Your Defaults
              </div>
              <button
                type="button"
                onClick={() => setEditingDefaults((e) => !e)}
                className="cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
              >
                {editingDefaults ? "Use Defaults" : "Change For This Session"}
              </button>
            </div>

            {!editingDefaults ? (
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
                <DefaultRow icon={<IconPhone size={14} stroke={2} />} label="Caller ID" value={callerIdLabel} />
                <DefaultRow icon={<IconMicrophone size={14} stroke={2} />} label="Voicemail" value={voicemailLabel} />
                <DefaultRow icon={<IconClock size={14} stroke={2} />} label="Wrap Up" value={wrapUpLabel} />
                <DefaultRow icon={<IconMail size={14} stroke={2} />} label="Auto Followup" value="4 Templates Set" />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <EditRow icon={<IconPhone size={14} stroke={2} />} label="Caller ID">
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
                <EditRow icon={<IconMicrophone size={14} stroke={2} />} label="Voicemail">
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
                <EditRow icon={<IconClock size={14} stroke={2} />} label="Wrap Up">
                  <div className="flex items-center gap-3">
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
                </EditRow>
                <EditRow icon={<IconMail size={14} stroke={2} />} label="Auto Followup">
                  <button
                    type="button"
                    onClick={() => alert("Would open the followup templates side sheet (4 outcome rows with template dropdowns).")}
                    className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-3 text-left text-[12.5px] font-medium text-[#0f1729] transition hover:border-[#0f1729]"
                  >
                    4 Templates Set
                    <IconExternalLink size={12} stroke={2} className="text-[#9ca3af]" />
                  </button>
                </EditRow>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStarted(view.name)}
            className="mt-7 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#0a3d4a] to-[#13644e] text-[14px] font-semibold tracking-[-0.005em] text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_8px_20px_-4px_rgba(13,75,58,0.30)] transition hover:opacity-95"
          >
            Start Session
            <IconArrowRight size={15} stroke={2.25} />
          </button>

          {started && (
            <div className="mt-4 rounded-[10px] border border-[#0f1729] bg-[#0f1729] px-4 py-3 text-[12.5px] text-white">
              <div className="font-semibold">Session Would Start Now</div>
              <div className="mt-1 text-[11.5px] text-[#9ca3af]">
                {view.count} Leads &middot; {started} &middot; Caller ID: {callerIdLabel} &middot; Voicemail: {voicemailLabel} &middot; Wrap Up: {wrapUpLabel}
              </div>
              <button
                type="button"
                onClick={() => setStarted(null)}
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
    </div>
  );
}

function ViewRow({
  view,
  active,
  onPick,
}: {
  view: SavedView;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={[
        "flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition",
        active ? "bg-[#f7f8f9]" : "hover:bg-[#f7f8f9]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        {active && <IconCheck size={13} stroke={2.5} className="text-[#13644e]" />}
        <span
          className={[
            "text-[13px]",
            active ? "font-semibold text-[#0f1729]" : "font-medium text-[#374151]",
          ].join(" ")}
          style={{ marginLeft: active ? 0 : 21 }}
        >
          {view.name}
        </span>
      </div>
      <span className="text-[11.5px] tabular-nums text-[#6b7280]">
        {view.count}
      </span>
    </button>
  );
}

function DefaultRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#6b7280]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.06em] text-[#9ca3af]">
          {label}
        </div>
        <div className="truncate text-[12.5px] font-medium text-[#0f1729]">
          {value}
        </div>
      </div>
    </div>
  );
}

function EditRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#6b7280]">
          {icon}
        </div>
        <span className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-[#6b7280]">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
