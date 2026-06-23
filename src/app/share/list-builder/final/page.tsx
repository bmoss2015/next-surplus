"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconCheck,
  IconExternalLink,
  IconFileUpload,
  IconBookmark,
  IconWorld,
} from "@tabler/icons-react";

type Source = "import" | "saved" | "all";
type ListOption = {
  id: string;
  name: string;
  count: number;
  source: Source;
  meta?: string;
};

const LIST_OPTIONS: ListOption[] = [
  { id: "all", name: "All Leads", count: 412, source: "all" },
  { id: "fort-bend", name: "Fort Bend County, Texas", count: 47, source: "import", meta: "Imported Jun 21, 2026" },
  { id: "mecklenburg", name: "Mecklenburg County, North Carolina", count: 23, source: "import", meta: "Imported Jun 19, 2026" },
  { id: "heir", name: "Heir Research Batch", count: 12, source: "import", meta: "Imported Jun 17, 2026" },
  { id: "travis", name: "Travis County, Texas", count: 31, source: "import", meta: "Imported May 28, 2026" },
  { id: "high-surplus", name: "High Surplus All States", count: 38, source: "saved" },
  { id: "no-contact-60", name: "No Contact 60+ Days", count: 34, source: "saved" },
];

export default function FinalVariant() {
  const [selected, setSelected] = useState<ListOption>(LIST_OPTIONS[1]);
  const [listOpen, setListOpen] = useState(false);
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listOpen) return;
    function onDown(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setListOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [listOpen]);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="mx-auto max-w-[880px] px-14 pb-32 pt-12">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
          Picked Variant &middot; Resume From I + Filter From J + Defaults From G
        </div>
        <h1 className="mt-2.5 text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
          Start A Dialer Session
        </h1>

        <div
          className="mt-8 flex overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02), 0 12px 32px -10px rgba(13,75,58,0.10)" }}
        >
          <div
            className="w-[5px] shrink-0"
            style={{ background: "linear-gradient(135deg, #0d4b3a 0%, #04261c 100%)" }}
          />
          <div className="flex flex-1 items-center justify-between gap-6 px-8 py-7">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
                Resume Last Session
              </div>
              <div className="mt-2.5 text-[20px] font-semibold leading-[1.2] tracking-[-0.022em] text-[#0a0d14]">
                Fort Bend County, Texas
              </div>
              <div className="mt-3 flex items-center gap-2 text-[13px] text-[#5b606a]">
                <div className="flex h-[6px] w-[120px] overflow-hidden rounded-full bg-[#f1f2f4]">
                  <div className="h-full bg-[#0d4b3a]" style={{ width: "48.9%" }} />
                </div>
                <span className="tabular-nums">
                  <span className="font-semibold text-[#0a0d14]">23</span>
                  <span className="text-[#9298a3]"> of </span>
                  <span className="font-semibold text-[#0a0d14]">47</span>
                  <span> Dialed</span>
                </span>
              </div>
              <div className="mt-1.5 text-[12px] text-[#9298a3]">
                Paused Yesterday At 4:38pm
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[7px] bg-[#0d4b3a] px-6 text-[14px] font-medium tracking-[-0.008em] text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
            >
              Resume Session
              <IconArrowRight size={14} stroke={2.25} />
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
          Or Start A New Session
          <span className="h-px flex-1 bg-[#ebedf0]" />
        </div>

        <div className="mt-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            Calling List
          </div>
          <div className="relative mt-2" ref={listRef}>
            <button
              type="button"
              onClick={() => setListOpen((o) => !o)}
              className="group flex w-full cursor-pointer items-baseline justify-between gap-4 py-1 text-left transition"
            >
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[22px] font-semibold tracking-[-0.022em] text-[#0a0d14] transition group-hover:text-[#0d4b3a]">
                    {selected.name}
                  </span>
                  <IconChevronDown
                    size={16}
                    stroke={2}
                    className={["text-[#9298a3] transition", listOpen ? "rotate-180" : ""].join(" ")}
                  />
                </div>
                {selected.meta && (
                  <div className="mt-1 text-[12.5px] text-[#5b606a]">{selected.meta}</div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[15px] font-semibold tabular-nums text-[#0a0d14]">{selected.count}</div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#9298a3]">Leads</div>
              </div>
            </button>

            {listOpen && (
              <div
                className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-[12px] border border-[#ebedf0] bg-white"
                style={{ boxShadow: "0 16px 40px -8px rgba(15,23,41,0.18), 0 4px 8px rgba(15,23,41,0.06)" }}
              >
                <div className="max-h-[420px] overflow-y-auto">
                  <Group icon={<IconWorld size={11} stroke={2.25} />} label="Everyone In Your Database">
                    {LIST_OPTIONS.filter((o) => o.source === "all").map((o) => (
                      <Row key={o.id} option={o} selected={o.id === selected.id} onSelect={() => { setSelected(o); setListOpen(false); }} />
                    ))}
                  </Group>
                  <Group icon={<IconFileUpload size={11} stroke={2.25} />} label="Recent Imports">
                    {LIST_OPTIONS.filter((o) => o.source === "import").map((o) => (
                      <Row key={o.id} option={o} selected={o.id === selected.id} onSelect={() => { setSelected(o); setListOpen(false); }} />
                    ))}
                  </Group>
                  <Group icon={<IconBookmark size={11} stroke={2.25} />} label="Saved Lists">
                    {LIST_OPTIONS.filter((o) => o.source === "saved").map((o) => (
                      <Row key={o.id} option={o} selected={o.id === selected.id} onSelect={() => { setSelected(o); setListOpen(false); }} />
                    ))}
                  </Group>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="mt-7 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="flex items-start justify-between gap-6 px-7 py-5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Filter</div>
              <div className="mt-1.5 text-[16px] font-semibold tracking-[-0.018em] text-[#0a0d14]">Trim The List</div>
            </div>
            <div className="text-right">
              <div className="text-[26px] font-semibold leading-none tabular-nums tracking-[-0.022em] text-[#0a0d14]">28</div>
              <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
                Leads Match
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-[#f1f2f4]">
            <FilterCell label="Stage" value="Researched, First Contact" right />
            <FilterCell label="State" value="Texas" />
            <FilterCell label="County" value="Fort Bend" right />
            <FilterCell label="Sale Type" value="Tax Sale" />
            <FilterCell label="Owner Status" value="Living" right />
            <FilterCell label="Surplus" value="$20,000+" />
            <FilterCell label="Last Touched" value="Never" right />
            <FilterCell label="Has Notes" value="Any" last />
          </div>
          <div className="flex items-center gap-7 border-t border-[#f1f2f4] px-7 py-4">
            <Toggle label="Skip DNC" on />
            <Toggle label="Skip Litigated" on />
          </div>
        </div>

        <div
          className="mt-5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="flex items-start justify-between gap-6 px-7 py-5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Defaults</div>
              <div className="mt-1.5 max-w-[64ch] text-[13px] leading-[1.55] text-[#5b606a]">
                Using your saved defaults. Click Edit to change any one for just this session.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDefaultsOpen((o) => !o)}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[7px] bg-white px-4 text-[13.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
              style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
            >
              {defaultsOpen ? "Hide" : "Edit"}
              {defaultsOpen ? <IconChevronUp size={13} stroke={2} className="text-[#9298a3]" /> : <IconChevronDown size={13} stroke={2} className="text-[#9298a3]" />}
            </button>
          </div>
          {defaultsOpen && (
            <div className="border-t border-[#f1f2f4] divide-y divide-[#f1f2f4]">
              <DefaultRow label="Caller ID" value="Auto Map By State" subtitle="Picks a number local to each lead's state if available, otherwise falls back to your default number." />
              <DefaultRow label="Voicemail" value="Off · You'll Handle Voicemail Manually" subtitle="Pre-record a voicemail to have it auto-play when a call reaches voicemail. Configure in Settings → Recordings." />
              <DefaultRow label="Wrap Up" value="30 Seconds" subtitle="Short pause after a live conversation so you can finish your notes before the next call." />
              <DefaultRow label="Email Followup" value="On · Auto Sent After Each Call" subtitle="An email auto-sends based on how the call went. Configure in Settings → Email Templates." />
              <DefaultRow label="SMS Followup" value="Not Ready Until Approved" subtitle="Send a different text after a call. Unlocks after A2P 10DLC brand approval. Configure in Settings → SMS Templates." muted />
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <input
            type="text"
            placeholder="Name This List To Save It"
            className="h-11 flex-1 rounded-[7px] border border-[#ebedf0] bg-white px-4 text-[14px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
          />
          <button
            type="button"
            className="h-11 cursor-pointer rounded-[7px] bg-white px-5 text-[13.5px] font-medium text-[#0a0d14] transition hover:border-[#d8d6cf]"
            style={{ border: "1px solid #ebedf0", boxShadow: "0 1px 1px rgba(12,13,16,0.02)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[14px] font-medium tracking-[-0.008em] text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
          >
            Start Session
            <span className="rounded-[5px] bg-white/15 px-2 py-0.5 text-[12px] tabular-nums">28</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#f1f2f4] py-2 last:border-b-0">
      <div className="flex items-center gap-1.5 px-4 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">
        {icon}
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ option, selected, onSelect }: { option: ListOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2 text-left transition",
        selected ? "bg-[#fafbfc]" : "hover:bg-[#fafbfc]",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-2">
        {selected ? (
          <IconCheck size={13} stroke={2.5} className="shrink-0 text-[#0d4b3a]" />
        ) : (
          <span className="w-[13px]" />
        )}
        <div className="min-w-0">
          <div className={["truncate text-[13px]", selected ? "font-semibold text-[#0a0d14]" : "font-medium text-[#374151]"].join(" ")}>
            {option.name}
          </div>
          {option.meta && <div className="mt-0.5 truncate text-[11px] text-[#9298a3]">{option.meta}</div>}
        </div>
      </div>
      <span className="shrink-0 text-[11.5px] tabular-nums text-[#5b606a]">{option.count}</span>
    </button>
  );
}

function FilterCell({ label, value, right, last }: { label: string; value: string; right?: boolean; last?: boolean }) {
  return (
    <div className={[
      "flex items-center justify-between gap-3 px-7 py-3.5",
      right ? "border-r border-[#f1f2f4]" : "",
      last ? "" : "border-b border-[#f1f2f4]",
    ].join(" ")}>
      <div className="text-[12.5px] font-medium text-[#5b606a]">{label}</div>
      <button
        type="button"
        className="inline-flex max-w-[65%] cursor-pointer items-center gap-1.5 rounded-[6px] bg-[#fafbfc] px-2.5 py-1.5 text-[12px] font-medium text-[#0a0d14] transition hover:bg-white hover:shadow-[0_1px_2px_rgba(12,13,16,0.06)]"
      >
        <span className="truncate">{value}</span>
        <IconChevronDown size={11} stroke={2} className="shrink-0 text-[#9298a3]" />
      </button>
    </div>
  );
}

function DefaultRow({ label, value, subtitle, muted }: { label: string; value: string; subtitle: string; muted?: boolean }) {
  return (
    <div className="grid grid-cols-[160px_1fr_auto] items-start gap-6 px-7 py-5">
      <div className="pt-1 text-[12.5px] font-medium text-[#0a0d14]">{label}</div>
      <div>
        <div className={["text-[13.5px] font-medium", muted ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {value}
        </div>
        <div className="mt-1.5 text-[12px] leading-[1.55] text-[#5b606a]">{subtitle}</div>
      </div>
      <button
        type="button"
        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-[6px] bg-white px-2.5 text-[12px] font-medium text-[#5b606a] transition hover:text-[#0a0d14]"
        style={{ border: "1px solid #ebedf0" }}
      >
        Change
        <IconExternalLink size={11} stroke={2} className="text-[#9298a3]" />
      </button>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <span
        className={[
          "relative inline-flex h-[20px] w-[36px] shrink-0 rounded-full transition",
          on ? "bg-[#0d4b3a]" : "bg-[#d6d4cd]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white transition",
            on ? "left-[18px]" : "left-[2px]",
          ].join(" ")}
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.20), 0 0 0 0.5px rgba(12,13,16,0.06)" }}
        />
      </span>
      <span className="text-[12.5px] font-medium text-[#0a0d14]">{label}</span>
    </label>
  );
}
