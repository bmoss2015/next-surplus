"use client";

// List-view alternative to the per-playbook Kanban. One row per step with
// counts + oldest-stuck lead. Renders cleanly at any step count (vs Kanban
// which gets unwieldy horizontally past ~8 columns). To work individual
// leads, users switch to Board view via the toggle.

import type { PlaybookBoard } from "@/lib/playbooks/types";

const STUCK_DAYS = 7;

export function PlaybookListView({ board }: { board: PlaybookBoard }) {
  if (board.steps.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-surface p-8 text-center text-sm text-gray-500">
        This playbook has no steps yet. Open it in Settings to add some.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-surface">
      <div className="grid grid-cols-[40px_1fr_80px_90px_240px] items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
        <span>#</span>
        <span>Step</span>
        <span className="text-right">Leads</span>
        <span className="text-right">Stuck &gt;7d</span>
        <span>Oldest In Step</span>
      </div>
      {board.steps.map((step) => {
        const leadCount = step.leads.length;
        const stuck = step.leads.filter(
          (l) => l.daysInStep != null && l.daysInStep >= STUCK_DAYS
        ).length;
        const oldest = step.leads.reduce<{ name: string; days: number } | null>(
          (acc, l) => {
            if (l.daysInStep == null) return acc;
            if (!acc || l.daysInStep > acc.days) {
              return { name: l.address, days: l.daysInStep };
            }
            return acc;
          },
          null
        );
        return (
          <div
            key={step.index}
            className="grid grid-cols-[40px_1fr_80px_90px_240px] items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50"
          >
            <span className="text-sm text-gray-500">{step.index + 1}</span>
            <span className="truncate text-sm font-medium text-ink">
              {step.name}
            </span>
            <span className="text-right text-sm text-ink">{leadCount}</span>
            <span
              className={`text-right text-sm ${
                stuck > 0 ? "font-medium text-red-600" : "text-gray-500"
              }`}
            >
              {stuck}
            </span>
            <span
              className={`truncate text-xs ${
                oldest && oldest.days >= STUCK_DAYS
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
              title={oldest?.name}
            >
              {oldest ? `${oldest.name} · ${oldest.days}d` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
