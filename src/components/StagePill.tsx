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
// Progression (light → mid → vivid):
//   new_leads      gray pillow (hasn't started)
//   qualifying     emerald outline (early — owning the lead)
//   outreach       emerald outline (still cold-touch)
//   in_conversation brand emerald solid (#0d4b3a — engagement)
//   contract       brand emerald solid
//   with_attorney  brand emerald solid (claim in-flight)
//   claim_filed    success-strong green (#065f46 — distinct deeper green)
//   won            success vivid green (#15803d — celebratory bright)
//   lost           danger red (terminal loss)
const STAGE_CLASSES: Record<Stage, string> = {
  new_leads:       "bg-gray-150 text-gray-600",
  qualifying:      "border border-petrol-500 text-petrol-500 bg-transparent",
  outreach:        "border border-petrol-500 text-petrol-500 bg-transparent",
  in_conversation: "bg-petrol-500 text-white",
  contract:        "bg-petrol-500 text-white",
  with_attorney:   "bg-petrol-500 text-white",
  claim_filed:     "bg-success-strong text-white",
  won:             "bg-success text-white",
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
