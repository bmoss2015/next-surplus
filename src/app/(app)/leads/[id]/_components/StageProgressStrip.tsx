"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IconCheck, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
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

export type StageStripStage = { key: string; label: string };

export function StageProgressStrip({
  leadId,
  currentStage,
}: {
  leadId: string;
  currentStage: Stage;
}) {
  const stages: StageStripStage[] = FORWARD_STAGES.map((s) => ({
    key: s,
    label: STAGE_LABELS[s],
  }));
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
      <StageStripView
        stages={stages}
        currentIndex={currentIdx}
        onJump={(s) => setJumpTo(s.key as Stage)}
      />

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

type Mode = "list" | "centered" | "rail";

// Presentation-only stage strip. Picks layout based on stage count so a
// pipeline with a few stages renders today's roomy step layout, a mid-size one
// stays usable via auto-centered horizontal scroll, and a long custom pipeline
// collapses to a current-stage headline plus a compact dot rail.
export function StageStripView({
  stages,
  currentIndex,
  onJump,
}: {
  stages: StageStripStage[];
  currentIndex: number;
  onJump: (stage: StageStripStage) => void;
}) {
  const mode: Mode =
    stages.length <= 8 ? "list" : stages.length <= 15 ? "centered" : "rail";

  if (mode === "list") {
    return (
      <ListStrip
        stages={stages}
        currentIndex={currentIndex}
        onJump={onJump}
      />
    );
  }
  if (mode === "centered") {
    return (
      <CenteredStrip
        stages={stages}
        currentIndex={currentIndex}
        onJump={onJump}
      />
    );
  }
  return (
    <RailStrip stages={stages} currentIndex={currentIndex} onJump={onJump} />
  );
}

function StepButton({
  stage,
  index,
  currentIndex,
  isLast,
  onJump,
  widthClass,
}: {
  stage: StageStripStage;
  index: number;
  currentIndex: number;
  isLast: boolean;
  onJump: (s: StageStripStage) => void;
  widthClass: string;
}) {
  const isDone = index < currentIndex;
  const isCurrent = index === currentIndex;
  const isUpcoming = index > currentIndex;
  const isClickable = !isCurrent;
  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => isClickable && onJump(stage)}
      title={isClickable ? `Move to ${stage.label}` : undefined}
      className={cn(
        "relative flex flex-col items-center",
        widthClass,
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
        {isDone ? <IconCheck size={13} stroke={2.5} /> : index + 1}
      </span>
      <span
        className={cn(
          "mt-[7px] max-w-[80px] text-center text-[10px] leading-tight tracking-[0.2px]",
          isDone && "text-petrol-700",
          isCurrent && "font-medium text-petrol-500",
          isUpcoming && "text-gray-500"
        )}
      >
        {stage.label}
      </span>
    </button>
  );
}

function ListStrip({
  stages,
  currentIndex,
  onJump,
}: {
  stages: StageStripStage[];
  currentIndex: number;
  onJump: (s: StageStripStage) => void;
}) {
  return (
    <div className="mb-[18px] flex items-center gap-0 px-0 pt-3 pb-1">
      {stages.map((stage, idx) => (
        <StepButton
          key={stage.key}
          stage={stage}
          index={idx}
          currentIndex={currentIndex}
          isLast={idx === stages.length - 1}
          onJump={onJump}
          widthClass="flex-1"
        />
      ))}
    </div>
  );
}

function CenteredStrip({
  stages,
  currentIndex,
  onJump,
}: {
  stages: StageStripStage[];
  currentIndex: number;
  onJump: (s: StageStripStage) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const currentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const target = currentRef.current;
    if (!scroller || !target) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset =
      target.offsetLeft - scroller.offsetLeft -
      scrollerRect.width / 2 +
      targetRect.width / 2;
    scroller.scrollLeft = Math.max(0, offset);
  }, [currentIndex]);

  return (
    <div className="mb-[18px] pt-3 pb-1">
      <div
        ref={scrollerRef}
        className="flex items-start gap-0 overflow-x-auto px-0 [scrollbar-width:thin]"
      >
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={stage.key}
              ref={isCurrent ? currentRef : null}
              className="shrink-0"
              style={{ width: "108px" }}
            >
              <StepButton
                stage={stage}
                index={idx}
                currentIndex={currentIndex}
                isLast={isLast}
                onJump={onJump}
                widthClass="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RailStrip({
  stages,
  currentIndex,
  onJump,
}: {
  stages: StageStripStage[];
  currentIndex: number;
  onJump: (s: StageStripStage) => void;
}) {
  const current = stages[currentIndex];
  const prev = currentIndex > 0 ? stages[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < stages.length - 1
      ? stages[currentIndex + 1]
      : null;

  return (
    <div className="mb-[18px] space-y-2 pt-3 pb-1">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && onJump(prev)}
          className={cn(
            "inline-flex items-center gap-1 text-[11.5px] text-gray-500",
            prev
              ? "cursor-pointer hover:text-petrol-500"
              : "cursor-default opacity-40"
          )}
          title={prev ? `Move to ${prev.label}` : undefined}
        >
          <IconChevronLeft size={14} stroke={1.75} />
          {prev ? prev.label : "Start"}
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <span className="text-[10.5px] uppercase tracking-wide text-gray-500">
            Stage {currentIndex + 1} of {stages.length}
          </span>
          <span className="rounded-full border-2 border-petrol-500 bg-petrol-500/5 px-3 py-[3px] text-[12px] font-medium text-petrol-500 shadow-[0_0_0_3px_rgba(19,100,78,0.12)]">
            {current?.label ?? "—"}
          </span>
        </div>

        <button
          type="button"
          disabled={!next}
          onClick={() => next && onJump(next)}
          className={cn(
            "inline-flex items-center gap-1 text-[11.5px] text-gray-500",
            next
              ? "cursor-pointer hover:text-petrol-500"
              : "cursor-default opacity-40"
          )}
          title={next ? `Move to ${next.label}` : undefined}
        >
          {next ? next.label : "End"}
          <IconChevronRight size={14} stroke={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-[3px]">
        {stages.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={stage.key}
              type="button"
              disabled={isCurrent}
              onClick={() => !isCurrent && onJump(stage)}
              title={`${idx + 1}. ${stage.label}`}
              className={cn(
                "h-[8px] flex-1 rounded-full transition-colors",
                isDone && "bg-petrol-500",
                isCurrent && "bg-petrol-500 ring-2 ring-petrol-500/30",
                !isDone && !isCurrent && "bg-gray-200 hover:bg-gray-300",
                !isCurrent && "cursor-pointer"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
