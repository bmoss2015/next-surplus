import { CANVAS_W, CANVAS_H, SESSION_STATS } from "../_data";

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

export function StatChrome({
  align = "right",
  compact = false,
}: {
  align?: "left" | "right";
  compact?: boolean;
}) {
  const items = [
    { label: "Dials", value: String(SESSION_STATS.dials) },
    { label: "Connects", value: String(SESSION_STATS.connects) },
    { label: "Rate", value: SESSION_STATS.rate },
    { label: "Talk", value: SESSION_STATS.talk },
  ];
  return (
    <div
      className={`flex items-center ${compact ? "gap-4" : "gap-6"} ${
        align === "right" ? "ml-auto" : ""
      }`}
    >
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-1.5">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            {it.label}
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-ink">
            {it.value}
          </span>
        </div>
      ))}
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

export function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-petrol-300 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-petrol-300" />
    </span>
  );
}

export function ControlButton({
  label,
  intent = "neutral",
  size = "md",
}: {
  label: string;
  intent?: "neutral" | "danger" | "primary";
  size?: "md" | "lg";
}) {
  const intentClass =
    intent === "danger"
      ? "bg-[#b91c1c] text-white shadow-[0_4px_16px_-4px_rgba(185,28,28,0.55)]"
      : intent === "primary"
      ? "bg-white text-petrol-700 shadow-[0_4px_14px_-4px_rgba(13,75,58,0.35)]"
      : "bg-white/10 text-white ring-1 ring-inset ring-white/25";
  const sizeClass = size === "lg" ? "h-12 px-7 text-[13.5px]" : "h-10 px-5 text-[12.5px]";
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold tracking-tight ${sizeClass} ${intentClass}`}
    >
      {label}
    </div>
  );
}

export function Eyebrow({
  children,
  tone = "ink",
}: {
  children: React.ReactNode;
  tone?: "ink" | "petrol" | "gray" | "light";
}) {
  const cls =
    tone === "petrol"
      ? "text-petrol-700"
      : tone === "gray"
      ? "text-gray-500"
      : tone === "light"
      ? "text-white/70"
      : "text-ink";
  return (
    <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${cls}`}>
      {children}
    </div>
  );
}
