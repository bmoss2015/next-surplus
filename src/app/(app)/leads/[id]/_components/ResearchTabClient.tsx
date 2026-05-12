"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  IconExternalLink,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import {
  setLeadResearchStepDone,
  saveLeadResearchStepFindings,
  setLeadResearchTemplateCollapsed,
  addResearchTemplateToLead,
  saveOverallFindings,
} from "../_actions";
import type {
  LeadResearchTemplate,
  AvailableTemplate,
} from "@/lib/leads/fetch-research";
import { cn } from "@/lib/cn";

// Fix JJJJ + Fix UUUU: Research tab. A lead carries its own snapshot of one or
// more checklists. Each checklist is a collapsible section (heavier header with
// a divider above its steps); steps are a full-width vertical stack of cards —
// checkbox left, title/description/findings stacked in the body, completed rows
// strikethrough + greyed. Overall Findings gets its own card with a Save
// button; "Add From Template" pulls a checklist in from Settings.

export function ResearchTabClient({
  leadId,
  templates: initialTemplates,
  availableTemplates,
  overallFindings,
}: {
  leadId: string;
  templates: LeadResearchTemplate[];
  availableTemplates: AvailableTemplate[];
  overallFindings: string | null;
}) {
  const [, startTransition] = useTransition();
  const [templates, setTemplates] =
    useState<LeadResearchTemplate[]>(initialTemplates);
  const [overall, setOverall] = useState(overallFindings ?? "");
  const [savedOverall, setSavedOverall] = useState(overallFindings ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) return;
    function onClick(e: MouseEvent) {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [addOpen]);

  function updateStep(
    tIdx: number,
    sIdx: number,
    patch: Partial<LeadResearchTemplate["steps"][number]>
  ) {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx
          ? {
              ...t,
              steps: t.steps.map((s, j) => (j === sIdx ? { ...s, ...patch } : s)),
            }
          : t
      )
    );
  }

  function toggleDone(tIdx: number, sIdx: number, lrtId: string) {
    const next = !templates[tIdx].steps[sIdx].done;
    updateStep(tIdx, sIdx, { done: next });
    startTransition(async () => {
      await setLeadResearchStepDone(lrtId, sIdx, next);
    });
  }

  function commitStepFindings(tIdx: number, sIdx: number, lrtId: string) {
    const findings = templates[tIdx].steps[sIdx].findings ?? "";
    startTransition(async () => {
      await saveLeadResearchStepFindings(lrtId, sIdx, findings);
    });
  }

  function toggleCollapsed(tIdx: number, lrtId: string) {
    const next = !templates[tIdx].collapsed;
    setTemplates((prev) =>
      prev.map((t, i) => (i === tIdx ? { ...t, collapsed: next } : t))
    );
    startTransition(async () => {
      await setLeadResearchTemplateCollapsed(lrtId, next);
    });
  }

  function addTemplate(templateId: string) {
    setAddOpen(false);
    startTransition(async () => {
      await addResearchTemplateToLead(leadId, templateId);
    });
  }

  function commitOverall() {
    if (overall === savedOverall) return;
    setSavedOverall(overall);
    startTransition(async () => {
      await saveOverallFindings(leadId, overall);
    });
  }

  const overallDirty = overall !== savedOverall;

  const addButton = (
    <div className="relative" ref={addRef}>
      <button
        type="button"
        onClick={() => setAddOpen((o) => !o)}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-petrol-500 px-3 py-[6px] text-xs font-medium text-petrol-500 hover:bg-petrol-50"
      >
        <IconPlus size={13} stroke={1.75} />
        Add From Template
      </button>
      {addOpen && (
        <div className="absolute right-0 z-30 mt-1 max-h-72 w-[280px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-elevated">
          {availableTemplates.length === 0 ? (
            <div className="px-3 py-3 text-[12px] text-gray-500">
              No research templates exist yet.{" "}
              <Link
                href="/settings"
                className="font-medium text-petrol-500 hover:text-petrol-700"
              >
                Create one in Settings →
              </Link>
            </div>
          ) : (
            availableTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => addTemplate(t.id)}
                className="block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] text-ink hover:bg-[#e0f2f7]"
              >
                {t.name}
                {(t.state || t.saleType) && (
                  <span className="ml-1 text-[11px] text-gray-400">
                    {[t.state, t.saleType].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">
          Research
        </h3>
        {addButton}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-[#f8fafc] px-4 py-7 text-center">
          <div className="text-[12.5px] text-gray-500">
            No research checklist on this lead yet.
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="btn-primary mt-3 inline-flex items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium"
          >
            <IconPlus size={13} stroke={1.75} />
            Add From Template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t, tIdx) => {
            const doneCount = t.steps.filter((s) => s.done).length;
            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-[#f8fafc]"
              >
                <button
                  type="button"
                  onClick={() => toggleCollapsed(tIdx, t.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-3 py-[10px] text-left",
                    !t.collapsed && "border-b border-gray-200"
                  )}
                >
                  {t.collapsed ? (
                    <IconChevronRight size={14} stroke={2.25} className="text-gray-500" />
                  ) : (
                    <IconChevronDown size={14} stroke={2.25} className="text-gray-500" />
                  )}
                  <span className="text-[12.5px] font-extrabold uppercase tracking-[0.07em] text-[#0a3d4a]">
                    {t.name}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400">
                    {doneCount}/{t.steps.length}
                  </span>
                </button>
                {!t.collapsed && (
                  <div className="space-y-3 p-3">
                    {t.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={cn(
                          "flex gap-3 rounded-xl border p-3 transition-colors",
                          step.done
                            ? "border-gray-200 bg-[#f1f5f9]"
                            : "border-gray-200 bg-white"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={step.done}
                          onChange={() => toggleDone(tIdx, sIdx, t.id)}
                          className="mt-[3px] h-[14px] w-[14px] shrink-0 cursor-pointer"
                          aria-label={step.done ? "Mark not done" : "Mark done"}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span
                              className={cn(
                                "text-[13px] font-medium leading-snug text-ink",
                                step.done && "text-gray-400 line-through"
                              )}
                            >
                              {step.name}
                            </span>
                            {step.url && (
                              <a
                                href={step.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex cursor-pointer items-center gap-1 break-all text-[11.5px] text-petrol-500 underline hover:text-petrol-700"
                              >
                                {step.url}
                                <IconExternalLink size={11} stroke={1.75} className="shrink-0" />
                              </a>
                            )}
                          </div>
                          {step.instructions && (
                            <div className="mt-[2px] text-[11.5px] leading-snug text-gray-500">
                              {step.instructions}
                            </div>
                          )}
                          <textarea
                            value={step.findings ?? ""}
                            onChange={(e) =>
                              updateStep(tIdx, sIdx, { findings: e.target.value })
                            }
                            onBlur={() => commitStepFindings(tIdx, sIdx, t.id)}
                            rows={2}
                            placeholder="Findings For This Step"
                            className="mt-2 w-full resize-y rounded-md border border-gray-200 bg-surface px-2.5 py-[7px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-gray-200 bg-[#f8fafc] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">
            Overall Findings
          </span>
          <button
            type="button"
            onClick={commitOverall}
            disabled={!overallDirty}
            className="btn-primary cursor-pointer rounded-md px-3 py-[5px] text-[11.5px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Findings
          </button>
        </div>
        <textarea
          value={overall}
          onChange={(e) => setOverall(e.target.value)}
          onBlur={commitOverall}
          rows={4}
          placeholder="Summarize your research findings here. Saved findings are also posted as a note on this lead."
          className="w-full resize-y rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
      </div>
    </div>
  );
}
