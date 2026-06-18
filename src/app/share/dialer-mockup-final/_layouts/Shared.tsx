import {
  CANVAS_W,
  CANVAS_H,
  SESSION_STATS,
  QUEUE_TOTAL,
  QUEUE_POSITION,
  NEXT_LEAD,
  AI_SUMMARY,
  ESTATE,
  CURRENT_LEAD,
  CASE_TYPE_LABELS,
  NOTE_PREFILL,
} from "../_data";

export const PETROL_GRADIENT =
  "bg-[linear-gradient(135deg,#04261c_0%,#0a3b2c_45%,#13644e_100%)]";

export function CanvasFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden bg-canvas font-sans text-ink"
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

export function StatsStrip() {
  return (
    <div className="flex items-center gap-7">
      {SESSION_STATS.map((s) => (
        <div
          key={s.label}
          className="flex flex-col"
          title={s.tooltip}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              {s.label}
            </span>
            <span className="text-[15px] font-semibold tabular-nums text-ink">
              {s.value}
            </span>
            {s.pulse && (
              <span className="relative ml-0.5 flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petrol-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-petrol-500" />
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <TrendIcon
              direction={s.direction}
              className={
                s.direction === "up"
                  ? "h-2.5 w-2.5 text-petrol-500"
                  : "h-2.5 w-2.5 text-gray-400"
              }
            />
            <span
              className={`text-[9.5px] ${
                s.direction === "up" ? "text-petrol-500" : "text-gray-500"
              }`}
            >
              {s.trend}
            </span>
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
  const dot = state === "live" ? "bg-petrol-300" : "bg-white/35";
  const label = state === "live" ? "Connected" : "Call Ended";
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {state === "live" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petrol-300 opacity-60" />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/90">
        {label}
      </span>
      <span className="font-mono text-[12.5px] tabular-nums text-white">
        {timer}
      </span>
    </div>
  );
}

export function CaseTypeChip() {
  const label = CASE_TYPE_LABELS[CURRENT_LEAD.caseType];
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
      {label}
      <span className="mx-1.5 text-white/40">·</span>
      <span className="text-white/85">
        Contact {CURRENT_LEAD.contactIndex} of {CURRENT_LEAD.contactTotal}
      </span>
    </span>
  );
}

export function NewEstateFlashChip() {
  return (
    <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      New Estate
      <span className="text-white/45">·</span>
      <span className="text-white/85">Hayes → Crockett</span>
    </span>
  );
}

export function HeroDivider() {
  return <div className="my-5 h-px w-full bg-white/20" />;
}

export function Control({
  label,
  intent = "secondary",
  size = "md",
}: {
  label: string;
  intent?: "secondary" | "primary" | "danger";
  size?: "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-11 px-6 text-[13px]" : "h-9 px-4 text-[12.5px]";
  const intentClass =
    intent === "danger"
      ? "bg-[#b91c1c] text-white"
      : intent === "primary"
      ? "bg-white text-petrol-700"
      : "bg-white/20 text-white";
  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg font-semibold tracking-tight ${sizeClass} ${intentClass}`}
    >
      {label}
    </div>
  );
}

export const DISPOSITION_CHIPS = [
  "Interested",
  "Callback Requested",
  "Not Interested",
  "Wrong Number",
  "Do Not Contact",
];

export function DispositionRow({
  selected = null,
}: {
  selected?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DISPOSITION_CHIPS.map((c) => {
        const isSelected = c === selected;
        const cls = isSelected
          ? "bg-white text-petrol-700"
          : "bg-transparent text-white ring-1 ring-inset ring-white/30";
        return (
          <div
            key={c}
            className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-[12px] font-semibold tracking-tight ${cls}`}
          >
            {c}
          </div>
        );
      })}
    </div>
  );
}

export function DispositionHeader() {
  return (
    <div className="mb-3">
      <div className="text-[15px] font-semibold tracking-tight text-white">
        Disposition
      </div>
      <div className="text-[11.5px] text-white/65">How did the call go?</div>
    </div>
  );
}

export function QuickNoteInput() {
  return (
    <div className="mt-3 flex h-10 items-center gap-2 rounded-lg bg-white/8 px-3 ring-1 ring-inset ring-white/15">
      <NoteIcon className="h-3.5 w-3.5 text-white/55" />
      <span className="text-[11.5px] text-white/55">
        Add a quick note...
      </span>
      <span className="ml-auto text-[10.5px] tabular-nums text-white/45">
        {NOTE_PREFILL}
      </span>
    </div>
  );
}

export function CountdownBanner() {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-petrol-900 px-7 py-2.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
        Next
      </span>
      <span className="text-[13px] font-semibold text-white">
        {NEXT_LEAD.name}
      </span>
      <span className="text-[11px] text-white/65">{NEXT_LEAD.relationship}</span>
      <span className="text-white/30">·</span>
      <span className="font-mono text-[14px] font-semibold tabular-nums text-white">
        {NEXT_LEAD.countdown}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <div className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-4 text-[12px] font-semibold text-petrol-700">
          Dial Now
        </div>
        <div className="inline-flex h-8 items-center justify-center rounded-lg bg-white/15 px-4 text-[12px] font-semibold text-white">
          Skip
        </div>
      </div>
    </div>
  );
}

export function AiSummary({ dim = false }: { dim?: boolean }) {
  return (
    <div className={dim ? "opacity-70" : ""}>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
            What You Already Know
          </span>
          <span className="text-[10px] text-white/55">
            {AI_SUMMARY.generated}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
            <SparkIcon className="h-2.5 w-2.5" />
            AI Summary · {AI_SUMMARY.source}
          </div>
          <RefreshIcon className="h-3 w-3 text-white/55" />
        </div>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {AI_SUMMARY.bullets.slice(0, 3).map((b, i) => (
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

export function FinancialBlock() {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
        Net to Firm
      </span>
      <span className="text-[32px] font-semibold tabular-nums leading-none">
        {CURRENT_LEAD.netToFirm}
      </span>
      <span className="mt-1 text-[10px] text-white/55">
        Case {CURRENT_LEAD.leadId}
      </span>
    </div>
  );
}

export function QueueHeaderStats() {
  return (
    <div className="text-[10.5px] font-medium text-gray-500">
      <span className="font-semibold text-ink">
        {QUEUE_POSITION} of {QUEUE_TOTAL}
      </span>{" "}
      Leads · 47 Dials · 9 Connects · 19% Rate
    </div>
  );
}

export function QueueSearch() {
  return (
    <div className="flex h-8 items-center rounded-lg bg-gray-50 px-2.5 ring-1 ring-inset ring-gray-200">
      <SearchIcon className="h-3 w-3 text-gray-400" />
      <span className="ml-1.5 text-[11px] text-gray-400">
        Search or jump to position
      </span>
      <kbd className="ml-auto rounded bg-white px-1.5 py-0.5 text-[9.5px] font-semibold text-gray-500 ring-1 ring-inset ring-gray-200">
        /
      </kbd>
    </div>
  );
}

export function EstateFactsCard() {
  const rows = [
    ["Case Number", ESTATE.caseNumber],
    ["County", ESTATE.county],
    ["Tax Sale Date", ESTATE.taxSaleDate],
    ["Time Since Sale", ESTATE.monthsSinceSale],
    ["Closing Bid", ESTATE.closingBid],
    ["Net to Firm", ESTATE.netToFirm],
    ["Recovery Fee", ESTATE.recoveryFee],
    ["Owner Status", ESTATE.ownerStatus],
    ["Attorney", ESTATE.attorney],
  ];
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
        Estate Detail
      </div>
      <dl className="mt-2.5 space-y-1.5 text-[11.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-gray-500">{k}</dt>
            <dd className="text-right font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function LatestActivityCard({
  events,
}: {
  events: { when: string; what: string }[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
          Latest Activity
        </div>
        <span className="text-[10px] tabular-nums text-gray-400">
          {events[0].when.replace(", 2026", "")}
        </span>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2 rounded-md bg-gray-50 px-3 py-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-petrol-500" />
        <div className="flex-1 text-[11.5px] font-medium text-ink">
          {events[0].what}
        </div>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {events.slice(1, 4).map((e) => (
          <li key={e.when} className="flex items-baseline gap-2 text-[10.5px]">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
            <span className="flex-1 text-gray-700">{e.what}</span>
            <span className="tabular-nums text-gray-400">
              {e.when.replace(", 2026", "")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContactTreeCard({
  contacts,
}: {
  contacts: {
    name: string;
    relationship: string;
    phone: string;
    active?: boolean;
  }[];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
          Contact Tree
        </div>
        <span className="text-[10px] text-gray-400">{contacts.length} Members</span>
      </div>
      <div className="mt-2 space-y-2">
        {contacts.map((c) => (
          <div key={c.name} className="text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`font-medium ${
                  c.active ? "text-petrol-700" : "text-ink"
                }`}
              >
                {c.name}
              </span>
              <span className="font-mono text-[10.5px] text-gray-500">
                {c.phone}
              </span>
            </div>
            <div className="text-[10px] text-gray-500">{c.relationship}</div>
          </div>
        ))}
      </div>
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

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M14 8a6 6 0 11-2.1-4.6" strokeLinecap="round" />
      <path d="M14 2.5V5h-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L13.5 13.5" strokeLinecap="round" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 3h10v10H3z" />
      <path d="M5.5 6h5M5.5 9h3" strokeLinecap="round" />
    </svg>
  );
}
