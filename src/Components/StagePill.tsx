import type { Stage } from "@/lib/leads/types";
import { STAGE_LABELS } from "@/lib/leads/types";
import { cn } from "@/lib/cn";

// Stage pills used in Leads list, Kanban, Claims, Reports. Per Bree's
// direct call on the claims-tier stages:
//   with_attorney  BLACK (bg-ink) + white text — admin-tier weight,
//                  signals the claim is officially in attorney hands
//   claim_filed    GRAY pillow (bg-petrol-100) + dark-gray text —
//                  processing / waiting on the court
//   won            SOLID EMERALD + white text — celebratory brand win
//   lost           danger red
//
// Earlier stages keep the existing muted-with-emerald-text styles since
// Bree said "everything else looks fine" on the prior round.
const STAGE_CLASSES: Record<Stage, string> = {
  new_leads:       "bg-gray-150 text-gray-500",
  qualifying:      "bg-petrol-100 text-petrol-700",
  outreach:        "bg-petrol-100 text-petrol-700",
  in_conversation: "bg-info-violet-bg text-info-violet-deep",
  contract:        "bg-warn-bg text-warn-strong",
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
