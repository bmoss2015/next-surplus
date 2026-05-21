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
// Bree rejected every off-brand or near-black option for Won (ink, deep
// emerald, success vivid lime, bright petrol-300). The honest truth is
// there's no good "different green" that stays on the emerald palette
// AND looks distinct from Claim Filed. Solution: Won shares Claim
// Filed's solid brand emerald color, but the StagePill prepends a ✓ to
// the label below so the two are unmistakable at a glance without
// adding a color outside the brand.
const STAGE_CLASSES: Record<Stage, string> = {
  new_leads:       "bg-gray-150 text-gray-600",
  qualifying:      "border border-petrol-500 text-petrol-500 bg-transparent",
  outreach:        "border border-petrol-500 text-petrol-500 bg-transparent",
  in_conversation: "bg-petrol-500 text-white",
  contract:        "bg-petrol-500 text-white",
  with_attorney:   "border border-petrol-500 text-petrol-500 bg-transparent",
  claim_filed:     "bg-petrol-500 text-white",
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
      {stage === "won" && "✓ "}
      {STAGE_LABELS[stage]}
    </span>
  );
}
