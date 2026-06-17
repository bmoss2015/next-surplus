type Size = "sm" | "md" | "lg" | "xl";
type Tone = "light" | "dark";

const SIZES: Record<Size, number> = { sm: 28, md: 36, lg: 48, xl: 68 };

export function DiamondMark({
  size = "md",
  tone = "light",
}: {
  size?: Size;
  tone?: Tone;
}) {
  const px = SIZES[size];
  const bg = tone === "light" ? "#04261c" : "#ffffff";
  const tip = tone === "light" ? "#ffffff" : "#04261c";
  return (
    <svg viewBox="0 0 68 68" width={px} height={px} aria-hidden>
      <rect width="68" height="68" fill={bg} />
      <polygon points="34,16 56,34 34,52 12,34" fill={tip} />
      <polygon points="34,16 56,34 34,34" fill="#13644e" />
      <polygon points="34,34 56,34 34,52" fill="#4a9c75" />
    </svg>
  );
}

export function DiamondGlyph({
  size = "md",
  color = "#ffffff",
}: {
  size?: Size;
  color?: string;
}) {
  const px = SIZES[size];
  return (
    <svg viewBox="0 0 68 68" width={px} height={px} aria-hidden>
      <polygon
        points="34,8 60,34 34,60 8,34"
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
      <polygon points="34,8 60,34 34,34" fill={color} opacity="0.9" />
      <polygon points="34,34 60,34 34,60" fill={color} opacity="0.55" />
    </svg>
  );
}

export function CircleMark({
  size = "md",
  tone = "light",
}: {
  size?: Size;
  tone?: Tone;
}) {
  const px = SIZES[size];
  const bg = tone === "light" ? "#04261c" : "#ffffff";
  const tip = tone === "light" ? "#ffffff" : "#04261c";
  return (
    <svg viewBox="0 0 68 68" width={px} height={px} aria-hidden>
      <circle cx="34" cy="34" r="32" fill={bg} />
      <polygon points="34,16 52,34 34,52 16,34" fill={tip} />
      <polygon points="34,16 52,34 34,34" fill="#13644e" />
      <polygon points="34,34 52,34 34,52" fill="#4a9c75" />
    </svg>
  );
}

export function Wordmark({
  size = "md",
  tone = "light",
}: {
  size?: Size;
  tone?: Tone;
}) {
  const fontSize = size === "xl" ? 32 : size === "lg" ? 24 : size === "md" ? 18 : 14;
  const color = tone === "light" ? "#04261c" : "#ffffff";
  return (
    <span
      style={{
        fontSize,
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color,
        lineHeight: 1,
      }}
    >
      Next Surplus
    </span>
  );
}

export function LockupHorizontal({
  size = "md",
  tone = "light",
}: {
  size?: Size;
  tone?: Tone;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <DiamondMark size={size} tone={tone} />
      <Wordmark size={size} tone={tone} />
    </div>
  );
}

export function LockupStacked({
  size = "lg",
  tone = "light",
}: {
  size?: Size;
  tone?: Tone;
}) {
  return (
    <div className="inline-flex flex-col items-center gap-3">
      <DiamondMark size={size} tone={tone} />
      <Wordmark size={size} tone={tone} />
    </div>
  );
}
