import {
  CANVAS_W,
  CANVAS_H,
  SESSION_STATS,
  QUEUE_TOTAL,
  QUEUE_POSITION,
  CASE_TYPE_PREFIX,
  NOTE_TIMESTAMP,
  type Lead,
  type QueueItem,
  type Contact,
} from "../_data";

export const PETROL_GRADIENT =
  "bg-[linear-gradient(135deg,#04261c_0%,#0a3b2c_45%,#13644e_100%)]";

export const CARD_SHADOW =
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]";

export const PAGE_BG = "bg-[#FAFAFA]";

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
    <div className={`flex h-14 items-center gap-5 border-b border-gray-200 bg-white px-6`}>
      <Logomark />
      <div className="ml-2 flex items-center gap-2">
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
        <div className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-gray-100 px-4 text-[12px] font-semibold text-ink hover:bg-gray-200">
          Pause Session
        </div>
        <div className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-[#b91c1c] px-4 text-[12px] font-semibold text-white">
          End Session
        </div>
      </div>
    </div>
  );
}

export function StatsStrip() {
  return (
    <div className="flex items-center gap-8">
      {SESSION_STATS.map((s) => (
        <div key={s.label} className="flex flex-col" title={s.tooltip}>
          <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            {s.label}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[18px] font-semibold tabular-nums text-ink">
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
  caseType,
  index,
  total,
}: {
  caseType: keyof typeof CASE_TYPE_PREFIX;
  index: number;
  total: number;
}) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
      {CASE_TYPE_PREFIX[caseType]}
      <span className="mx-1.5 text-white/40">·</span>
      <span className="text-white/85">
        Contact {index} of {total}
      </span>
    </span>
  );
}

export function HeroDivider() {
  return <div className="my-5 h-px w-full bg-white/20" />;
}

export function FinancialStack({ lead }: { lead: Lead }) {
  const rows = [
    ["RECOVERY FEE", lead.recoveryFee],
    ["SURPLUS", lead.surplus],
    ["NET TO FIRM", lead.netToFirm],
  ];
  return (
    <div className="flex flex-col items-end">
      <div className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1.5">
        {rows.map(([label, value], i) => (
          <div key={label} className="contents">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65 leading-tight">
              {label}
            </div>
            <div
              className={`text-right font-semibold tabular-nums leading-tight ${
                i === 2 ? "text-[20px] text-white" : "text-[15px] text-white/90"
              }`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-white/55">Case {lead.id}</div>
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
  const buttons = ["Mute", "Keypad", "Hold", "Transfer"];
  return (
    <div className="flex items-center gap-2">
      {buttons.map((b) => (
        <div
          key={b}
          className="inline-flex h-11 w-[110px] items-center justify-center rounded-lg bg-white/20 text-[12.5px] font-semibold text-white"
        >
          {b}
        </div>
      ))}
      <div className="inline-flex h-11 w-[110px] items-center justify-center rounded-lg bg-white text-[12.5px] font-semibold text-petrol-700">
        Add Note
      </div>
      <div className="ml-auto inline-flex h-11 w-[110px] items-center justify-center rounded-lg bg-[#b91c1c] text-[12.5px] font-semibold text-white">
        End Call
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
                ? "bg-white text-petrol-700"
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
    <div className="mt-3 flex h-11 items-center gap-2 rounded-lg bg-white/20 px-3.5">
      <NoteIcon className="h-3.5 w-3.5 text-white/65" />
      <span className="text-[11.5px] text-white/65">Add a quick note...</span>
      <span className="ml-auto text-[10.5px] tabular-nums text-white/45">
        {NOTE_TIMESTAMP}
      </span>
    </div>
  );
}

export function SkipFollowUpToggle() {
  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="flex h-4 w-7 items-center rounded-full bg-white/20 p-0.5">
        <div className="h-3 w-3 rounded-full bg-white/70" />
      </div>
      <span className="text-[11.5px] text-white/75">Skip follow up this call</span>
    </div>
  );
}

export function NoteExpansion() {
  return (
    <div className="mt-3 rounded-lg bg-white/20 px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] text-white/75">
        <NoteIcon className="h-3.5 w-3.5 text-white/65" />
        <span>Type quick note...</span>
        <span className="ml-auto text-[10px] tabular-nums text-white/55">
          Enter to save · Esc to cancel
        </span>
      </div>
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
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-petrol-900 px-7 py-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
        Next
      </span>
      <span className="text-[13px] font-semibold text-white">{nextName}</span>
      <span className="text-[11px] text-white/65">{nextRelationship}</span>
      <span className="text-white/30">·</span>
      <span className="font-mono text-[14px] font-semibold tabular-nums text-white">
        {countdown}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <div className="inline-flex h-9 w-[110px] items-center justify-center rounded-lg bg-white text-[12px] font-semibold text-petrol-700">
          Dial Now
        </div>
        <div className="inline-flex h-9 w-[110px] items-center justify-center rounded-lg bg-white/15 text-[12px] font-semibold text-white">
          Skip
        </div>
      </div>
    </div>
  );
}

export function CardShell({
  title,
  trailing,
  children,
  className = "",
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[12px] bg-white p-4 ${CARD_SHADOW} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold tracking-tight text-ink">
          {title}
        </div>
        {trailing}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function CaseDetailsCard({ lead }: { lead: Lead }) {
  const rows: [string, string][] = [
    ["CASE NUMBER", lead.estate.caseNumber],
    ["COUNTY", lead.estate.county],
    ["SALE TYPE", lead.estate.saleType],
    ["SALE DATE", lead.estate.saleDate],
    ["TIME SINCE SALE", lead.estate.timeSinceSale],
    ["CLOSING BID", lead.estate.closingBid],
    ["NET TO FIRM", lead.netToFirm],
    ["RECOVERY FEE", lead.recoveryFee],
    ["OWNER STATUS", lead.estate.ownerStatus],
    ["ATTORNEY", lead.estate.attorney],
  ];
  return (
    <CardShell title="Case Details">
      <dl className="space-y-1.5 text-[11.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              {k}
            </dt>
            <dd className="text-right font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </CardShell>
  );
}

export function LatestActivityCard({ lead }: { lead: Lead }) {
  return (
    <CardShell
      title="Latest Activity"
      trailing={
        <span className="cursor-pointer text-[10.5px] font-semibold text-petrol-700 hover:underline">
          View Timeline
        </span>
      }
    >
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
    </CardShell>
  );
}

export function ContactTreeCard({ lead }: { lead: Lead }) {
  const callable = lead.contacts.filter((c) => c.callable).length;
  const reference = lead.contacts.length - callable;
  return (
    <CardShell title={`Contact Tree (${callable} Callable, ${reference} Reference)`}>
      <div className="space-y-2.5">
        {lead.contacts.map((c) => (
          <ContactRow key={c.name} contact={c} />
        ))}
      </div>
    </CardShell>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const primary = contact.phones[0];
  const hasMulti = contact.phones.length > 1;
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
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

export function QueueHeader({
  position,
  total = QUEUE_TOTAL,
}: {
  position?: number;
  total?: number;
}) {
  return (
    <div className="text-[11px] font-semibold tracking-tight text-ink">
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

export function QueueList({
  items,
  size = "md",
}: {
  items: QueueItem[];
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
      {items.map((q, i) => (
        <QueueRow key={q.id} item={q} position={i + 1} size={size} />
      ))}
    </div>
  );
}

function QueueRow({
  item,
  position,
  size,
}: {
  item: QueueItem;
  position: number;
  size: "sm" | "md";
}) {
  const active = item.state === "active";
  const done = item.state === "done";
  const padding = size === "sm" ? "px-2 py-1.5" : "px-2.5 py-2";
  return (
    <div
      className={`rounded-lg ${padding} ${
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
      className="absolute bottom-4 right-4 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-[12px] font-semibold text-petrol-700 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
      title="Keyboard shortcuts (?)"
    >
      ?
    </div>
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

export { PhoneIcon, DocIcon, ChevronIcon, CheckIcon, SearchIcon, NoteIcon };
