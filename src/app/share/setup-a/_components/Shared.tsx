export const PETROL_GRADIENT_BTN =
  "bg-[linear-gradient(135deg,#13644e_0%,#0a3b2c_100%)]";

export const CARD_SHADOW =
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]";

export const BTN_SHADOW = "shadow-[0_1px_2px_rgba(0,0,0,0.08)]";

export const CTA_SHADOW = "shadow-[0_4px_12px_rgba(13,75,58,0.20)]";

export const DOT_BG =
  "bg-[radial-gradient(circle,rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:24px_24px]";

export type IconKind =
  | "list"
  | "map"
  | "building"
  | "file"
  | "kanban"
  | "phone"
  | "user"
  | "dollar"
  | "clock"
  | "shield"
  | "scale"
  | "voicemail"
  | "mail"
  | "note"
  | "check"
  | "settings"
  | "lightning";

export function SectionIcon({
  kind,
  className = "h-4 w-4",
}: {
  kind: IconKind;
  className?: string;
}) {
  const s = "currentColor";
  switch (kind) {
    case "list":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <path d="M3 4h10M3 8h10M3 12h6" strokeLinecap="round" />
        </svg>
      );
    case "map":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5 0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" />
          <circle cx="8" cy="6" r="1.5" />
        </svg>
      );
    case "building":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <rect x="3" y="3" width="10" height="11" />
          <path d="M6 6h1M9 6h1M6 9h1M9 9h1M6 12h4" strokeLinecap="round" />
        </svg>
      );
    case "file":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <path d="M4 2h5l3 3v9H4z" />
          <path d="M9 2v3h3" />
        </svg>
      );
    case "kanban":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <rect x="2" y="3" width="3" height="10" />
          <rect x="6.5" y="3" width="3" height="6" />
          <rect x="11" y="3" width="3" height="8" />
        </svg>
      );
    case "phone":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.5 2.5h2.7l1 3.2-1.5 1c.6 1.5 1.8 2.7 3.3 3.3l1-1.5 3.2 1v2.7c0 .6-.5 1-1 1A11 11 0 0 1 2.5 3.5c0-.5.5-1 1-1z" />
        </svg>
      );
    case "user":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <circle cx="8" cy="6" r="2.5" />
          <path d="M3 14c0-2.5 2-4 5-4s5 1.5 5 4" strokeLinecap="round" />
        </svg>
      );
    case "dollar":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <path d="M8 2v12M11 5c0-1.5-1.5-2.5-3-2.5S5 3.5 5 5s1 2 3 2.5S11 9 11 10.5s-1.5 2.5-3 2.5-3-1-3-2.5" strokeLinecap="round" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v3l2 1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <path d="M8 2l5 1.5v4c0 3-2 5.5-5 6.5-3-1-5-3.5-5-6.5v-4L8 2z" />
          <path d="M6 8l1.5 1.5L10.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "scale":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <path d="M8 2v12M3 5h10" strokeLinecap="round" />
          <path d="M5 5L3 9h4zM11 5L9 9h4z" strokeLinejoin="round" />
        </svg>
      );
    case "voicemail":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <circle cx="4.5" cy="9" r="2" />
          <circle cx="11.5" cy="9" r="2" />
          <path d="M4.5 11h7" strokeLinecap="round" />
        </svg>
      );
    case "mail":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <rect x="2" y="3.5" width="12" height="9" rx="1" />
          <path d="M2.5 4.5l5.5 4 5.5-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "note":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <path d="M3 3h10v10H3z" />
          <path d="M5.5 6h5M5.5 9h3" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="1.5">
          <circle cx="8" cy="8" r="2" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" strokeLinecap="round" />
        </svg>
      );
    case "lightning":
      return (
        <svg className={className} viewBox="0 0 16 16" fill="currentColor">
          <path d="M9 1L3 9h4v6l6-8H9z" />
        </svg>
      );
    case "check":
    default:
      return (
        <svg className={className} viewBox="0 0 16 16" fill="none" stroke={s} strokeWidth="2">
          <path d="M3 8L6.5 11.5 13 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
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

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[12px] bg-white p-5 ${CARD_SHADOW} ${className}`}>
      {children}
    </div>
  );
}

export function SectionLabel({
  icon,
  children,
  className = "",
}: {
  icon: IconKind;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-petrol-100 text-petrol-700">
        <SectionIcon kind={icon} className="h-3.5 w-3.5" />
      </span>
      <span className="text-[13px] font-semibold tracking-tight text-ink">
        {children}
      </span>
    </div>
  );
}

export function Checkbox({
  label,
  count,
  checked,
}: {
  label: string;
  count?: number;
  checked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 hover:bg-gray-50 px-1.5">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
          checked ? "bg-petrol-700 text-white" : "bg-white ring-1 ring-inset ring-gray-300"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M2.5 6.5L5 9l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-[12px] text-ink">{label}</span>
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
            checked
              ? "bg-petrol-100 text-petrol-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
    </label>
  );
}

export function Radio({
  label,
  selected,
  trailing,
}: {
  label: string;
  selected: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-gray-50">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
          selected ? "ring-petrol-700" : "ring-gray-300"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-petrol-700" />}
      </span>
      <span className="flex-1 text-[12px] text-ink">{label}</span>
      {trailing}
    </label>
  );
}

export function FilterChip({
  label,
  count,
  active,
}: {
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg h-7 px-2.5 text-[11px] font-semibold ${
        active
          ? "bg-petrol-700 text-white"
          : "bg-white text-gray-500 ring-1 ring-inset ring-gray-200"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={active ? "text-white/65" : "text-gray-400"}>
          {count}
        </span>
      )}
    </span>
  );
}

export function DualSlider({
  start = 25,
  end = 70,
}: {
  start?: number;
  end?: number;
}) {
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

export function FakeSelect({
  value,
  size = "md",
  disabled = false,
}: {
  value: string;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const h = size === "sm" ? "h-8" : "h-9";
  return (
    <div
      className={`flex ${h} items-center rounded-lg px-3 text-[11.5px] ${
        disabled ? "text-gray-400" : "text-ink"
      }`}
      style={{ background: "#F5F5F5", opacity: disabled ? 0.7 : 1 }}
    >
      <span className={`flex-1 truncate ${disabled ? "italic" : ""}`}>{value}</span>
      <span className="text-gray-400">▾</span>
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

export function ContinueButton({ label }: { label: string }) {
  return (
    <div
      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg px-6 text-[13px] font-semibold tracking-tight text-white bg-petrol-700 ${BTN_SHADOW} hover:bg-petrol-500`}
    >
      {label}
      <span className="ml-2 text-white/80">→</span>
    </div>
  );
}

export function BackButton() {
  return (
    <div
      className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-white px-5 text-[12.5px] font-semibold text-petrol-700 ${BTN_SHADOW}`}
    >
      ← Back
    </div>
  );
}

export function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "Pick Leads" },
    { num: 2, label: "Call Settings" },
    { num: 3, label: "Auto Follow Up" },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2.5">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${
              s.num < current
                ? "bg-petrol-500 text-white"
                : s.num === current
                ? "bg-petrol-700 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {s.num < current ? <SectionIcon kind="check" className="h-3 w-3" /> : s.num}
          </span>
          <span
            className={`text-[12.5px] font-semibold ${
              s.num === current ? "text-ink" : s.num < current ? "text-petrol-700" : "text-gray-400"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span
              className={`h-px w-6 ${
                s.num < current ? "bg-petrol-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
