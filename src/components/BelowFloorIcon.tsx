import { IconAlertTriangle } from "@tabler/icons-react";

// Fix 52: the "Below Floor" text label is replaced everywhere by this small
// amber warning icon. Icon only — no text. Tooltip on hover.
export function BelowFloorIcon({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-flex cursor-help text-warn-strong"
      title="Surplus is below your minimum floor setting."
      aria-label="Surplus is below your minimum floor setting"
    >
      <IconAlertTriangle size={size} stroke={1.75} />
    </span>
  );
}
