import type { Stage } from "@/lib/leads/types";
import { STAGE_LABELS } from "@/lib/leads/types";
import { cn } from "@/lib/cn";

const STAGE_CLASSES: Record<Stage, string> = {
  new_leads: "bg-gray-150 text-gray-500",
  qualifying: "bg-petrol-100 text-petrol-700",
  outreach: "bg-petrol-100 text-petrol-700",
  in_conversation: "bg-info-violet-bg text-info-violet-deep",
  contract: "bg-warn-bg text-warn-strong",
  with_attorney: "bg-warn-bg text-warn-strong",
  claim_filed: "bg-success-bg text-success-strong",
  won: "bg-success-bg text-success-strong",
  lost: "bg-gray-150 text-gray-500",
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
        "inline-block rounded px-2 py-[3px] text-[11px] font-medium",
        STAGE_CLASSES[stage],
        className
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
