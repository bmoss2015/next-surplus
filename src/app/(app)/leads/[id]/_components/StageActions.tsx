"use client";

import { useState, useTransition, useEffect } from "react";
import {
  IconPlus,
  IconArrowRight,
  IconBan,
  IconFlag,
  IconFlagOff,
} from "@tabler/icons-react";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/leads/types";
import {
  advanceStage,
  pauseForReview,
  clearReviewFlag,
  addLostReason,
  archiveLostReason,
} from "../_actions";
import type { LostReasonOption } from "@/lib/leads/lost-reasons";
import { cn } from "@/lib/cn";

// The 8-step pipeline excludes "lost" — that path is the Mark Lost button.
const FORWARD_STAGES: Stage[] = STAGES.filter((s) => s !== "lost");
const CUSTOM_REASON_KEY = "__custom__";

type Dialog =
  | { kind: "stage"; toStage: Stage }
  | { kind: "lost" }
  | { kind: "review" }
  | null;

// Fix W: stage actions moved out of the progress-strip area into a right-rail
// "Stage Actions" card (sits above Assigned To). The strip is display-only.
export function StageActions({
  leadId,
  currentStage,
  needsReview,
  lostReasons,
}: {
  leadId: string;
  currentStage: Stage;
  needsReview: boolean;
  lostReasons: LostReasonOption[];
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentIdx = FORWARD_STAGES.indexOf(currentStage);
  const isTerminal = currentStage === "won" || currentStage === "lost";
  const nextStage =
    currentIdx >= 0 && currentIdx < FORWARD_STAGES.length - 1
      ? FORWARD_STAGES[currentIdx + 1]
      : null;

  function close() {
    setDialog(null);
    setError(null);
  }
  function openStage(stage: Stage) {
    if (stage === currentStage) return;
    setError(null);
    setDialog({ kind: "stage", toStage: stage });
  }
  function openLost() {
    if (isTerminal) return;
    setError(null);
    setDialog({ kind: "lost" });
  }
  function openReview() {
    setError(null);
    setDialog({ kind: "review" });
  }

  function confirmStage(toStage: Stage) {
    startTransition(async () => {
      const result = await advanceStage(leadId, toStage);
      if (result.ok) close();
      else setError(result.error);
    });
  }
  function confirmLost(reason: string) {
    startTransition(async () => {
      const result = await advanceStage(leadId, "lost", { lostReason: reason });
      if (result.ok) close();
      else setError(result.error);
    });
  }
  function confirmReview(reason: string) {
    startTransition(async () => {
      const result = await pauseForReview(leadId, reason);
      if (result.ok) close();
      else setError(result.error);
    });
  }
  function doClearReview() {
    startTransition(async () => {
      await clearReviewFlag(leadId);
    });
  }

  return (
    <>
      <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
        <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.5px] text-gray-500">
          Stage Actions
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => nextStage && openStage(nextStage)}
            disabled={!nextStage || isTerminal || pending}
            className="btn-primary flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] font-medium disabled:opacity-50"
          >
            <IconArrowRight size={14} stroke={2} />
            {nextStage ? `Next Stage: ${STAGE_LABELS[nextStage]}` : "No Next Stage"}
          </button>
          <button
            type="button"
            onClick={openLost}
            disabled={isTerminal || pending}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-danger bg-surface px-3 py-2 text-[12.5px] font-medium text-danger hover:bg-danger-bg disabled:opacity-50"
          >
            <IconBan size={14} stroke={2} />
            Mark Lost
          </button>
          {needsReview ? (
            <button
              type="button"
              onClick={doClearReview}
              disabled={pending}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] font-medium text-ink hover:border-petrol-500 disabled:opacity-50"
            >
              <IconFlagOff size={14} stroke={2} />
              Clear Needs Review
            </button>
          ) : (
            <button
              type="button"
              onClick={openReview}
              disabled={pending}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12.5px] font-medium text-ink hover:border-petrol-500 disabled:opacity-50"
            >
              <IconFlag size={14} stroke={2} />
              Needs Review
            </button>
          )}
        </div>
      </div>

      {dialog?.kind === "stage" && (
        <StageTransitionDialog
          fromStage={currentStage}
          toStage={dialog.toStage}
          isTransitioning={pending}
          error={error}
          onConfirm={() => confirmStage(dialog.toStage)}
          onCancel={close}
        />
      )}
      {dialog?.kind === "lost" && (
        <MarkLostDialog
          initialReasons={lostReasons}
          pending={pending}
          error={error}
          onConfirm={confirmLost}
          onCancel={close}
        />
      )}
      {dialog?.kind === "review" && (
        <NeedsReviewDialog
          pending={pending}
          error={error}
          onConfirm={confirmReview}
          onCancel={close}
        />
      )}
    </>
  );
}

function StageTransitionDialog({
  fromStage,
  toStage,
  isTransitioning,
  error,
  onConfirm,
  onCancel,
}: {
  fromStage: Stage;
  toStage: Stage;
  isTransitioning: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const direction =
    STAGES.indexOf(toStage) > STAGES.indexOf(fromStage) ? "forward" : "backward";

  return (
    <Overlay onCancel={onCancel}>
      <div className="text-[11px] tracking-[0.4px] text-gray-500">
        Confirm Stage Change
      </div>
      <div className="mt-2 text-[15px] text-ink">
        Move this lead from{" "}
        <strong className="font-medium">{STAGE_LABELS[fromStage]}</strong>{" "}
        {direction === "forward" ? "to" : "back to"}{" "}
        <strong className="font-medium">{STAGE_LABELS[toStage]}</strong>?
      </div>
      <div className="mt-2 text-[12px] text-gray-500">
        This Logs An Activity Record And Updates The Time In Stage Counter.
      </div>
      {error && <ErrorBox text={error} />}
      <DialogButtons
        onCancel={onCancel}
        onConfirm={onConfirm}
        disabled={isTransitioning}
        confirmLabel={isTransitioning ? "Updating" : "Confirm"}
      />
    </Overlay>
  );
}

function NeedsReviewDialog({
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  pending: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Overlay onCancel={onCancel}>
      <div className="text-[11px] tracking-[0.4px] text-gray-500">Needs Review</div>
      <div className="mt-2 text-[15px] font-medium text-ink">
        Flag This Lead For Review
      </div>
      <div className="mt-1 text-[12px] text-gray-500">
        Marks the lead as needing review. The stage stays the same.
      </div>
      <textarea
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (reason.trim()) onConfirm(reason.trim());
          }
        }}
        rows={3}
        placeholder="Why does this lead need review?"
        className="mt-4 w-full resize-none rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-petrol-500"
      />
      {error && <ErrorBox text={error} />}
      <DialogButtons
        onCancel={onCancel}
        onConfirm={() => onConfirm(reason.trim())}
        disabled={pending || reason.trim().length === 0}
        confirmLabel={pending ? "Saving" : "Flag For Review"}
      />
    </Overlay>
  );
}

function MarkLostDialog({
  initialReasons,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  initialReasons: LostReasonOption[];
  pending: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [available, setAvailable] = useState<LostReasonOption[]>(initialReasons);
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();
  const [isArchiving, startArchiving] = useTransition();

  const effective = selected === CUSTOM_REASON_KEY ? "" : selected.trim();

  function handleAddCustom() {
    const label = custom.trim();
    if (!label) return;
    setLocalError(null);
    startAdding(async () => {
      const result = await addLostReason(label);
      if (result.ok) {
        setAvailable((prev) => {
          if (prev.some((r) => r.label.toLowerCase() === result.label.toLowerCase()))
            return prev;
          return [...prev, { label: result.label, isDefault: false }].sort((a, b) =>
            a.label.localeCompare(b.label, "en", { sensitivity: "base" })
          );
        });
        setSelected(result.label);
        setCustom("");
      } else {
        setLocalError(result.error);
      }
    });
  }

  function handleArchive() {
    const label = selected;
    if (!label || label === CUSTOM_REASON_KEY) return;
    setLocalError(null);
    startArchiving(async () => {
      const result = await archiveLostReason(label);
      if (result.ok) {
        setAvailable((prev) =>
          prev.filter((r) => r.label.toLowerCase() !== label.toLowerCase())
        );
        setSelected("");
      } else {
        setLocalError(result.error);
      }
    });
  }

  return (
    <Overlay onCancel={onCancel}>
      <div className="text-[11px] tracking-[0.4px] text-gray-500">Mark Lost</div>
      <div className="mt-2 text-[15px] font-medium text-ink">
        Mark This Lead Lost
      </div>
      <div className="mt-1 text-[12px] text-gray-500">
        Closes the lead. Pick a reason or add a custom one.
      </div>

      <div className="mt-4">
        <label className="block text-[11px] font-medium tracking-[0.4px] text-gray-500">
          Lost Reason
        </label>
        <select
          autoFocus
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-petrol-500"
        >
          <option value="">Select A Reason</option>
          {available.map((r) => (
            <option key={r.label} value={r.label}>
              {r.label}
            </option>
          ))}
          <option value={CUSTOM_REASON_KEY}>+ Add New Reason</option>
        </select>

        {selected === CUSTOM_REASON_KEY && (
          <div className="mt-2">
            <div className="flex items-start gap-2">
              <input
                type="text"
                autoFocus
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder="Type a new reason, then click Add"
                className="flex-1 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-petrol-500"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={isAdding || custom.trim().length === 0}
                className="inline-flex items-center gap-1 rounded-md border border-petrol-500 bg-petrol-500 px-3 py-2 text-xs font-medium text-white hover:bg-petrol-700 disabled:opacity-50"
              >
                <IconPlus size={13} stroke={2} />
                {isAdding ? "Adding" : "Add"}
              </button>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Saved As Proper Case. You Still Need To Select It And Click Mark
              Lost.
            </div>
          </div>
        )}

        {selected &&
          selected !== CUSTOM_REASON_KEY &&
          !available.find((r) => r.label === selected)?.isDefault && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={isArchiving}
              className="mt-2 text-[11px] text-gray-500 underline hover:text-danger disabled:opacity-50"
            >
              {isArchiving ? "Removing" : `Remove "${selected}" From List`}
            </button>
          )}
      </div>

      {(localError || error) && <ErrorBox text={localError ?? error ?? ""} />}
      <DialogButtons
        onCancel={onCancel}
        onConfirm={() => onConfirm(effective)}
        disabled={pending || effective.length === 0}
        confirmLabel={pending ? "Saving" : "Mark Lost"}
        confirmClass="border-danger bg-danger hover:bg-danger/90"
      />
    </Overlay>
  );
}

// -- shared dialog chrome -----------------------------------------------------

function Overlay({
  children,
  onCancel,
}: {
  children: React.ReactNode;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-[10px] bg-surface p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
      {text}
    </div>
  );
}

function DialogButtons({
  onCancel,
  onConfirm,
  disabled,
  confirmLabel,
  confirmClass = "border-petrol-500 bg-petrol-500 hover:bg-petrol-700",
}: {
  onCancel: () => void;
  onConfirm: () => void;
  disabled: boolean;
  confirmLabel: string;
  confirmClass?: string;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={cn(
          "rounded-md border px-3 py-2 text-xs font-medium text-white disabled:opacity-50",
          confirmClass
        )}
      >
        {confirmLabel}
      </button>
    </div>
  );
}
