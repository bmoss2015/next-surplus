"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  STAGES,
  STAGE_LABELS,
  type Stage,
  type LeadRow,
} from "@/lib/leads/types";
import { advanceStage } from "@/app/(app)/leads/[id]/_actions";
import { formatCurrency, primaryOwner } from "@/lib/leads/format";
import { BelowFloorIcon } from "@/components/BelowFloorIcon";
import { LitigatorBadge } from "@/components/LitigatorBadge";
import { LeadActionsMenu } from "@/app/(app)/leads/[id]/_components/LeadActionsMenu";
import { cn } from "@/lib/cn";

const STAGE_DOT: Record<Stage, string> = {
  new_leads: "bg-gray-400",
  qualifying: "bg-petrol-500",
  outreach: "bg-petrol-500",
  in_conversation: "bg-info-violet",
  contract: "bg-warn",
  with_attorney: "bg-warn",
  claim_filed: "bg-success",
  won: "bg-success-strong",
  lost: "bg-gray-500",
};

export function KanbanBoard({
  initialGrouped,
}: {
  initialGrouped: Record<Stage, LeadRow[]>;
}) {
  const router = useRouter();
  const [grouped, setGrouped] = useState(initialGrouped);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<Stage | null>(null);
  const [, startTransition] = useTransition();

  function findStageOfLead(leadId: string): Stage | null {
    for (const stage of STAGES) {
      if (grouped[stage].some((l) => l.id === leadId)) return stage;
    }
    return null;
  }

  // Fix U: a lead archived or deleted from its card disappears from the board.
  function removeLead(leadId: string) {
    setGrouped((prev) => {
      const next = { ...prev };
      for (const stage of STAGES) {
        next[stage] = prev[stage].filter((l) => l.id !== leadId);
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
    setHoverStage(null);
  }

  function onDragOver(e: React.DragEvent, stage: Stage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoverStage(stage);
  }

  function onDrop(e: React.DragEvent, toStage: Stage) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggingLeadId;
    setDraggingLeadId(null);
    setHoverStage(null);
    if (!leadId) return;

    const fromStage = findStageOfLead(leadId);
    if (!fromStage || fromStage === toStage) return;

    // Marking lost from kanban requires a reason; punt to the detail page
    if (toStage === "lost") {
      const lead = grouped[fromStage].find((l) => l.id === leadId);
      if (lead && confirm("Marking lost requires a reason. Open the lead?")) {
        router.push(`/leads/${leadId}`);
      }
      return;
    }

    // Optimistic move
    setGrouped((prev) => {
      const lead = prev[fromStage].find((l) => l.id === leadId);
      if (!lead) return prev;
      const next = { ...prev };
      next[fromStage] = prev[fromStage].filter((l) => l.id !== leadId);
      next[toStage] = [{ ...lead, stage: toStage }, ...prev[toStage]];
      return next;
    });

    startTransition(async () => {
      const result = await advanceStage(leadId, toStage);
      if (!result.ok) {
        alert(`Failed to move: ${result.error}`);
        // Revert
        setGrouped((prev) => {
          const lead = prev[toStage].find((l) => l.id === leadId);
          if (!lead) return prev;
          const next = { ...prev };
          next[toStage] = prev[toStage].filter((l) => l.id !== leadId);
          next[fromStage] = [{ ...lead, stage: fromStage }, ...prev[fromStage]];
          return next;
        });
      }
    });
  }

  return (
    // Fix P: always show the horizontal scrollbar so every stage column is
    // reachable — overflow-x-scroll, never auto.
    <div className="overflow-x-scroll pb-3">
      <div className="flex w-max gap-[10px]">
        {STAGES.map((stage) => {
          const leads = grouped[stage];
          const isHover = hoverStage === stage;
          return (
            <div
              key={stage}
              onDragOver={(e) => onDragOver(e, stage)}
              onDrop={(e) => onDrop(e, stage)}
              className={cn(
                "w-[240px] shrink-0 overflow-hidden rounded-lg border bg-gray-100 transition-colors",
                isHover ? "border-petrol-500 bg-petrol-50" : "border-gray-200"
              )}
            >
              <div className="flex items-center justify-between border-b border-gray-200 bg-surface px-3 py-[11px]">
                <div className="flex items-center gap-[7px] text-xs font-medium text-ink">
                  <span className={cn("h-[7px] w-[7px] rounded-full", STAGE_DOT[stage])} />
                  {STAGE_LABELS[stage]}
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
                    onDragStart={(e) => onDragStart(e, lead.id)}
                    onDragEnd={onDragEnd}
                    onRemoved={() => removeLead(lead.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
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
  return (
    // Fix U: the ⋯ menu sits OUTSIDE the <a> so its clicks never trigger card
    // navigation or the card drag.
    <div
      className={cn(
        "group relative rounded-md border border-gray-200 bg-surface shadow-card transition-opacity",
        isDragging && "opacity-40"
      )}
    >
      <a
        href={`/leads/${lead.id}`}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
        className="block cursor-grab px-[11px] py-[10px] active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate pr-5 text-[12px] font-medium text-ink">
              {lead.address}
            </div>
            <div className="mt-[2px] truncate text-[11px] text-gray-500">
              {primaryOwner(lead)}
            </div>
            {/* Fix P: restore the status pill on Kanban cards — shown only when
                the lead carries a status flag. */}
            {lead.needs_action_flag && (
              <div className="mt-[5px]">
                <span className="inline-block rounded bg-danger-bg px-2 py-[2px] text-[10px] font-medium text-danger">
                  Needs Action
                </span>
              </div>
            )}
            {lead.has_litigator && (
              <div className="mt-[5px]">
                <LitigatorBadge />
              </div>
            )}
            <div className="mt-[7px] whitespace-nowrap text-[11px]">
              <span className="text-gray-400">Total Surplus: </span>
              <span className="font-medium text-ink">
                {formatCurrency(lead.estimated_surplus)}
              </span>
            </div>
            <div className="mt-[1px] whitespace-nowrap text-[10px]">
              <span className="text-gray-400">Est. Net Surplus: </span>
              <span className="text-gray-400">
                {formatCurrency(lead.estimated_net_payout)}
              </span>
            </div>
          </div>
          {lead.below_floor && (
            <div className="shrink-0 pt-[1px]">
              <BelowFloorIcon size={13} />
            </div>
          )}
        </div>
      </a>
      <div className="absolute right-[7px] top-[7px]">
        <LeadActionsMenu
          leadId={lead.id}
          archived={lead.archived}
          onDone={onRemoved}
          triggerClassName="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </div>
  );
}
