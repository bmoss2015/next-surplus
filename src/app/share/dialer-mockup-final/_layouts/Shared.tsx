import {
  CANVAS_W,
  CANVAS_H,
  SESSION_STATS,
  QUEUE_TOTAL,
  QUEUE_POSITION,
  NOTE_TIMESTAMP,
  type Lead,
  type QueueItem,
  type Contact,
  type Activity,
} from "../_data";

export const PETROL_GRADIENT =
  "bg-[linear-gradient(135deg,#04261c_0%,#0a3b2c_45%,#13644e_100%)]";

export const CARD_SHADOW =
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]";

export const BTN_SHADOW = "shadow-[0_1px_2px_rgba(0,0,0,0.08)]";

export const SECTION_DIVIDER = "h-px w-full bg-[rgba(0,0,0,0.08)]";

export function CanvasFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden bg-[#FAFAFA] font-sans text-ink"
      style={{ width: CANVAS_W, height: CANVAS_H }}
    >
      {children}
    </div>
  );
}

export function Logomark() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-petrol-700 text-[10px] font-bold tracking-tight text-white">
        N
      </div>
      <div className="text-[12px] font-semibold tracking-tight text-ink">
        Next Surplus
      </div>
      <div className="ml-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        Power Dialer
      </div>
    </div>
  );
}

export function TopHeader() {
  return (
    <div className="flex h-16 items-center gap-6 border-b border-gray-200 bg-white px-6">
      <Logomark />
      <div className="ml-1 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petrol-500 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-petrol-500" />
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink">
          Live Call
        </span>
      </div>
      <div className="mx-auto">
        <StatsStrip />
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`inline-flex h-9 w-[120px] cursor-pointer items-center justify-center rounded-lg bg-white text-[12.5px] font-semibold text-petrol-700 ${BTN_SHADOW} hover:bg-gray-50`}
        >
          Pause Session
        </div>
        <div
          className={`inline-flex h-9 w-[120px] cursor-pointer items-center justify-center rounded-lg bg-[#b91c1c] text-[12.5px] font-semibold text-white ${BTN_SHADOW}`}
        >
          End Session
        </div>
      </div>
    </div>
  );
}

export function StatsStrip() {
  return (
    <div className="flex items-end gap-9">
      {SESSION_STATS.map((s) => (
        <div key={s.label} className="flex flex-col" title={s.tooltip}>
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-500 leading-none">
            {s.label}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[18px] font-semibold tabular-nums leading-none text-ink">
              {s.value}
            </span>
            <TrendIcon
              direction={s.direction}
              className={`h-3 w-3 ${
                s.direction === "up"
                  ? "text-[#15803d]"
                  : s.direction === "down"
                  ? "text-[#b91c1c]"
                  : "text-gray-400"
              }`}
            />
            {s.pulse && (
              <span className="relative ml-0.5 flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petrol-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-petrol-500" />
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({
  state,
  timer,
}: {
  state: "live" | "ended";
  timer: string;
}) {
  const dot = state === "live" ? "bg-petrol-300" : "bg-white/40";
  const label = state === "live" ? "Connected" : "Call Ended";
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {state === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petrol-300 opacity-60" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="text-[12px] font-semibold text-white">{label}</span>
      <span className="font-mono text-[12.5px] tabular-nums text-white">
        {timer}
      </span>
    </div>
  );
}

export function CaseTypeChip({
  index,
  total,
}: {
  index: number;
  total: number;
}) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
      Same Case
      <span className="mx-1.5 text-white/40">·</span>
      <span className="text-white/85">
        Contact {index} of {total}
      </span>
    </span>
  );
}

export function HeroDivider() {
  return <div className="my-4 h-px w-full bg-white/20" />;
}

export function FinancialStack({ lead }: { lead: Lead }) {
  const rows: [string, string][] = [
    ["RECOVERY FEE", lead.recoveryFee],
    ["SURPLUS", lead.surplus],
    ["NET TO FIRM", lead.netToFirm],
  ];
  return (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-6 gap-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65 leading-none">
            {label}
          </div>
          <div className="text-right text-[24px] font-semibold tabular-nums leading-none text-white">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeadSummary({ lead, dim = false }: { lead: Lead; dim?: boolean }) {
  return (
    <div className={dim ? "opacity-70" : ""}>
      <div className="text-[13px] font-semibold tracking-tight text-white">
        Lead Summary
      </div>
      <ul className="mt-2 space-y-1.5">
        {lead.leadSummary.map((b, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/45" />
            <span className="flex-1 text-[11.5px] leading-snug text-white/90">
              {b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ControlRow() {
  const buttons = ["Mute", "Keypad", "Hold", "Transfer", "Add Note"];
  return (
    <div className="flex items-center gap-2">
      {buttons.map((b) => {
        const isPrimary = b === "Add Note";
        return (
          <div
            key={b}
            className={`inline-flex h-11 w-[110px] items-center justify-center rounded-lg bg-white ${BTN_SHADOW} text-[12.5px] ${
              isPrimary
                ? "font-bold text-petrol-700"
                : "font-semibold text-petrol-700"
            }`}
          >
            {b}
          </div>
        );
      })}
      <div className="ml-auto">
        <div
          className={`inline-flex h-11 w-[110px] items-center justify-center rounded-lg bg-[#b91c1c] text-[12.5px] font-semibold text-white ${BTN_SHADOW}`}
        >
          End Call
        </div>
      </div>
    </div>
  );
}

export const OUTCOME_CHIPS = [
  "Interested",
  "Callback Requested",
  "Not Interested",
  "Wrong Number",
  "Do Not Contact",
];

export function OutcomeRow({ selected = null }: { selected?: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OUTCOME_CHIPS.map((c) => {
        const isSelected = c === selected;
        return (
          <div
            key={c}
            className={`inline-flex h-11 min-w-[110px] items-center justify-center rounded-lg px-3 text-[12px] font-semibold tracking-tight ${
              isSelected
                ? `bg-white text-petrol-700 ${BTN_SHADOW}`
                : "bg-transparent text-white ring-1 ring-inset ring-white/30"
            }`}
          >
            {c}
          </div>
        );
      })}
    </div>
  );
}

export function QuickNoteInput() {
  return (
    <div className="mt-3 border-b border-white/30 pb-2">
      <div className="flex items-center gap-2">
        <NoteIcon className="h-3.5 w-3.5 text-white/65" />
        <span className="text-[12px] text-white/70">Add a quick note...</span>
        <span className="ml-auto text-[10.5px] tabular-nums text-white/45">
          {NOTE_TIMESTAMP}
        </span>
      </div>
    </div>
  );
}

export function SkipFollowUpToggle() {
  return (
    <div className="mt-4 flex items-center gap-2">
      <div className="flex h-4 w-7 items-center rounded-full bg-white/20 p-0.5">
        <div className="h-3 w-3 rounded-full bg-white/70" />
      </div>
      <span className="text-[11.5px] text-white/75">Skip follow up this call</span>
    </div>
  );
}

export function CountdownBanner({
  nextName,
  nextRelationship,
  countdown,
}: {
  nextName: string;
  nextRelationship: string;
  countdown: string;
}) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-petrol-900 px-7 py-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/65 leading-none">
        Next
      </span>
      <span className="text-[14px] font-medium leading-none text-white">{nextName}</span>
      <span className="text-[12px] leading-none text-white/65">{nextRelationship}</span>
      <span className="text-white/30">·</span>
      <span className="font-mono text-[16px] font-medium tabular-nums leading-none text-white">
        {countdown}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <div className={`inline-flex h-9 w-[110px] items-center justify-center rounded-lg bg-white text-[14px] font-medium leading-none text-petrol-700 ${BTN_SHADOW}`}>
          Dial Now
        </div>
        <div className="inline-flex h-9 w-[110px] items-center justify-center rounded-lg bg-white/15 text-[14px] font-medium leading-none text-white">
          Skip
        </div>
      </div>
    </div>
  );
}

export function FollowUpToast() {
  return (
    <div
      className={`absolute right-4 top-4 z-40 flex items-center gap-3 rounded-lg bg-white px-3.5 py-2.5 ${CARD_SHADOW}`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-petrol-100">
        <CheckIcon className="h-3 w-3 text-petrol-700" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[11.5px] font-semibold text-ink">
          Follow Up Email Queued
        </span>
        <span className="text-[10.5px] text-gray-500">Sends in 5s</span>
      </div>
      <span className="ml-3 cursor-pointer text-[11.5px] font-semibold text-petrol-700 underline decoration-petrol-300 underline-offset-2">
        Undo
      </span>
    </div>
  );
}

export function RightPanel({ lead, overlay }: { lead: Lead; overlay?: "timeline" }) {
  if (overlay === "timeline") {
    return <TimelinePanel lead={lead} />;
  }
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[12px] bg-white ${CARD_SHADOW}`}>
      <PanelSection title="Case Details">
        <CaseDetailsContent lead={lead} />
      </PanelSection>
      <div className={SECTION_DIVIDER} />
      <PanelSection
        title="Latest Activity"
        trailing={<TimelineLink />}
      >
        <ActivityContent lead={lead} />
      </PanelSection>
      <div className={SECTION_DIVIDER} />
      <PanelSection
        title={`Contact Tree`}
        trailing={
          <span className="text-[11px] font-medium text-gray-400">
            {lead.contacts.filter((c) => c.callable).length} Callable ·{" "}
            {lead.contacts.filter((c) => !c.callable).length} Reference
          </span>
        }
      >
        <div className="max-h-[300px] overflow-y-auto pr-1">
          <ContactList contacts={lead.contacts} />
        </div>
      </PanelSection>
    </div>
  );
}

function PanelSection({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-5">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-semibold tracking-tight text-ink">
          {title}
        </div>
        {trailing}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CaseDetailsContent({ lead }: { lead: Lead }) {
  const rows: [string, string][] = [
    ["Case Number", lead.estate.caseNumber],
    ["County", lead.estate.county],
    ["Sale Type", lead.estate.saleType],
    ["Sale Date", lead.estate.saleDate],
    ["Time Since Sale", lead.estate.timeSinceSale],
    ["Closing Bid", lead.estate.closingBid],
    ["Net to Firm", lead.netToFirm],
    ["Recovery Fee", lead.recoveryFee],
    ["Owner Status", lead.estate.ownerStatus],
    ["Attorney", lead.estate.attorney],
  ];
  return (
    <dl className="space-y-1.5 text-[11.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className="text-[11px] font-medium text-gray-500">{k}</dt>
          <dd className="text-right font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ActivityContent({ lead }: { lead: Lead }) {
  return (
    <ul className="space-y-2">
      {lead.activity.slice(0, 3).map((a, i) => (
        <li key={a.when} className="flex items-baseline gap-2.5">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
              i === 0 ? "bg-petrol-500" : "bg-gray-300"
            }`}
          />
          <div className="flex-1">
            <div
              className={`text-[11.5px] ${
                i === 0 ? "font-medium text-ink" : "text-gray-700"
              }`}
            >
              {a.what}
            </div>
            <div className="text-[10px] tabular-nums text-gray-400">
              {a.when}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TimelineLink() {
  return (
    <a
      href="#"
      className="cursor-pointer text-[10.5px] font-semibold text-petrol-700 hover:underline"
    >
      View Timeline →
    </a>
  );
}

function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="space-y-2.5">
      {contacts.map((c) => (
        <ContactRow key={c.name} contact={c} />
      ))}
    </div>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const primary = contact.phones[0];
  const hasMulti = contact.phones.length > 1;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11.5px] font-semibold ${
                contact.active ? "text-petrol-700" : "text-ink"
              }`}
            >
              {contact.name}
            </span>
            {!contact.callable && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Reference
              </span>
            )}
          </div>
          <div className="text-[10.5px] text-gray-500">{contact.relationship}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {contact.callable ? (
            <PhoneIcon className="h-3 w-3 text-petrol-700" />
          ) : (
            <DocIcon className="h-3 w-3 text-gray-400" />
          )}
          <span className="font-mono text-[10.5px] text-gray-700">{primary.number}</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            {primary.type}
          </span>
          {hasMulti && <ChevronIcon className="h-3 w-3 text-gray-400" />}
        </div>
      </div>
    </div>
  );
}

function TimelinePanel({ lead }: { lead: Lead }) {
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[12px] bg-white ${CARD_SHADOW}`}>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
        <div>
          <div className="text-[12.5px] font-semibold tracking-tight text-ink">
            Activity Timeline
          </div>
          <div className="mt-0.5 text-[10.5px] text-gray-500">{lead.title}</div>
        </div>
        <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
          ×
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-0 overflow-y-auto p-4">
        {lead.activity.map((a, i) => (
          <TimelineRow key={`${a.when}-${i}`} activity={a} first={i === 0} last={i === lead.activity.length - 1} />
        ))}
      </div>
    </div>
  );
}

function TimelineRow({ activity, last }: { activity: Activity; first?: boolean; last?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex w-6 flex-col items-center">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-petrol-100 text-petrol-700">
          <ActivityIcon kind={activity.kind} className="h-3 w-3" />
        </div>
        {!last && <div className="my-1 w-px flex-1 bg-gray-200" />}
      </div>
      <div className={`flex-1 ${last ? "" : "pb-3"}`}>
        <div className="text-[11.5px] font-medium text-ink">{activity.what}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-500">
          <span className="tabular-nums">{activity.when}</span>
          {activity.author && (
            <>
              <span className="text-gray-300">·</span>
              <span>{activity.author}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ kind, className }: { kind: Activity["kind"]; className?: string }) {
  if (kind === "call") return <PhoneIcon className={className} />;
  if (kind === "letter" || kind === "mail") return <MailIcon className={className} />;
  return <SystemIcon className={className} />;
}

export function QueueHeader({
  position,
  total = QUEUE_TOTAL,
}: {
  position?: number;
  total?: number;
}) {
  return (
    <div className="text-[12px] font-semibold tracking-tight text-ink">
      Lead {position ?? QUEUE_POSITION} of {total}
    </div>
  );
}

export function QueueSearch() {
  return (
    <div
      className="flex h-9 items-center rounded-lg px-3"
      style={{ background: "#F5F5F5" }}
    >
      <SearchIcon className="h-3 w-3 text-gray-400" />
      <span className="ml-2 text-[11.5px] text-gray-400">
        Search or jump to position
      </span>
      <div
        className="ml-auto rounded bg-white px-1.5 py-0.5 text-[9.5px] font-semibold text-gray-500"
        title="Press / to focus"
      >
        /
      </div>
    </div>
  );
}

export function QueueList({ items }: { items: QueueItem[] }) {
  return (
    <div className="dialer-queue-scroll flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
      {items.map((q, i) => (
        <QueueRow key={q.id} item={q} position={i + 1} />
      ))}
    </div>
  );
}

function QueueRow({ item, position }: { item: QueueItem; position: number }) {
  const active = item.state === "active";
  const done = item.state === "done";
  return (
    <div
      className={`rounded-lg px-2.5 py-2 ${
        active ? "bg-petrol-700 text-white" : done ? "" : "hover:bg-gray-100"
      } ${done ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`w-4 shrink-0 text-right text-[9.5px] font-semibold tabular-nums ${
            active ? "text-white/60" : "text-gray-400"
          }`}
        >
          {done ? <CheckIcon className="ml-auto h-3 w-3 text-petrol-500" /> : position}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[11.5px] font-semibold ${
              done ? "line-through" : ""
            } ${active ? "text-white" : "text-ink"}`}
          >
            {item.name}
          </div>
          <div
            className={`truncate text-[10px] ${
              active ? "text-white/75" : "text-gray-500"
            } ${done ? "line-through" : ""}`}
          >
            {item.relationship}
          </div>
          <div
            className={`mt-0.5 truncate text-[9.5px] ${
              active ? "text-white/55" : "text-gray-400"
            } ${done ? "line-through" : ""}`}
          >
            {item.surplus} · {item.city}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShortcutHelpFab() {
  return (
    <div
      className={`absolute bottom-4 right-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-[12px] font-semibold text-petrol-700 ${CARD_SHADOW}`}
      title="Keyboard shortcuts (?)"
    >
      ?
    </div>
  );
}

export function QueueScrollStyle() {
  return (
    <style>
      {`.dialer-queue-scroll{scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent;}
        .dialer-queue-scroll::-webkit-scrollbar{width:4px;}
        .dialer-queue-scroll::-webkit-scrollbar-track{background:transparent;}
        .dialer-queue-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px;}`}
    </style>
  );
}

function TrendIcon({
  direction,
  className,
}: {
  direction: "up" | "flat" | "down";
  className?: string;
}) {
  if (direction === "up") {
    return (
      <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === "down") {
    return (
      <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h6" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L13.5 13.5" strokeLinecap="round" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3h10v10H3z" />
      <path d="M5.5 6h5M5.5 9h3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.5 2.5h2.7l1 3.2-1.5 1c.6 1.5 1.8 2.7 3.3 3.3l1-1.5 3.2 1v2.7c0 .6-.5 1-1 1A11 11 0 0 1 2.5 3.5c0-.5.5-1 1-1z" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 1.5h5l3 3V14a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V2a.5.5 0 0 1 .5-.5z" />
      <path d="M9 1.5V5h3" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 4l3 2-3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.5 6.5L5 9l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3.5" width="12" height="9" rx="1" />
      <path d="M2.5 4.5l5.5 4 5.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="5" />
      <path d="M8 5v3l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { PhoneIcon, DocIcon, ChevronIcon, CheckIcon, SearchIcon, NoteIcon, MailIcon, SystemIcon };
