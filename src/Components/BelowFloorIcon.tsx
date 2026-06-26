import { IconAlertTriangle } from "@tabler/icons-react";

// Fix 52 / YYYY2: the "Below Minimum" text label is replaced in dense lists by
// this small amber warning icon. Icon only — no text. Tooltip on hover.
export function BelowFloorIcon({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-flex cursor-help text-warn-strong"
      title="Surplus is below your minimum threshold setting."
      aria-label="Surplus is below your minimum threshold setting"
    >
      <IconAlertTriangle size={size} stroke={1.75} />
    </span>
  );
}
