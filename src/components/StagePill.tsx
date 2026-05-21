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
// Buckets:
//   New leads / lost      → muted gray (haven't started / dead-end)
//   Qualifying / outreach → emerald OUTLINE (early, in-motion)
//   In conversation /
//     contract            → SOLID emerald (active engagement)
//   With attorney /
//     claim filed         → DEEP EMERALD (admin-tier weight; brand-family
//                           dark so it reads authoritative without going
//                           full black — Bree said true ink was too harsh
//                           at this size)
//   Won                   → DEEP EMERALD (terminal positive)
//   Lost                  → DANGER RED
const STAGE_CLASSES: Record<Stage, string> = {
  new_leads:       "bg-gray-150 text-gray-600",
  qualifying:      "border border-petrol-500 text-petrol-500 bg-transparent",
  outreach:        "border border-petrol-500 text-petrol-500 bg-transparent",
  in_conversation: "bg-petrol-500 text-white",
  contract:        "bg-petrol-500 text-white",
  with_attorney:   "bg-petrol-900 text-white",
  claim_filed:     "bg-petrol-900 text-white",
  won:             "bg-petrol-900 text-white",
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
