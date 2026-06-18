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
} from "../_data";

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

export function StatsStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "gap-5" : "gap-7"}`}>
      {SESSION_STATS.map((s) => (
        <div key={s.label} className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              {s.label}
            </span>
            <span className="text-[14px] font-semibold tabular-nums text-ink">
              {s.value}
            </span>
            {s.pulse && (
              <span className="relative ml-0.5 flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petrol-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-petrol-500" />
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-0.5">
            {s.direction === "up" ? (
              <UpChevron className="h-2.5 w-2.5 text-petrol-500" />
            ) : (
              <FlatDash className="h-2.5 w-2.5 text-gray-400" />
            )}
            <span className="text-[9.5px] text-gray-500">{s.target}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LiveDot({ tone = "petrol" }: { tone?: "petrol" | "light" }) {
  const color = tone === "light" ? "bg-white" : "bg-petrol-300";
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`}
      />
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${color}`}
      />
    </span>
  );
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
      : "bg-white/12 text-white";
  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg font-semibold tracking-tight ${sizeClass} ${intentClass}`}
    >
      {label}
    </div>
  );
}

export const DISPOSITION_CHIPS = [
  { label: "Interested", intent: "positive" as const },
  { label: "Callback Requested", intent: "neutralStrong" as const },
  { label: "Not Interested", intent: "neutral" as const },
  { label: "Wrong Number", intent: "neutral" as const },
  { label: "Do Not Contact", intent: "danger" as const },
];

export function DispositionRow({
  size = "md",
  onDark = false,
}: {
  size?: "md" | "lg";
  onDark?: boolean;
}) {
  const sizeClass =
    size === "lg" ? "h-11 px-5 text-[13px]" : "h-9 px-4 text-[12px]";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DISPOSITION_CHIPS.map((c) => {
        let cls = "";
        if (c.intent === "positive") {
          cls = "bg-petrol-500 text-white";
        } else if (c.intent === "neutralStrong") {
          cls = onDark
            ? "bg-white/15 text-white"
            : "bg-petrol-100 text-petrol-700";
        } else if (c.intent === "neutral") {
          cls = onDark
            ? "bg-white/8 text-white/85"
            : "bg-gray-100 text-gray-700";
        } else if (c.intent === "danger") {
          cls = "bg-[#b91c1c] text-white";
        }
        return (
          <div
            key={c.label}
            className={`inline-flex items-center justify-center rounded-lg font-semibold tracking-tight ${sizeClass} ${cls}`}
          >
            {c.label}
          </div>
        );
      })}
    </div>
  );
}

export function CountdownBanner({
  onDark = false,
}: {
  onDark?: boolean;
}) {
  const bg = onDark
    ? "bg-white/10 ring-1 ring-inset ring-white/15"
    : "bg-petrol-700";
  const labelColor = onDark ? "text-white/70" : "text-white/75";
  const valueColor = onDark ? "text-white" : "text-white";
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${bg}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${labelColor}`}
        >
          Next
        </span>
        <span className={`text-[13px] font-semibold ${valueColor}`}>
          {NEXT_LEAD.name}
        </span>
        <span className="text-[10.5px] text-white/70">
          {NEXT_LEAD.relationship}
        </span>
      </div>
      <span className="text-white/30">·</span>
      <span className="font-mono text-[14px] font-semibold tabular-nums text-white">
        {NEXT_LEAD.countdown}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <div className="inline-flex h-8 items-center justify-center rounded-lg bg-white/10 px-3 text-[12px] font-semibold text-white">
          Skip
        </div>
        <div className="inline-flex h-8 items-center justify-center rounded-lg bg-white px-4 text-[12px] font-semibold text-petrol-700">
          Dial Now
        </div>
      </div>
    </div>
  );
}

export function SameEstateChip({ onDark = true }: { onDark?: boolean }) {
  const cls = onDark
    ? "bg-white/10 text-white ring-1 ring-inset ring-white/20"
    : "bg-petrol-100 text-petrol-700";
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${cls}`}
    >
      <span>Same Estate</span>
      <span className={onDark ? "text-white/60" : "text-petrol-700/70"}>·</span>
      <span>
        Contact {CURRENT_LEAD.contactIndex} of {CURRENT_LEAD.contactTotal}
      </span>
    </div>
  );
}

export function NewEstateFlashChip() {
  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-petrol-700 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_-4px_rgba(13,75,58,0.55)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      New Estate
      <span className="text-white/60">·</span>
      <span>Hayes → Crockett</span>
    </div>
  );
}

export function AiSummary({
  variant = "dark",
  compact = false,
}: {
  variant?: "dark" | "light";
  compact?: boolean;
}) {
  const isDark = variant === "dark";
  const surface = isDark
    ? "bg-white/8 ring-1 ring-inset ring-white/12"
    : "bg-petrol-50 ring-1 ring-inset ring-petrol-200";
  const headLabel = isDark
    ? "text-white/70"
    : "text-petrol-700";
  const headSecondary = isDark ? "text-white/55" : "text-gray-500";
  const body = isDark ? "text-white/90" : "text-ink";
  const dotColor = isDark ? "bg-white/45" : "bg-petrol-500";
  const visibleBullets = compact ? 2 : AI_SUMMARY.bullets.length;
  return (
    <div className={`rounded-lg ${surface} px-4 py-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${headLabel}`}
          >
            What You Already Know
          </span>
          <span className={`text-[10px] ${headSecondary}`}>
            {AI_SUMMARY.generated}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] ${
              isDark ? "bg-white/10 text-white/85" : "bg-petrol-100 text-petrol-700"
            }`}
          >
            <SparkIcon className="h-2.5 w-2.5" />
            AI Summary · {AI_SUMMARY.source}
          </div>
          <RefreshIcon
            className={`h-3 w-3 ${isDark ? "text-white/55" : "text-gray-400"}`}
          />
        </div>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {AI_SUMMARY.bullets.slice(0, visibleBullets).map((b, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${dotColor}`} />
            <span
              className={`flex-1 text-[11.5px] leading-snug ${body}`}
            >
              {b}
            </span>
          </li>
        ))}
      </ul>
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
    <div className="relative flex h-8 items-center rounded-lg bg-gray-50 px-2.5 ring-1 ring-inset ring-gray-200">
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

export function EstateFactsList({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
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
  const isLight = variant === "light";
  return (
    <dl className="space-y-1.5 text-[11.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3">
          <dt className={isLight ? "text-gray-500" : "text-white/65"}>{k}</dt>
          <dd
            className={`text-right font-medium ${
              isLight ? "text-ink" : "text-white"
            }`}
          >
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function UpChevron({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 7l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlatDash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h6" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
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

export const PETROL_GRADIENT =
  "bg-[linear-gradient(135deg,#04261c_0%,#0a3b2c_45%,#13644e_100%)]";
