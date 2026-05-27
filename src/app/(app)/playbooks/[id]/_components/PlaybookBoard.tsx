"use client";

import { useRef } from "react";
import Link from "next/link";
import { formatCurrency, toTitleCase } from "@/lib/leads/format";
import type {
  PlaybookBoard as PlaybookBoardType,
  PlaybookBoardLead,
} from "@/lib/playbooks/types";
import { cn } from "@/lib/cn";

// Per-template Kanban: one column per template step, cards = leads currently
// sitting on that step. Layout mirrors the existing /leads Kanban so the visual
// language stays consistent. No drag-drop (a lead moves between steps by
// checking off its current step on the lead's Research tab; pulling that into
// a drag-drop interaction is a follow-up).

const COLUMN_WIDTH = 240;
const COLUMN_GAP = 10;

export function PlaybookBoard({ board }: { board: PlaybookBoardType }) {
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
    board.steps.length * COLUMN_WIDTH +
    Math.max(0, board.steps.length - 1) * COLUMN_GAP;

  if (board.steps.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-surface p-8 text-center text-sm text-gray-500">
        This playbook has no steps defined. Add steps in Settings → Templates.
      </div>
    );
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
          {board.steps.map((step) => (
            <div
              key={step.index}
              className="w-[240px] shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
            >
              <div className="flex items-center justify-between border-b border-gray-200 bg-surface px-3 py-[11px]">
                <div className="flex items-center gap-[7px] text-xs font-medium text-ink">
                  <span className="rounded bg-petrol-500 px-[6px] py-[1px] text-[10px] font-semibold text-white">
                    {step.index + 1}
                  </span>
                  <span className="truncate">{step.name}</span>
                </div>
                <span className="text-[11px] font-medium text-gray-500">
                  {step.leads.length}
                </span>
              </div>
              <div className="min-h-[460px] space-y-[7px] p-2">
                {step.leads.length === 0 ? (
                  <div className="px-2 py-4 text-center text-[11px] text-gray-400">
                    No leads here
                  </div>
                ) : (
                  step.leads.map((lead) => <PlaybookCard key={lead.id} lead={lead} />)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaybookCard({ lead }: { lead: PlaybookBoardLead }) {
  const locationLine = [lead.county ? toTitleCase(lead.county) : null, lead.state]
    .filter(Boolean)
    .join(", ");
  const daysLabel = (() => {
    if (lead.daysInStep == null) return null;
    if (lead.daysInStep === 0) return "Today";
    if (lead.daysInStep === 1) return "1 Day In Step";
    return `${lead.daysInStep} Days In Step`;
  })();

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block rounded-md border border-gray-200 bg-surface px-[11px] py-[10px] shadow-card transition-colors hover:border-petrol-300"
    >
      <div className="truncate text-[12px] font-medium text-ink">
        {lead.address}
      </div>
      {lead.ownerName && (
        <div className="mt-[2px] truncate text-[11px] text-gray-500">
          {lead.ownerName}
        </div>
      )}
      {locationLine && (
        <div className="mt-[1px] truncate text-[10.5px] text-gray-400">
          {locationLine}
        </div>
      )}
      {lead.surplus != null && (
        <div className="mt-[7px] whitespace-nowrap text-[11px]">
          <span className="text-gray-400">Surplus: </span>
          <span
            className={cn(
              "font-medium",
              lead.surplusConfirmed ? "text-ink" : "text-gray-500"
            )}
          >
            {lead.surplusConfirmed ? "" : "Est. "}
            {formatCurrency(lead.surplus)}
          </span>
        </div>
      )}
      {daysLabel && (
        <div
          className={cn(
            "mt-[6px] text-[10.5px]",
            lead.daysInStep != null && lead.daysInStep >= 7
              ? "text-red-600"
              : "text-gray-500"
          )}
        >
          {daysLabel}
        </div>
      )}
    </Link>
  );
}
