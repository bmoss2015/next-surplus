"use client";

import { useState, useTransition } from "react";
import { IconCheck } from "@tabler/icons-react";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/leads/types";
import { advanceStage } from "../_actions";
import { StageTransitionDialog } from "./StageActions";
import { cn } from "@/lib/cn";

// Fix W: the strip mostly shows current position — forward moves and lost/review
// live in the right-rail "Stage Actions" card. The one interaction left here:
// click an EARLIER step to move the lead back to that stage (with a confirm).
// "lost" isn't in the 8-step strip, so a lost lead shows no active step (and
// nothing here is clickable — use "Reopen lead" in Stage Actions).
const FORWARD_STAGES: Stage[] = STAGES.filter((s) => s !== "lost");

export function StageProgressStrip({
  leadId,
  currentStage,
}: {
  leadId: string;
  currentStage: Stage;
}) {
  const currentIdx = FORWARD_STAGES.indexOf(currentStage);
  const [backTo, setBackTo] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmBack(stage: Stage) {
    startTransition(async () => {
      const result = await advanceStage(leadId, stage);
      if (result.ok) {
        setBackTo(null);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div className="mb-[18px] flex items-center gap-0 px-0 pt-3 pb-1">
        {FORWARD_STAGES.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isUpcoming = idx > currentIdx;
          const isLast = idx === FORWARD_STAGES.length - 1;
          const canGoBack = idx < currentIdx; // earlier step → move the lead back

          return (
            <button
              key={stage}
              type="button"
              disabled={!canGoBack}
              onClick={() => canGoBack && setBackTo(stage)}
              title={canGoBack ? `Move back to ${STAGE_LABELS[stage]}` : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center",
                canGoBack ? "cursor-pointer" : "cursor-default"
              )}
            >
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-1/2 right-[-50%] top-[13px] z-[1] h-[2px]",
                    isDone ? "bg-petrol-500" : "bg-gray-200"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-[2] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-surface text-[11px] font-medium",
                  isDone && "bg-petrol-500 text-white",
                  isCurrent &&
                    "border-2 border-petrol-500 text-petrol-500 shadow-[0_0_0_4px_rgba(13,108,125,0.12)]",
                  isUpcoming && "border-[1.5px] border-gray-300 text-gray-400"
                )}
              >
                {isDone ? <IconCheck size={13} stroke={2.5} /> : idx + 1}
              </span>
              <span
                className={cn(
                  "mt-[7px] max-w-[80px] text-center text-[10px] leading-tight tracking-[0.2px]",
                  isDone && "text-petrol-700",
                  isCurrent && "font-medium text-petrol-500",
                  isUpcoming && "text-gray-500"
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            </button>
          );
        })}
      </div>

      {backTo && (
        <StageTransitionDialog
          fromStage={currentStage}
          toStage={backTo}
          isTransitioning={pending}
          error={error}
          onConfirm={() => confirmBack(backTo)}
          onCancel={() => {
            setBackTo(null);
            setError(null);
          }}
        />
      )}
    </>
  );
}
