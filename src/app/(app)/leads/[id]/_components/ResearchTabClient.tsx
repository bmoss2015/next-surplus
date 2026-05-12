"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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

// Fix JJJJ: Research tab. A lead carries its own snapshot of one or more
// checklists (each rendered as a collapsible section, steps laid out 3 per
// row). Steps belong to the lead — editing a Settings template never rewrites
// them. Each step is a single Done checkbox plus a findings field; Overall
// Findings is mirrored into the Notes feed when saved.

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
              steps: t.steps.map((s, j) =>
                j === sIdx ? { ...s, ...patch } : s
              ),
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

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0a3d4a]">
          Research
        </h3>
        <div className="relative" ref={addRef}>
          <button
            type="button"
            onClick={() => setAddOpen((o) => !o)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-petrol-500 px-2.5 py-[5px] text-[11.5px] font-medium text-petrol-500 hover:bg-petrol-50"
          >
            <IconPlus size={13} stroke={1.75} />
            Add From Template
          </button>
          {addOpen && (
            <div className="absolute right-0 z-30 mt-1 max-h-72 w-[260px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-elevated">
              {availableTemplates.length === 0 ? (
                <div className="px-3 py-2 text-[12px] text-gray-500">
                  No research templates in Settings yet.
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
      </div>

      {templates.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-[#f8fafc] px-4 py-6 text-center">
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
                className="rounded-md border border-gray-200 bg-[#f8fafc]"
              >
                <button
                  type="button"
                  onClick={() => toggleCollapsed(tIdx, t.id)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left"
                >
                  {t.collapsed ? (
                    <IconChevronRight size={14} stroke={2} className="text-gray-500" />
                  ) : (
                    <IconChevronDown size={14} stroke={2} className="text-gray-500" />
                  )}
                  <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#0a3d4a]">
                    {t.name}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400">
                    {doneCount}/{t.steps.length}
                  </span>
                </button>
                {!t.collapsed && (
                  <div className="grid grid-cols-1 gap-3 px-3 pb-3 md:grid-cols-2 xl:grid-cols-3">
                    {t.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={cn(
                          "flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3 transition-opacity",
                          step.done && "opacity-60"
                        )}
                      >
                        <label className="flex cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            checked={step.done}
                            onChange={() => toggleDone(tIdx, sIdx, t.id)}
                            className="mt-[2px] h-[14px] w-[14px] shrink-0 cursor-pointer"
                          />
                          <span
                            className={cn(
                              "text-[13px] font-medium leading-snug text-ink",
                              step.done && "line-through"
                            )}
                          >
                            {step.name}
                          </span>
                        </label>
                        {step.instructions && (
                          <div className="text-[11.5px] leading-snug text-gray-500">
                            {step.instructions}
                          </div>
                        )}
                        {step.url && (
                          <a
                            href={step.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex cursor-pointer items-center gap-1 break-all text-[11.5px] text-petrol-500 underline hover:text-petrol-700"
                          >
                            {step.url}
                            <IconExternalLink size={12} stroke={1.75} className="shrink-0" />
                          </a>
                        )}
                        <textarea
                          value={step.findings ?? ""}
                          onChange={(e) =>
                            updateStep(tIdx, sIdx, { findings: e.target.value })
                          }
                          onBlur={() => commitStepFindings(tIdx, sIdx, t.id)}
                          rows={3}
                          placeholder="Findings For This Step"
                          className="w-full resize-y rounded-md border border-gray-200 bg-surface px-2.5 py-[7px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <label className="mb-1 block text-[10px] font-medium tracking-[0.5px] text-gray-500">
          Overall Findings
        </label>
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
