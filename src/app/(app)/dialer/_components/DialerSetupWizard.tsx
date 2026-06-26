"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconCheck,
  IconSettings,
} from "@tabler/icons-react";
import { startSession } from "../_actions";

type Source = "import" | "saved" | "all";
type ListOption = {
  id: string;
  name: string;
  count: number;
  source: Source;
  meta?: string;
};

const FALLBACK_LIST_OPTIONS: ListOption[] = [
  { id: "all", name: "All Leads", count: 0, source: "all" },
];

export function DialerSetupWizard({
  options,
  resumeSession,
}: {
  options?: ListOption[];
  resumeSession?: { id: string; list_name: string; remaining: number; paused_at: string | null } | null;
} = {}) {
  const router = useRouter();
  const listOptions = options && options.length > 0 ? options : FALLBACK_LIST_OPTIONS;
  const [selected, setSelected] = useState<ListOption | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [name, setName] = useState("");
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, startTransition] = useTransition();

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listOpen) return;
    function onDown(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setListOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [listOpen]);

  const filteredOptions = listOptions.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleStart() {
    if (!selected) return;
    setStartError(null);
    startTransition(async () => {
      const res = await startSession({
        list_id: selected.id,
        list_name: name.trim() || selected.name,
        filter_snapshot: { source: selected.source },
      });
      if (!res.ok) {
        setStartError(res.error);
        return;
      }
      router.push(`/dialer?session=${res.session_id}`);
    });
  }

  function handleResume() {
    if (!resumeSession) return;
    router.push(`/dialer?session=${resumeSession.id}`);
  }

  const resumeRelative = resumeSession?.paused_at
    ? formatRelative(resumeSession.paused_at)
    : null;

  return (
    <div className="mx-auto max-w-[880px] px-14 pb-32 pt-12">
      <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.028em] text-[#0a0d14]">
        Start A Dialer Session
      </h1>

      {resumeSession && (
        <>
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
                  {resumeSession.list_name}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[13px] text-[#5b606a]">
                  <span className="tabular-nums">
                    <span className="font-semibold text-[#0a0d14]">{resumeSession.remaining}</span>
                    <span> Lead{resumeSession.remaining === 1 ? "" : "s"} Remaining</span>
                  </span>
                </div>
                {resumeRelative && (
                  <div className="mt-1.5 text-[12px] text-[#9298a3]">Paused {resumeRelative}</div>
                )}
              </div>
              <button
                type="button"
                onClick={handleResume}
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
        </>
      )}

      <div className={resumeSession ? "mt-6" : "mt-8"}>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
          Lead Source
        </div>
        <div className="relative mt-2" ref={listRef}>
          <button
            type="button"
            onClick={() => setListOpen((o) => !o)}
            className={[
              "group flex w-full cursor-pointer items-center justify-between gap-4 rounded-[8px] px-3 py-2 -ml-3 -mt-1 text-left transition",
              listOpen ? "bg-[#fafbfc]" : "hover:bg-[#fafbfc]",
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {selected ? (
                  <>
                    <span className="text-[22px] font-semibold tracking-[-0.022em] text-[#0a0d14]">
                      {selected.name}
                    </span>
                    <IconChevronDown
                      size={18}
                      stroke={2.25}
                      className={["text-[#0d4b3a] transition", listOpen ? "rotate-180" : ""].join(" ")}
                    />
                  </>
                ) : (
                  <>
                    <span className="text-[22px] font-semibold tracking-[-0.022em] text-[#0a0d14]">
                      Pick A List To Dial
                    </span>
                    <span
                      className="inline-flex h-[28px] items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-3 text-[12px] font-semibold text-white"
                      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 4px 12px -2px rgba(13,75,58,0.28)" }}
                    >
                      Choose
                      <IconChevronDown size={11} stroke={2.5} className={["transition", listOpen ? "rotate-180" : ""].join(" ")} />
                    </span>
                  </>
                )}
              </div>
              {selected?.meta && (
                <div className="mt-1.5 text-[12.5px] text-[#5b606a]">{selected.meta}</div>
              )}
              {!selected && (
                <div className="mt-1.5 text-[12.5px] text-[#5b606a]">
                  Pick a recent import, a saved list, or everyone in your database.
                </div>
              )}
            </div>
          </button>

          {listOpen && (
            <div
              className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[12px] border border-[#ebedf0] bg-white"
              style={{ boxShadow: "0 16px 40px -8px rgba(15,23,41,0.18), 0 4px 8px rgba(15,23,41,0.06)" }}
            >
              <div className="border-b border-[#f1f2f4] px-4 py-3">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Lists..."
                  className="w-full bg-transparent text-[13.5px] text-[#0a0d14] outline-none placeholder:text-[#c2c5cc]"
                />
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                <ListGroup label="Everyone In Your Database">
                  {filteredOptions.filter((o) => o.source === "all").map((o) => (
                    <ListRow key={o.id} option={o} selected={o.id === selected?.id} onSelect={() => { setSelected(o); setListOpen(false); setSearch(""); }} />
                  ))}
                </ListGroup>
                <ListGroup label="Recent Imports">
                  {filteredOptions.filter((o) => o.source === "import").map((o) => (
                    <ListRow key={o.id} option={o} selected={o.id === selected?.id} onSelect={() => { setSelected(o); setListOpen(false); setSearch(""); }} />
                  ))}
                </ListGroup>
                <ListGroup label="Saved Lists">
                  {filteredOptions.filter((o) => o.source === "saved").map((o) => (
                    <ListRow key={o.id} option={o} selected={o.id === selected?.id} onSelect={() => { setSelected(o); setListOpen(false); setSearch(""); }} />
                  ))}
                </ListGroup>
                {filteredOptions.length === 0 && (
                  <div className="px-4 py-8 text-center text-[12.5px] text-[#9298a3]">
                    No lists match &quot;{search}&quot;
                  </div>
                )}
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
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Quick Filters</div>
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
              Using your saved defaults for caller ID, voicemail, wrap up, email, and SMS. Customize any one for just this session.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDefaultsOpen((o) => !o)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-[#0d4b3a] transition hover:text-[#13644e]"
          >
            {defaultsOpen ? "Hide" : "Customize For This Session"}
            {defaultsOpen ? <IconChevronUp size={13} stroke={2.25} /> : <IconChevronDown size={13} stroke={2.25} />}
          </button>
        </div>
        {defaultsOpen && (
          <div className="border-t border-[#f1f2f4] divide-y divide-[#f1f2f4]">
            <DefaultRow
              label="Caller ID"
              value="Auto Map By State"
              subtitle="Picks a number local to each lead's state if available, otherwise falls back to the default number."
              href="/settings#phone-numbers"
              adminOnly
            />
            <DefaultRow
              label="Voicemail"
              value="Off · Voicemail Handled Manually"
              subtitle="Pre-record a voicemail to auto-play when a call reaches voicemail. Configure in Settings."
              href="/settings#recordings"
              adminOnly
            />
            <DefaultRow
              label="Wrap Up"
              value="30 Seconds"
              subtitle="Short pause after a live conversation so notes can finish before the next call."
              href="/settings#dialer-defaults"
              adminOnly
            />
            <DefaultRow
              label="Email Followup"
              value="On · Auto Sent After Each Call"
              subtitle="An email auto-sends based on the call outcome. Configure in Settings."
              href="/settings#email-templates"
              adminOnly
            />
            <DefaultRow
              label="SMS Followup"
              value="Waiting On A2P 10DLC Approval"
              subtitle="A text auto-sends after each call. Unlocks once the brand and campaign clear carrier review."
              href="/dialer/a2p"
              adminOnly
              muted
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name This List To Save It"
          className="h-11 flex-1 rounded-[7px] border border-[#ebedf0] bg-white px-4 text-[14px] text-[#0a0d14] outline-none transition focus:border-[#0d4b3a] placeholder:text-[#c2c5cc]"
        />
        <button
          type="button"
          onClick={() => router.push("/")}
          className="h-11 cursor-pointer px-3 text-[13.5px] font-medium text-[#5b606a] transition hover:text-[#0a0d14]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleStart}
          disabled={!selected || isStarting}
          className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[14px] font-medium tracking-[-0.008em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 8px 20px -4px rgba(13,75,58,0.34)" }}
        >
          {isStarting ? "Starting..." : "Start Session"}
          {selected && !isStarting && <span className="rounded-[5px] bg-white/15 px-2 py-0.5 text-[12px] tabular-nums">{selected.count}</span>}
        </button>
      </div>
      {startError && (
        <div className="mt-3 rounded-[7px] border border-[#fee4e2] bg-[#fef3f2] px-4 py-2.5 text-[12.5px] text-[#b42318]">
          {startError}
        </div>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} Minute${mins === 1 ? "" : "s"} Ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} Hour${hours === 1 ? "" : "s"} Ago`;
  const days = Math.floor(hours / 24);
  return `${days} Day${days === 1 ? "" : "s"} Ago`;
}

function ListGroup({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div className="border-b border-[#f1f2f4] py-2 last:border-b-0">
      <div className="px-4 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ListRow({ option, selected, onSelect }: { option: ListOption; selected: boolean; onSelect: () => void }) {
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
    <button
      type="button"
      className={[
        "group flex w-full cursor-pointer items-center justify-between gap-3 px-7 py-3.5 text-left transition hover:bg-[#fafbfc]",
        right ? "border-r border-[#f1f2f4]" : "",
        last ? "" : "border-b border-[#f1f2f4]",
      ].join(" ")}
    >
      <div className="text-[12.5px] font-medium text-[#5b606a]">{label}</div>
      <div className="inline-flex max-w-[65%] items-center gap-1.5 text-[12.5px] font-semibold text-[#0a0d14]">
        <span className="truncate">{value}</span>
        <IconChevronDown size={12} stroke={2.25} className="shrink-0 text-[#0d4b3a] opacity-60 transition group-hover:opacity-100" />
      </div>
    </button>
  );
}

function DefaultRow({
  label,
  value,
  subtitle,
  muted,
  href,
  adminOnly,
}: {
  label: string;
  value: string;
  subtitle: string;
  muted?: boolean;
  href?: string;
  adminOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr_auto] items-start gap-6 px-7 py-5">
      <div className="pt-1 text-[12.5px] font-medium text-[#0a0d14]">
        {label}
        {adminOnly && (
          <span className="ml-2 inline-flex items-center rounded-[4px] bg-[#f1f2f4] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#5b606a]">
            Admin
          </span>
        )}
      </div>
      <div>
        <div className={["text-[13.5px] font-medium", muted ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {value}
        </div>
        <div className="mt-1.5 text-[12px] leading-[1.55] text-[#5b606a]">{subtitle}</div>
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-semibold text-[#0d4b3a] transition hover:text-[#13644e]"
        >
          Configure
          <IconSettings size={11} stroke={2} />
        </Link>
      ) : (
        <span className="text-[12px] text-[#9298a3]">—</span>
      )}
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
