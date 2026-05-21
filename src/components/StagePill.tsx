import type { Stage } from "@/lib/leads/types";
import { STAGE_LABELS } from "@/lib/leads/types";
import { cn } from "@/lib/cn";

// Stage pills used in the leads list, kanban hovers, claims, reports, etc.
// Per Bree: the old "gray pillow + green text" look read muted and
// indistinguishable across stages. Each stage now gets its own pill style
// from the role-tab vocabulary so a row scanning across the list reads
// real progress (gray → emerald-outline → solid emerald → black → won) and
// terminal-loss is clearly red.
//
// Each stage maps to its own visual style. The Claims page in particular
// filters to just with_attorney / claim_filed / won — those three MUST
// read as a progression of three different greens, not "everything dark."
// Nothing on the pill scale uses black; the strongest stage is the
// brand-emerald mid, never deep/ink.
//
// Per Bree's direct call on the claims-tier stages:
//   with_attorney  BLACK ink + white text  — admin-tier weight
//   claim_filed    GRAY pillow             — waiting / processing
//   won            SOLID EMERALD + white   — celebratory brand color
//
// Earlier stages keep their existing treatments (outline, mid emerald)
// because Bree said "everything else looks fine."
const STAGE_CLASSES: Record<Stage, string> = {
  new_leads:       "bg-gray-150 text-gray-600",
  qualifying:      "border border-petrol-500 text-petrol-500 bg-transparent",
  outreach:        "border border-petrol-500 text-petrol-500 bg-transparent",
  in_conversation: "bg-petrol-500 text-white",
  contract:        "bg-petrol-500 text-white",
  with_attorney:   "bg-ink text-white",
  claim_filed:     "bg-petrol-100 text-gray-700",
  won:             "bg-petrol-500 text-white",
  lost:            "bg-danger text-white",
};

export function StagePill({
  stage,
  className,
}: {
  stage: Stage;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block min-w-[120px] rounded px-2 py-[3px] text-center text-[11px] font-medium",
        STAGE_CLASSES[stage],
        className
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
