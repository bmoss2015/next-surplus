"use client";

import { useState, useTransition } from "react";
import { IconCheck } from "@tabler/icons-react";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/leads/types";
import { advanceStage } from "../_actions";
import { StageTransitionDialog } from "./StageActions";
import { cn } from "@/lib/cn";

// Fix W: the strip shows current position and lets you jump to ANY stage —
// click a step (forward or back) to move the lead there, with a confirm.
// Forward also has the right-rail "Next Stage" shortcut. "lost" isn't one of
// the 8 steps, so a lost lead shows no active step, but every step is still
// clickable (which doubles as a reopen).
const FORWARD_STAGES: Stage[] = STAGES.filter((s) => s !== "lost");

export function StageProgressStrip({
  leadId,
  currentStage,
}: {
  leadId: string;
  currentStage: Stage;
}) {
  const currentIdx = FORWARD_STAGES.indexOf(currentStage);
  const [jumpTo, setJumpTo] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmJump(stage: Stage) {
    startTransition(async () => {
      const result = await advanceStage(leadId, stage);
      if (result.ok) {
        setJumpTo(null);
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
          const isClickable = !isCurrent; // any stage but the current one

          return (
            <button
              key={stage}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && setJumpTo(stage)}
              title={isClickable ? `Move to ${STAGE_LABELS[stage]}` : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center",
                isClickable ? "cursor-pointer" : "cursor-default"
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
                    "border-2 border-petrol-500 text-petrol-500 shadow-[0_0_0_4px_rgba(19,100,78,0.12)]",
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

      {jumpTo && (
        <StageTransitionDialog
          fromStage={currentStage}
          toStage={jumpTo}
          isTransitioning={pending}
          error={error}
          onConfirm={() => confirmJump(jumpTo)}
          onCancel={() => {
            setJumpTo(null);
            setError(null);
          }}
        />
      )}
    </>
  );
}
