"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  MicOff,
  Mic,
  Pause,
  Play,
  SkipForward,
  Mail,
  MessageSquare,
  X,
  CheckCircle2,
  PhoneOff as PhoneOffIcon,
} from "lucide-react";
import { CALLER_IDS, type DialerLead, nextDialable } from "../_mock/data";
import { STAGE_LABELS, type Stage, stateName } from "@/lib/leads/types";
import { StagePill } from "@/components/StagePill";

type CallPhase = "ringing" | "connected" | "ended";

type Disposition = {
  key:
    | "answered_interested"
    | "answered_not_interested"
    | "callback"
    | "no_answer"
    | "voicemail"
    | "wrong_number"
    | "disconnected"
    | "dnc";
  label: string;
  description: string;
  tone: "good" | "neutral" | "info" | "muted" | "bad" | "stop";
};

const DISPOSITIONS: Disposition[] = [
  {
    key: "answered_interested",
    label: "Answered, Interested",
    description: "Move them to In Conversation.",
    tone: "good",
  },
  {
    key: "answered_not_interested",
    label: "Answered, Not Interested",
    description: "Log the no, leave the lead in place.",
    tone: "neutral",
  },
  {
    key: "callback",
    label: "Answered, Callback Requested",
    description: "Schedule a follow up call.",
    tone: "info",
  },
  {
    key: "no_answer",
    label: "No Answer",
    description: "Phone rang out.",
    tone: "muted",
  },
  {
    key: "voicemail",
    label: "Left Voicemail",
    description: "Drop a message and rotate.",
    tone: "muted",
  },
  {
    key: "wrong_number",
    label: "Wrong Number",
    description: "Mark this number invalid.",
    tone: "bad",
  },
  {
    key: "disconnected",
    label: "Disconnected",
    description: "Mark this number as out of service.",
    tone: "bad",
  },
  {
    key: "dnc",
    label: "Do Not Contact",
    description: "Suppress the whole lead.",
    tone: "stop",
  },
];

function toneClass(tone: Disposition["tone"], selected: boolean): string {
  const base =
    "flex w-full items-start gap-3 rounded-md border px-3.5 py-2.5 text-left transition-colors";
  if (selected) {
    if (tone === "good") return `${base} border-petrol-500 bg-petrol-500 text-white`;
    if (tone === "info") return `${base} border-info-violet bg-info-violet-bg text-info-violet-deep`;
    if (tone === "bad") return `${base} border-danger bg-danger text-white`;
    if (tone === "stop")
      return `${base} border-ink bg-ink text-white`;
    return `${base} border-ink bg-ink text-white`;
  }
  if (tone === "good")
    return `${base} border-gray-200 bg-surface text-ink hover:border-petrol-500 hover:text-petrol-500`;
  if (tone === "info")
    return `${base} border-gray-200 bg-surface text-ink hover:border-info-violet hover:text-info-violet-deep`;
  if (tone === "bad")
    return `${base} border-gray-200 bg-surface text-ink hover:border-danger hover:text-danger`;
  if (tone === "stop")
    return `${base} border-gray-200 bg-surface text-ink hover:border-ink`;
  return `${base} border-gray-200 bg-surface text-ink hover:border-gray-300`;
}

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(1, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

function fmtNoteDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function ActiveCall({
  lead,
  contactId,
  numberId,
  callerIdId,
  position,
  total,
  onNext,
  onStop,
  onChangeCallerId,
}: {
  lead: DialerLead;
  contactId: string;
  numberId: string;
  callerIdId: string;
  position: number;
  total: number;
  onNext: () => void;
  onStop: () => void;
  onChangeCallerId: (id: string) => void;
}) {
  const contact = lead.contacts.find((c) => c.id === contactId) ?? lead.contacts[0];
  const number =
    contact.numbers.find((n) => n.id === numberId) ?? contact.numbers[0];

  const [phase, setPhase] = useState<CallPhase>("ringing");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [hold, setHold] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const [stageDraft, setStageDraft] = useState<Stage>(lead.stage);
  const [notes, setNotes] = useState("");
  const ringingRef = useRef(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (ringingRef.current) setPhase("connected");
    }, 2400);
    return () => {
      ringingRef.current = false;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (phase !== "connected" || hold) return;
    const i = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(i);
  }, [phase, hold]);

  function endCall() {
    ringingRef.current = false;
    setPhase("ended");
    setShowDisposition(true);
  }

  function resolveCallerId(): string {
    if (callerIdId === "auto") {
      const match = CALLER_IDS.find((c) => c.state === lead.state);
      return match ? `${match.formatted} ${match.state}` : "Auto";
    }
    const found = CALLER_IDS.find((c) => c.id === callerIdId);
    return found ? `${found.formatted} ${found.state}` : "Auto";
  }

  const next = useMemo(
    () => nextDialable(lead, contact.id, number.id),
    [lead, contact.id, number.id]
  );

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-surface px-7 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onStop}
            className="rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[12px] text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          >
            Exit Queue
          </button>
          <div>
            <div className="text-[11px] uppercase tracking-[0.4px] text-gray-500">
              Power Dial Session
            </div>
            <div className="text-[13.5px] font-medium text-ink">
              Lead {position} of {total}
            </div>
          </div>
        </div>
        <div className="text-[11.5px] text-gray-500">
          Mock Session · No Real Calls Placed
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[350px_minmax(0,1fr)_320px] overflow-hidden">
        <LeadContext lead={lead} activeContactId={contact.id} activeNumberId={number.id} />

        <CenterCall
          contactName={contact.name}
          numberFormatted={number.formatted}
          phase={phase}
          elapsed={elapsed}
          muted={muted}
          hold={hold}
          callerIdLabel={resolveCallerId()}
          callerIdValue={callerIdId}
          onChangeCallerId={onChangeCallerId}
          onToggleMute={() => setMuted((v) => !v)}
          onToggleHold={() => setHold((v) => !v)}
          onEnd={endCall}
          nextLabel={
            next
              ? `${next.contact.name} · ${next.num.formatted}`
              : "No Other Numbers"
          }
          hasNext={!!next}
        />

        <ActionsPanel
          notes={notes}
          onChangeNotes={setNotes}
          stage={stageDraft}
          onChangeStage={setStageDraft}
        />
      </div>

      {showDisposition && (
        <DispositionModal
          contactName={contact.name}
          numberFormatted={number.formatted}
          duration={elapsed}
          onSaveNext={() => {
            setShowDisposition(false);
            onNext();
          }}
          onSaveStop={() => {
            setShowDisposition(false);
            onStop();
          }}
        />
      )}
    </div>
  );
}

function LeadContext({
  lead,
  activeContactId,
  activeNumberId,
}: {
  lead: DialerLead;
  activeContactId: string;
  activeNumberId: string;
}) {
  const payout = Math.round(
    lead.estimatedSurplus * (lead.recoveryFeePercent / 100)
  );
  return (
    <aside className="flex flex-col overflow-hidden border-r border-gray-200 bg-surface">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
          {lead.leadId}
        </div>
        <h2 className="m-0 mt-0.5 text-[16px] font-medium tracking-tight text-ink">
          {lead.ownerName}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StagePill stage={lead.stage} />
          {lead.ownerStatus === "Deceased" && (
            <span className="rounded border border-gray-200 bg-surface px-2 py-[3px] text-[10.5px] font-medium text-gray-700">
              Deceased Owner
            </span>
          )}
          {lead.tags.map((t) => (
            <span
              key={t}
              className="rounded border border-gray-200 bg-surface px-2 py-[3px] text-[10.5px] font-medium text-gray-700"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-200 px-5 py-4 text-[12px]">
        <KV label="Property" value={lead.propertyAddress} full />
        <KV label="County" value={lead.county} />
        <KV label="State" value={stateName(lead.state)} />
        <KV label="Sale Date" value={lead.saleDate} />
        <KV label="Sale Process" value={lead.saleType} />
        <KV
          label="Estimated Surplus"
          value={fmtMoney(lead.estimatedSurplus)}
          strong
        />
        <KV
          label="Est. Net To You"
          value={fmtMoney(payout)}
          strong
        />
        <KV
          label="Last Contact"
          value={
            lead.daysSinceContact === 0
              ? "Today"
              : `${lead.daysSinceContact} Days Ago`
          }
        />
      </div>

      <div className="border-b border-gray-200 px-5 py-4">
        <div className="mb-2 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
          Contacts
        </div>
        <div className="space-y-3">
          {lead.contacts.map((c) => (
            <div key={c.id}>
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] font-medium text-ink">{c.name}</div>
                <div className="text-[10.5px] text-gray-500">{c.role}</div>
              </div>
              <div className="mt-1.5 space-y-1">
                {c.numbers.map((n) => {
                  const isActive =
                    c.id === activeContactId && n.id === activeNumberId;
                  return (
                    <div
                      key={n.id}
                      className={
                        isActive
                          ? "flex items-center justify-between rounded-md border border-petrol-500 bg-surface px-2.5 py-1.5"
                          : "flex items-center justify-between rounded-md border border-transparent px-2.5 py-1.5"
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            isActive
                              ? "h-1.5 w-1.5 rounded-full bg-petrol-500"
                              : "h-1.5 w-1.5 rounded-full bg-gray-300"
                          }
                        />
                        <span className="font-mono text-[12px] text-ink">
                          {n.formatted}
                        </span>
                        <span className="text-[10.5px] text-gray-500">
                          {n.label}
                        </span>
                      </div>
                      {n.status === "disconnected" && (
                        <span className="text-[10.5px] font-medium text-danger">
                          Disconnected
                        </span>
                      )}
                      {n.status === "wrong" && (
                        <span className="text-[10.5px] font-medium text-danger">
                          Wrong Number
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-5 pb-2 pt-4 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
          Notes · Newest First
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-3">
          {lead.notes.map((n) => (
            <div key={n.id} className="text-[12px]">
              <div className="flex items-center justify-between text-[10.5px] text-gray-500">
                <span className="font-medium text-gray-700">{n.author}</span>
                <span>{fmtNoteDate(n.createdAt)}</span>
              </div>
              <div className="mt-0.5 text-ink">{n.body}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function KV({
  label,
  value,
  strong,
  full,
}: {
  label: string;
  value: string;
  strong?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div
        className={
          strong
            ? "mt-0.5 text-[13px] font-medium text-ink"
            : "mt-0.5 text-[12.5px] text-ink"
        }
      >
        {value}
      </div>
    </div>
  );
}

function CenterCall({
  contactName,
  numberFormatted,
  phase,
  elapsed,
  muted,
  hold,
  callerIdLabel,
  callerIdValue,
  onChangeCallerId,
  onToggleMute,
  onToggleHold,
  onEnd,
  nextLabel,
  hasNext,
}: {
  contactName: string;
  numberFormatted: string;
  phase: CallPhase;
  elapsed: number;
  muted: boolean;
  hold: boolean;
  callerIdLabel: string;
  callerIdValue: string;
  onChangeCallerId: (v: string) => void;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onEnd: () => void;
  nextLabel: string;
  hasNext: boolean;
}) {
  const phaseLabel: Record<CallPhase, string> = {
    ringing: "Ringing...",
    connected: "Connected",
    ended: "Call Ended",
  };

  return (
    <section className="flex flex-col overflow-hidden bg-canvas">
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <div
          className={
            phase === "connected"
              ? "rounded-full bg-petrol-500 px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.6px] text-white"
              : phase === "ringing"
              ? "rounded-full border border-petrol-500 bg-surface px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.6px] text-petrol-500"
              : "rounded-full bg-ink px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.6px] text-white"
          }
        >
          {phaseLabel[phase]}
        </div>

        <div className="mt-7 text-[24px] font-medium tracking-tight text-ink">
          {contactName}
        </div>
        <div className="mt-1 font-mono text-[22px] text-ink/80">
          {numberFormatted}
        </div>

        <div className="mt-6 text-[40px] font-mono font-medium tracking-tight text-ink">
          {fmtDuration(phase === "connected" || phase === "ended" ? elapsed : 0)}
        </div>
        {phase === "ringing" && (
          <div className="mt-1 text-[12px] text-gray-500">
            Waiting for answer
          </div>
        )}
        {hold && phase === "connected" && (
          <div className="mt-1 text-[12px] font-medium text-info-violet-deep">
            On Hold
          </div>
        )}

        <div className="mt-9 flex items-center gap-3">
          <CircleBtn
            label={muted ? "Unmute" : "Mute"}
            active={muted}
            onClick={onToggleMute}
            Icon={muted ? MicOff : Mic}
          />
          <CircleBtn
            label={hold ? "Resume" : "Hold"}
            active={hold}
            onClick={onToggleHold}
            Icon={hold ? Play : Pause}
          />
          <button
            type="button"
            onClick={onEnd}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-elevated transition-colors hover:brightness-110"
            aria-label="End Call"
            title="End Call"
          >
            <PhoneOff size={22} strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          disabled={!hasNext}
          onClick={onEnd}
          className="mt-7 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-surface px-3.5 py-2 text-[12.5px] text-ink hover:border-gray-300 disabled:opacity-50"
        >
          <SkipForward size={13} strokeWidth={1.75} />
          <span>Try Next Number</span>
          <span className="text-gray-500">·</span>
          <span className="text-gray-500">{nextLabel}</span>
        </button>
      </div>

      <footer className="flex items-center justify-between border-t border-gray-200 bg-surface px-6 py-3 text-[12px]">
        <div className="flex items-center gap-2">
          <Phone size={13} strokeWidth={1.75} className="text-gray-500" />
          <span className="text-gray-500">Caller ID</span>
          <select
            value={callerIdValue}
            onChange={(e) => onChangeCallerId(e.target.value)}
            className="h-7 rounded-md border border-gray-200 bg-surface px-2 text-[12px] text-ink outline-none focus:border-petrol-500"
          >
            <option value="auto">Auto · {callerIdLabel}</option>
            {CALLER_IDS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.formatted} {c.state}
              </option>
            ))}
          </select>
        </div>
        <div className="text-gray-500">{callerIdLabel}</div>
      </footer>
    </section>
  );
}

function CircleBtn({
  label,
  active,
  onClick,
  Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  Icon: typeof Mic;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        active
          ? "flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-elevated"
          : "flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-surface text-ink hover:border-gray-300"
      }
    >
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );
}

function ActionsPanel({
  notes,
  onChangeNotes,
  stage,
  onChangeStage,
}: {
  notes: string;
  onChangeNotes: (v: string) => void;
  stage: Stage;
  onChangeStage: (s: Stage) => void;
}) {
  const stages: Stage[] = [
    "new_leads",
    "qualifying",
    "outreach",
    "in_conversation",
    "contract",
    "with_attorney",
    "claim_filed",
    "won",
    "lost",
  ];
  return (
    <aside className="flex flex-col overflow-hidden border-l border-gray-200 bg-surface">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
          Quick Note
        </div>
        <textarea
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          rows={4}
          placeholder="Capture what was said. Saves on disposition."
          className="mt-1.5 w-full resize-none rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-petrol-500"
        />
      </div>

      <div className="border-b border-gray-200 px-5 py-4">
        <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
          Stage
        </div>
        <select
          value={stage}
          onChange={(e) => onChangeStage(e.target.value as Stage)}
          className="mt-1.5 h-9 w-full rounded-md border border-gray-200 bg-surface px-2.5 text-[12.5px] text-ink outline-none focus:border-petrol-500"
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 px-5 py-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] font-medium text-ink hover:border-gray-300 hover:bg-gray-50"
        >
          <Mail size={14} strokeWidth={1.75} />
          Send Follow Up Email
        </button>
        <button
          type="button"
          disabled
          title="Coming Soon"
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] font-medium text-gray-400"
        >
          <MessageSquare size={14} strokeWidth={1.75} />
          Send Follow Up Text
          <span className="rounded bg-gray-150 px-1.5 py-[1px] text-[10px] font-medium text-gray-500">
            Soon
          </span>
        </button>
      </div>

      <div className="mt-auto border-t border-gray-200 px-5 py-4 text-[11px] text-gray-500">
        Dispositions log on End Call. Notes attach to the lead activity log.
      </div>
    </aside>
  );
}

function DispositionModal({
  contactName,
  numberFormatted,
  duration,
  onSaveNext,
  onSaveStop,
}: {
  contactName: string;
  numberFormatted: string;
  duration: number;
  onSaveNext: () => void;
  onSaveStop: () => void;
}) {
  const [picked, setPicked] = useState<Disposition["key"] | null>(null);
  const [note, setNote] = useState("");
  const [callbackAt, setCallbackAt] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-lg bg-surface shadow-elevated">
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="m-0 text-[16px] font-medium tracking-tight text-ink">
              Log Call Result
            </h2>
            <div className="mt-1 text-[12.5px] text-gray-500">
              {contactName} · <span className="font-mono">{numberFormatted}</span> ·{" "}
              <span className="font-mono">{fmtDuration(duration)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onSaveStop}
            aria-label="Close"
            className="text-gray-400 hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </header>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-6 py-5">
          {DISPOSITIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setPicked(d.key)}
              className={toneClass(d.tone, picked === d.key)}
            >
              <div className="mt-0.5 shrink-0">
                {picked === d.key ? (
                  <CheckCircle2 size={16} strokeWidth={2} />
                ) : d.tone === "bad" ? (
                  <PhoneOffIcon size={16} strokeWidth={1.75} className="text-danger" />
                ) : (
                  <Phone size={16} strokeWidth={1.75} className="text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-tight">
                  {d.label}
                </div>
                <div
                  className={
                    picked === d.key
                      ? "mt-0.5 text-[11.5px] text-white/85"
                      : "mt-0.5 text-[11.5px] text-gray-500"
                  }
                >
                  {d.description}
                </div>
              </div>
            </button>
          ))}

          {picked === "callback" && (
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="text-[11px] font-medium uppercase tracking-[0.4px] text-gray-500">
                Callback Time
              </div>
              <input
                type="datetime-local"
                value={callbackAt}
                onChange={(e) => setCallbackAt(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-gray-200 bg-surface px-2.5 text-[12.5px] text-ink outline-none focus:border-petrol-500"
              />
            </div>
          )}

          <div className="pt-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.4px] text-gray-500">
              Optional Note
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything worth remembering on the next attempt."
              className="mt-1.5 w-full resize-none rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-petrol-500"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onSaveStop}
            className="rounded-md border border-gray-200 bg-surface px-3.5 py-2 text-[12.5px] font-medium text-ink hover:border-gray-300 hover:bg-gray-50"
          >
            Save & Stop
          </button>
          <button
            type="button"
            onClick={onSaveNext}
            disabled={!picked}
            className="btn btn-primary rounded-md px-4 py-2 text-[12.5px] font-medium"
          >
            Save & Dial Next
          </button>
        </footer>
      </div>
    </div>
  );
}
