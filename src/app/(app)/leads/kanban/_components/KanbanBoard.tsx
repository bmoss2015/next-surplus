"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCircleCheck, IconFlag, IconClockHour4, IconGavel } from "@tabler/icons-react";
import type { KanbanData, KanbanLead } from "@/lib/leads/fetch-kanban";
import type { OrgStage, StageKind } from "@/lib/stages/types";
import { advanceStage } from "@/app/(app)/leads/[id]/_actions";
import { formatCurrency, primaryOwner, toTitleCase } from "@/lib/leads/format";
import { activeSurplus } from "@/lib/leads/active-surplus";
import { LeadActionsMenu } from "@/app/(app)/leads/[id]/_components/LeadActionsMenu";
import { cn } from "@/lib/cn";

const KIND_DOT: Record<StageKind, string> = {
  open: "bg-petrol-500",
  won: "bg-success-strong",
  lost: "bg-gray-500",
};

export function KanbanBoard({ initialData }: { initialData: KanbanData }) {
  const router = useRouter();
  const [stages] = useState(initialData.stages);
  const [grouped, setGrouped] = useState(initialData.leadsByStage);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [hoverStageId, setHoverStageId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function findStageOfLead(leadId: string): string | null {
    for (const s of stages) {
      if (grouped[s.id]?.some((l) => l.id === leadId)) return s.id;
    }
    return null;
  }

  function removeLead(leadId: string) {
    setGrouped((prev) => {
      const next: Record<string, KanbanLead[]> = {};
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
      const moved: KanbanLead = {
        ...lead,
        stage_id: toStageId,
        days_in_stage: 0,
      };
      next[toStageId] = [moved, ...(prev[toStageId] ?? [])];
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
    <div className="flex h-full flex-col">
      <div className="kanban-scroll min-h-0 flex-1 overflow-auto">
        <div className="flex w-max gap-[10px] pb-3 pr-3">
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
  leads: KanbanLead[];
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
        "w-[240px] shrink-0 rounded-lg border-x border-b bg-gray-100 transition-colors",
        isHover ? "border-petrol-500 bg-petrol-50" : "border-gray-200"
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between rounded-t-lg border-t border-b border-b-gray-200 px-3 py-[11px]",
          isHover ? "border-t-petrol-500" : "border-t-gray-200",
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
            stage={stage}
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
  stage,
  isDragging,
  onDragStart,
  onDragEnd,
  onRemoved,
}: {
  lead: KanbanLead;
  stage: OrgStage;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemoved: () => void;
}) {
  const locationLine = [lead.county ? toTitleCase(lead.county) : null, lead.state]
    .filter(Boolean)
    .join(", ");
  const surplus = activeSurplus(lead);

  const rotting =
    stage.kind === "open" &&
    stage.rotDays != null &&
    lead.days_idle >= stage.rotDays;

  const nextDeadline = computeNextDeadline(lead);

  const initials = lead.assignedName ? deriveInitials(lead.assignedName) : null;

  const stageChipTone =
    stage.rotDays != null && lead.days_in_stage >= stage.rotDays
      ? "bg-[#fef2f2] text-danger"
      : stage.rotDays != null && lead.days_in_stage >= stage.rotDays * 0.75
        ? "bg-warn-bg text-warn-strong"
        : "bg-gray-100 text-gray-500";

  return (
    <div
      className={cn(
        "group relative rounded-md border bg-surface shadow-card transition-opacity",
        rotting ? "border-danger" : "border-gray-200",
        isDragging && "opacity-40"
      )}
    >
      {rotting && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-l-md bg-danger"
        />
      )}
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
          <div className="flex items-start justify-between gap-2 pr-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                {lead.needs_action_flag && (
                  <IconFlag
                    size={11}
                    className="shrink-0 text-danger"
                    aria-label="Manually flagged"
                  />
                )}
                {lead.below_floor && (
                  <IconGavel
                    size={11}
                    className="shrink-0 text-warn-strong"
                    aria-label="Below minimum surplus floor"
                  />
                )}
                <div className="truncate text-[12px] font-medium text-ink">
                  {lead.address}
                </div>
              </div>
              <div className="mt-[2px] truncate text-[11px] text-gray-500">
                {primaryOwner(lead)}
              </div>
              {locationLine && (
                <div className="mt-[1px] truncate text-[10.5px] text-gray-400">
                  {locationLine}
                </div>
              )}
            </div>
            {initials && (
              <span
                title={`Assigned to ${lead.assignedName}`}
                className="mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-petrol-100 text-[9.5px] font-semibold text-petrol-700"
              >
                {initials}
              </span>
            )}
          </div>

          <div className="mt-[8px] flex items-baseline justify-between">
            <div className="text-[14px] font-semibold text-ink">
              {formatCurrency(surplus.value)}
              {surplus.basis === "confirmed" && (
                <IconCircleCheck
                  size={12}
                  className="ml-0.5 inline-block align-text-bottom text-petrol-700"
                  aria-label="Confirmed surplus"
                />
              )}
            </div>
            <div className="text-[10px] text-gray-400">
              {surplus.basis === "confirmed" ? "Confirmed" : "Estimated"}
            </div>
          </div>

          <div className="mt-[8px] flex flex-wrap items-center gap-[6px]">
            <span
              className={cn(
                "inline-flex items-center gap-[3px] rounded-md px-[6px] py-[2px] text-[10px] font-medium",
                stageChipTone
              )}
              title={
                stage.rotDays != null
                  ? `Stage threshold: ${stage.rotDays} days`
                  : "No idle threshold set for this stage"
              }
            >
              <IconClockHour4 size={10} stroke={1.8} />
              {lead.days_in_stage === 1
                ? "1 Day"
                : `${lead.days_in_stage} Days`}
            </span>
            {nextDeadline && (
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-[6px] py-[2px] text-[10px] font-medium",
                  nextDeadline.tone === "danger"
                    ? "bg-[#fef2f2] text-danger"
                    : nextDeadline.tone === "warn"
                      ? "bg-warn-bg text-warn-strong"
                      : "bg-gray-100 text-gray-500"
                )}
                title={`${nextDeadline.label} · ${nextDeadline.formattedDate}`}
              >
                {nextDeadline.shortLabel}
              </span>
            )}
            {lead.overdueTaskCount > 0 && (
              <span
                title={
                  lead.overdueTaskCount === 1
                    ? "1 overdue task"
                    : `${lead.overdueTaskCount} overdue tasks`
                }
                className="inline-flex items-center rounded-md bg-[#fef2f2] px-[6px] py-[2px] text-[10px] font-medium text-danger"
              >
                {lead.overdueTaskCount === 1
                  ? "1 Overdue"
                  : `${lead.overdueTaskCount} Overdue`}
              </span>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function computeNextDeadline(lead: KanbanLead): {
  label: string;
  shortLabel: string;
  formattedDate: string;
  daysAway: number;
  tone: "danger" | "warn" | "neutral";
} | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const r = lead.redemption_ends
    ? new Date(lead.redemption_ends + "T00:00:00")
    : null;
  const f = lead.filing_deadline
    ? new Date(lead.filing_deadline + "T00:00:00")
    : null;
  let pick: { d: Date; label: string } | null = null;
  if (r && f) {
    pick = r.getTime() <= f.getTime()
      ? { d: r, label: "Redemption" }
      : { d: f, label: "Filing" };
  } else if (r) {
    pick = { d: r, label: "Redemption" };
  } else if (f) {
    pick = { d: f, label: "Filing" };
  }
  if (!pick) return null;
  const daysAway = Math.floor((pick.d.getTime() - today.getTime()) / 86_400_000);
  const tone: "danger" | "warn" | "neutral" =
    daysAway < 0 ? "danger" : daysAway <= 14 ? "danger" : daysAway <= 30 ? "warn" : "neutral";
  const shortLabel =
    daysAway < 0
      ? `${pick.label} ${Math.abs(daysAway)}d Past Due`
      : daysAway === 0
        ? `${pick.label} Today`
        : `${pick.label} ${daysAway}d`;
  const formattedDate = pick.d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { label: pick.label, shortLabel, formattedDate, daysAway, tone };
}
