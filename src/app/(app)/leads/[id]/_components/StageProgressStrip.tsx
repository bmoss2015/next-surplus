"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { IconCheck } from "@tabler/icons-react";
import type { OrgStage } from "@/lib/stages/types";
import { advanceStage } from "../_actions";
import { StageTransitionDialog } from "./StageActions";
import { cn } from "@/lib/cn";

export function StageProgressStrip({
  leadId,
  currentStageId,
  stages,
}: {
  leadId: string;
  currentStageId: string | null;
  stages: OrgStage[];
}) {
  const forwardStages = stages.filter((s) => s.kind !== "lost");
  const currentIdx = currentStageId
    ? forwardStages.findIndex((s) => s.id === currentStageId)
    : -1;
  const currentStage = stages.find((s) => s.id === currentStageId) ?? null;

  const [jumpTo, setJumpTo] = useState<OrgStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const current = currentRef.current;
    if (!scroller || !current) return;
    const target =
      current.offsetLeft + current.offsetWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollLeft = Math.max(0, target);
  }, [currentIdx]);

  function confirmJump(stage: OrgStage) {
    startTransition(async () => {
      const result = await advanceStage(leadId, stage.id);
      if (result.ok) {
        setJumpTo(null);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  if (forwardStages.length === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="kanban-scroll mb-[18px] flex items-start gap-0 overflow-x-auto px-0 pt-3 pb-2"
      >
        <div className="flex items-start" style={{ minWidth: "100%" }}>
          {forwardStages.map((stage, idx) => {
            const isDone = currentIdx >= 0 && idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isUpcoming = currentIdx < 0 || idx > currentIdx;
            const isLast = idx === forwardStages.length - 1;
            const isClickable = !isCurrent;

            return (
              <button
                key={stage.id}
                ref={isCurrent ? currentRef : undefined}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && setJumpTo(stage)}
                title={isClickable ? `Move to ${stage.name}` : undefined}
                className={cn(
                  "relative flex flex-1 shrink-0 flex-col items-center px-2",
                  isClickable ? "cursor-pointer" : "cursor-default"
                )}
                style={{ minWidth: 96 }}
              >
                {!isLast && (
                  <span
                    className={cn(
                      "absolute left-1/2 right-[-50%] z-[1] h-[2px]",
                      isCurrent ? "top-[16px]" : "top-[13px]",
                      isDone ? "bg-petrol-500" : "bg-gray-200"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "relative z-[2] flex items-center justify-center rounded-full bg-surface text-[11px] font-medium",
                    isCurrent
                      ? "h-[32px] w-[32px] border-2 border-petrol-500 text-petrol-500 shadow-[0_0_0_4px_rgba(19,100,78,0.12)]"
                      : "h-[26px] w-[26px]",
                    isDone && "bg-petrol-500 text-white",
                    isUpcoming && "border-[1.5px] border-gray-300 text-gray-400"
                  )}
                >
                  {isDone ? <IconCheck size={13} stroke={2.5} /> : idx + 1}
                </span>
                <span
                  className={cn(
                    "mt-[7px] max-w-[100px] text-center text-[10px] leading-tight tracking-[0.2px]",
                    isDone && "text-petrol-700",
                    isCurrent && "text-[11px] font-medium text-petrol-500",
                    isUpcoming && "text-gray-500"
                  )}
                >
                  {stage.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {jumpTo && currentStage && (
        <StageTransitionDialog
          fromStageName={currentStage.name}
          toStageName={jumpTo.name}
          isForward={
            forwardStages.findIndex((s) => s.id === jumpTo.id) > currentIdx
          }
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
