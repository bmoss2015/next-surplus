"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCircleCheck } from "@tabler/icons-react";
import { type LeadRow } from "@/lib/leads/types";
import type { KanbanData } from "@/lib/leads/fetch-kanban";
import type { OrgStage, StageKind } from "@/lib/stages/types";
import { advanceStage } from "@/app/(app)/leads/[id]/_actions";
import { formatCurrency, primaryOwner, toTitleCase } from "@/lib/leads/format";
import { activeSurplus, activeNetPayout } from "@/lib/leads/active-surplus";
import { LeadActionsMenu } from "@/app/(app)/leads/[id]/_components/LeadActionsMenu";
import { cn } from "@/lib/cn";

const KIND_DOT: Record<StageKind, string> = {
  open: "bg-petrol-500",
  won: "bg-success-strong",
  lost: "bg-gray-500",
};

const COLUMN_WIDTH = 240;
const COLUMN_GAP = 10;

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const router = useRouter();
  const [stages] = useState(initialData.stages);
  const [grouped, setGrouped] = useState(initialData.leadsByStage);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [hoverStageId, setHoverStageId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const bodyRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  function syncScroll(from: "mirror" | "body") {
    if (syncing.current) return;
    const body = bodyRef.current;
    const mirror = mirrorRef.current;
    if (!body || !mirror) return;
    syncing.current = true;
    if (from === "mirror") body.scrollLeft = mirror.scrollLeft;
    else mirror.scrollLeft = body.scrollLeft;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  }

  const contentWidth =
    stages.length * COLUMN_WIDTH + Math.max(0, stages.length - 1) * COLUMN_GAP;

  function findStageOfLead(leadId: string): string | null {
    for (const s of stages) {
      if (grouped[s.id]?.some((l) => l.id === leadId)) return s.id;
    }
    return null;
  }

  function removeLead(leadId: string) {
    setGrouped((prev) => {
      const next: Record<string, LeadRow[]> = {};
      for (const s of stages) {
        next[s.id] = (prev[s.id] ?? []).filter((l) => l.id !== leadId);
      }
      return next;
    });
  }

  function onDragStart(e: React.DragEvent, leadId: string) {
    setDraggingLeadId(leadId);
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDraggingLeadId(null);
    setHoverStageId(null);
  }

  function onDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoverStageId(stageId);
  }

  function onDrop(e: React.DragEvent, toStageId: string) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggingLeadId;
    setDraggingLeadId(null);
    setHoverStageId(null);
    if (!leadId) return;

    const fromStageId = findStageOfLead(leadId);
    if (!fromStageId || fromStageId === toStageId) return;

    const toStage = stages.find((s) => s.id === toStageId);
    if (!toStage) return;

    if (toStage.kind === "lost") {
      const lead = grouped[fromStageId]?.find((l) => l.id === leadId);
      if (lead && confirm("Marking lost requires a reason. Open the lead?")) {
        router.push(`/leads/${leadId}`);
      }
      return;
    }

    setGrouped((prev) => {
      const lead = prev[fromStageId]?.find((l) => l.id === leadId);
      if (!lead) return prev;
      const next = { ...prev };
      next[fromStageId] = (prev[fromStageId] ?? []).filter((l) => l.id !== leadId);
      next[toStageId] = [{ ...lead, stage_id: toStageId }, ...(prev[toStageId] ?? [])];
      return next;
    });

    startTransition(async () => {
      const result = await advanceStage(leadId, toStageId);
      if (!result.ok) {
        alert(`Failed to move: ${result.error}`);
        setGrouped((prev) => {
          const lead = prev[toStageId]?.find((l) => l.id === leadId);
          if (!lead) return prev;
          const next = { ...prev };
          next[toStageId] = (prev[toStageId] ?? []).filter((l) => l.id !== leadId);
          next[fromStageId] = [
            { ...lead, stage_id: fromStageId },
            ...(prev[fromStageId] ?? []),
          ];
          return next;
        });
      }
    });
  }

  return (
    <div>
      <div
        ref={mirrorRef}
        onScroll={() => syncScroll("mirror")}
        className="kanban-scroll sticky top-0 z-30 mb-2 h-[12px] overflow-x-scroll overflow-y-hidden bg-canvas"
        aria-hidden
      >
        <div className="h-px" style={{ width: contentWidth }} />
      </div>

      <div
        ref={bodyRef}
        onScroll={() => syncScroll("body")}
        className="kanban-scroll overflow-x-scroll pb-3"
      >
        <div className="flex w-max gap-[10px]">
          {stages.map((stage) => {
            const leads = grouped[stage.id] ?? [];
            const isHover = hoverStageId === stage.id;
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={leads}
                isHover={isHover}
                onDragOver={(e) => onDragOver(e, stage.id)}
                onDrop={(e) => onDrop(e, stage.id)}
                draggingLeadId={draggingLeadId}
                onCardDragStart={onDragStart}
                onCardDragEnd={onDragEnd}
                onCardRemoved={removeLead}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  stage,
  leads,
  isHover,
  onDragOver,
  onDrop,
  draggingLeadId,
  onCardDragStart,
  onCardDragEnd,
  onCardRemoved,
}: {
  stage: OrgStage;
  leads: LeadRow[];
  isHover: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  draggingLeadId: string | null;
  onCardDragStart: (e: React.DragEvent, leadId: string) => void;
  onCardDragEnd: () => void;
  onCardRemoved: (leadId: string) => void;
}) {
  const tintClass =
    stage.kind === "won"
      ? "bg-[#ecfdf5]"
      : stage.kind === "lost"
        ? "bg-[#fef2f2]"
        : "bg-surface";

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "w-[240px] shrink-0 overflow-hidden rounded-lg border bg-gray-100 transition-colors",
        isHover ? "border-petrol-500 bg-petrol-50" : "border-gray-200"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b border-gray-200 px-3 py-[11px]",
          tintClass
        )}
      >
        <div className="flex items-center gap-[7px] text-xs font-medium text-ink">
          <span className={cn("h-[7px] w-[7px] rounded-full", KIND_DOT[stage.kind])} />
          {stage.name}
        </div>
        <span className="text-[11px] font-medium text-gray-500">
          {leads.length}
        </span>
      </div>
      <div className="min-h-[460px] space-y-[7px] p-2">
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            isDragging={draggingLeadId === lead.id}
            onDragStart={(e) => onCardDragStart(e, lead.id)}
            onDragEnd={onCardDragEnd}
            onRemoved={() => onCardRemoved(lead.id)}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({
  lead,
  isDragging,
  onDragStart,
  onDragEnd,
  onRemoved,
}: {
  lead: LeadRow;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemoved: () => void;
}) {
  const locationLine = [lead.county ? toTitleCase(lead.county) : null, lead.state]
    .filter(Boolean)
    .join(", ");
  const surplus = activeSurplus(lead);
  const tags: Array<{ key: string; label: string; cls: string }> = [];
  if (lead.below_floor)
    tags.push({
      key: "below_floor",
      label: "Below Minimum",
      cls: "border-warn-border bg-warn-bg text-warn-strong",
    });
  if (lead.needs_action_flag)
    tags.push({
      key: "needs_action",
      label: "Needs Action",
      cls: "border-petrol-200 bg-[#f3f4f6] text-[#0d4b3a]",
    });
  const visibleTags = tags.slice(0, 2);
  const hiddenTagCount = tags.length - visibleTags.length;

  return (
    <div
      className={cn(
        "group relative rounded-md border border-gray-200 bg-surface shadow-card transition-opacity",
        isDragging && "opacity-40"
      )}
    >
      <div className="absolute right-1.5 top-1.5 z-10">
        <LeadActionsMenu
          leadId={lead.id}
          archived={lead.archived}
          onDone={onRemoved}
          triggerClassName="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>

      <a
        href={`/leads/${lead.id}`}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
        className="block cursor-grab px-[11px] pb-[10px] pt-[10px] active:cursor-grabbing"
      >
        <div className="min-w-0">
          <div className="truncate pr-6 text-[12px] font-medium text-ink">
            {lead.address}
          </div>
          <div className="mt-[2px] truncate text-[11px] text-gray-500">
            {primaryOwner(lead)}
          </div>
          {locationLine && (
            <div className="mt-[1px] truncate text-[10.5px] text-gray-400">
              {locationLine}
            </div>
          )}
          <div className="mt-[7px] whitespace-nowrap text-[11px]">
            <span className="text-gray-400">Total Surplus: </span>
            {surplus.basis === "confirmed" ? (
              <span className="font-medium text-ink">
                {formatCurrency(surplus.value)}
                <IconCircleCheck
                  size={11}
                  className="ml-0.5 inline-block align-text-bottom text-petrol-700"
                  aria-label="Confirmed surplus"
                />
              </span>
            ) : (
              <span className="font-medium text-gray-500">
                Estimated {formatCurrency(surplus.value)}
              </span>
            )}
          </div>
          <div className="mt-[1px] whitespace-nowrap text-[10px]">
            <span className="text-gray-400">Estimated Net Payout: </span>
            <span className="text-gray-400">
              {formatCurrency(activeNetPayout(lead))}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="mt-[9px] flex flex-wrap items-center gap-1.5">
              {visibleTags.map((t) => (
                <span key={t.key} className={cn(KANBAN_TAG_PILL, t.cls)}>
                  {t.label}
                </span>
              ))}
              {hiddenTagCount > 0 && (
                <span
                  className={cn(
                    KANBAN_TAG_PILL,
                    "border-gray-200 bg-gray-100 text-gray-500"
                  )}
                >
                  +{hiddenTagCount} more
                </span>
              )}
            </div>
          )}
        </div>
      </a>
    </div>
  );
}

const KANBAN_TAG_PILL =
  "rounded-md border px-2 py-[2px] text-[10px] font-medium leading-none";
