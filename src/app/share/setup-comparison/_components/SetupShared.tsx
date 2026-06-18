export const SETUP_CANVAS_W = 1280;
export const SETUP_CANVAS_H = 880;

export const PETROL_GRADIENT_BTN =
  "bg-[linear-gradient(135deg,#13644e_0%,#0a3b2c_100%)]";

export const CARD_SHADOW =
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]";

export const BTN_SHADOW = "shadow-[0_1px_2px_rgba(0,0,0,0.08)]";

export const CTA_SHADOW = "shadow-[0_4px_12px_rgba(13,75,58,0.20)]";

export const DOT_BG =
  "bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:24px_24px]";

export const COUNTIES = [
  { name: "Cuyahoga", count: 28 },
  { name: "Lancaster", count: 12 },
  { name: "Franklin", count: 5 },
  { name: "Hamilton", count: 2 },
];

export const CASE_TYPES = [
  { label: "Estate", count: 28, active: true },
  { label: "Foreclosure", count: 17, active: true },
  { label: "Tax Sale Surplus", count: 2, active: false },
  { label: "Other", count: 0, active: false },
];

export const OUTCOME_TEMPLATES = [
  { outcome: "Interested", template: "Documentation Packet" },
  { outcome: "Callback Requested", template: "Callback Confirmation" },
  { outcome: "Not Interested", template: "Light Touch Follow Up" },
  { outcome: "Wrong Number", template: "None" },
  { outcome: "Do Not Contact", template: "Verification Required" },
];

export const PREVIEW_LEADS = [
  { name: "Cornelius J. Hayes Jr.", surplus: "$146K", relationship: "Son of Cornelius Sr.", city: "Cleveland OH" },
  { name: "Wallace Pemberton", surplus: "$217K", relationship: "Property Owner", city: "Lancaster PA" },
  { name: "Otis Crockett", surplus: "$89K", relationship: "Cousin of Heir", city: "Columbus OH" },
  { name: "Yolanda Beauchamp", surplus: "$112K", relationship: "Daughter of Heir", city: "Cleveland OH" },
  { name: "Reginald T. Whitfield", surplus: "$51K", relationship: "Relationship Unknown", city: "Cincinnati OH" },
  { name: "Trevor McKinley", surplus: "$34K", relationship: "Spouse of Owner", city: "Akron OH" },
];

export function SetupCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`relative font-sans text-ink ${DOT_BG} bg-white`}
      style={{ width: SETUP_CANVAS_W, height: SETUP_CANVAS_H }}
    >
      {children}
    </div>
  );
}

export function SetupHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-7 py-4">
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
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
          {eyebrow}
        </span>
        <span className="text-[12px] font-medium text-ink">{title}</span>
      </div>
    </div>
  );
}

export function LeadCountCallout({
  size = "lg",
  variant = "default",
}: {
  size?: "md" | "lg" | "xl";
  variant?: "default" | "petrol";
}) {
  const sizeCls =
    size === "xl"
      ? "text-[40px]"
      : size === "lg"
      ? "text-[32px]"
      : "text-[22px]";
  const colorCls = variant === "petrol" ? "text-petrol-700" : "text-petrol-700";
  return (
    <div className="flex flex-col">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        Selected Lead List
      </div>
      <div className={`mt-1 ${sizeCls} font-semibold leading-none tabular-nums ${colorCls}`}>
        47 Leads
        <span className="ml-2 text-[16px] font-medium text-petrol-500">
          · Est. 4h 12m
        </span>
      </div>
    </div>
  );
}

export function FilterChip({
  label,
  count,
  active,
  size = "md",
}: {
  label: string;
  count?: number;
  active: boolean;
  size?: "sm" | "md";
}) {
  const sizeCls =
    size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-[11.5px]";
  const activeCls = active
    ? "bg-petrol-700 text-white"
    : "bg-white text-gray-500 ring-1 ring-inset ring-gray-200";
  return (
    <span
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg font-semibold ${sizeCls} ${activeCls}`}
    >
      {label}
      {count !== undefined && (
        <span
          className={
            active ? "text-white/65" : "text-gray-400"
          }
        >
          {count}
        </span>
      )}
    </span>
  );
}

export function Slider({ start = 20, end = 85 }: { start?: number; end?: number }) {
  return (
    <div className="relative h-1.5 rounded-full bg-gray-200">
      <div
        className="absolute top-0 h-1.5 rounded-full bg-petrol-700"
        style={{ left: `${start}%`, right: `${100 - end}%` }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-petrol-700 ring-2 ring-white"
        style={{ left: `calc(${start}% - 6px)` }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-petrol-700 ring-2 ring-white"
        style={{ left: `calc(${end}% - 6px)` }}
      />
    </div>
  );
}

export function SingleSlider({ at = 30 }: { at?: number }) {
  return (
    <div className="relative h-1.5 rounded-full bg-gray-200">
      <div
        className="absolute left-0 top-0 h-1.5 rounded-full bg-petrol-700"
        style={{ width: `${at}%` }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-petrol-700 ring-2 ring-white"
        style={{ left: `calc(${at}% - 6px)` }}
      />
    </div>
  );
}

export function StartSessionCTA({
  label = "Start Session",
  subLabel,
  fullWidth = false,
}: {
  label?: string;
  subLabel?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`inline-flex h-14 cursor-pointer items-center justify-center rounded-lg text-[15px] font-semibold tracking-tight text-white ${PETROL_GRADIENT_BTN} ${CTA_SHADOW} ${
        fullWidth ? "w-full" : "w-[280px]"
      }`}
    >
      <span>{label}</span>
      {subLabel && (
        <span className="ml-2 text-[12.5px] font-medium text-white/75">
          {subLabel}
        </span>
      )}
      <span className="ml-2 text-white/85">→</span>
    </div>
  );
}

export function PreviewList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {PREVIEW_LEADS.slice(0, count).map((l, i) => (
        <div
          key={l.name}
          className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-inset ring-gray-200/70"
        >
          <span className="w-4 shrink-0 text-right text-[10px] font-semibold tabular-nums text-gray-400">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-ink">
              {l.name}
            </div>
            <div className="truncate text-[10.5px] text-gray-500">
              {l.relationship} · {l.city}
            </div>
          </div>
          <span className="text-[12px] font-semibold tabular-nums text-petrol-700">
            {l.surplus}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CountyChips() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COUNTIES.map((c) => (
        <FilterChip key={c.name} label={c.name} count={c.count} active size="sm" />
      ))}
    </div>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={`flex h-5 w-9 items-center rounded-full p-0.5 ${
        on ? "bg-petrol-700" : "bg-gray-200"
      }`}
    >
      <div
        className={`h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${
          on ? "ml-auto" : ""
        }`}
      />
    </div>
  );
}

export function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current - 1;
        const active = i === current - 1;
        return (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              active
                ? "w-10 bg-petrol-700"
                : done
                ? "w-1.5 bg-petrol-500"
                : "w-1.5 bg-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}

export function SectionIcon({
  kind,
  className = "h-4 w-4",
}: {
  kind: "phone" | "shield" | "clock" | "voicemail" | "mail" | "sms" | "filters" | "leads" | "check";
  className?: string;
}) {
  const stroke = "currentColor";
  if (kind === "phone")
    return (
      <svg className={className} viewBox="0 0 16 16" fill={stroke}>
        <path d="M3.5 2.5h2.7l1 3.2-1.5 1c.6 1.5 1.8 2.7 3.3 3.3l1-1.5 3.2 1v2.7c0 .6-.5 1-1 1A11 11 0 0 1 2.5 3.5c0-.5.5-1 1-1z" />
      </svg>
    );
  if (kind === "shield")
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5">
        <path d="M8 2l5 1.5v4c0 3-2 5.5-5 6.5-3-1-5-3.5-5-6.5v-4L8 2z" />
        <path d="M6 8l1.5 1.5L10.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (kind === "clock")
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5">
        <circle cx="8" cy="8" r="5.5" />
        <path d="M8 5v3l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (kind === "voicemail")
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5">
        <circle cx="4.5" cy="9" r="2" />
        <circle cx="11.5" cy="9" r="2" />
        <path d="M4.5 11h7" strokeLinecap="round" />
      </svg>
    );
  if (kind === "mail")
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5">
        <rect x="2" y="3.5" width="12" height="9" rx="1" />
        <path d="M2.5 4.5l5.5 4 5.5-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (kind === "sms")
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5">
        <path d="M3 3h10v8H8.5L5.5 13.5V11H3z" strokeLinejoin="round" />
      </svg>
    );
  if (kind === "filters")
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5">
        <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
      </svg>
    );
  if (kind === "leads")
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="1.5">
        <circle cx="6" cy="6" r="2.5" />
        <path d="M2.5 12c0-2 1.5-3 3.5-3s3.5 1 3.5 3" strokeLinecap="round" />
        <circle cx="11.5" cy="5" r="2" />
        <path d="M11.5 9c1.5 0 2.5 1 2.5 2.5" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M3 8L6.5 11.5 13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
      {children}
    </div>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[12px] bg-white p-5 ${CARD_SHADOW} ${className}`}>
      {children}
    </div>
  );
}
