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
    <div className="overflow-x-auto pb-3">
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
}: {
  lead: LeadRow;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <a
      href={`/leads/${lead.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if (isDragging) e.preventDefault();
      }}
      className={cn(
        "block rounded-md border border-gray-200 bg-surface px-[11px] py-[10px] shadow-card cursor-grab active:cursor-grabbing transition-opacity",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium text-ink">
            {lead.address}
          </div>
          <div className="mt-[2px] truncate text-[11px] text-gray-500">
            {primaryOwner(lead)}
          </div>
          {lead.has_litigator && (
            <div className="mt-[5px]">
              <LitigatorBadge />
            </div>
          )}
          <div className="mt-[7px] whitespace-nowrap text-[12px] font-medium text-ink">
            Est. Surplus {formatCurrency(lead.estimated_surplus)}
          </div>
          <div className="whitespace-nowrap text-[10px] text-gray-400">
            Net {formatCurrency(lead.estimated_net_payout)}
          </div>
        </div>
        {lead.below_floor && (
          <div className="shrink-0 pt-[1px]">
            <BelowFloorIcon size={13} />
          </div>
        )}
      </div>
    </a>
  );
}
