"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  IconExternalLink,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import {
  setLeadResearchStepDone,
  saveLeadResearchStepFindings,
  setLeadResearchTemplateCollapsed,
  addResearchTemplateToLead,
  removeResearchTemplateFromLead,
  saveOverallFindings,
} from "../_actions";
import type {
  LeadResearchTemplate,
  AvailableTemplate,
} from "@/lib/leads/fetch-research";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/cn";

// Fix JJJJ / UUUU / OOOO2 / SSSS2 / ZZZZ2: Research tab. A lead carries its own
// snapshot of one or more checklists. Each checklist is a collapsible section
// with a petrol-tinted header (name · "X / Y Steps Done" · collapse chevron ·
// Remove) and a thin petrol progress bar that updates immediately on toggle.
// Step cards are a strict 3-per-row grid (each card — and the findings textarea
// inside it — is exactly 1/3 of the row width, never wider; extra cards wrap to
// the next row, left-aligned). "Add From Template" opens a modal of the org's
// templates; picking one writes its steps onto the lead. Template names render
// as section headers with dashes replaced by spaces. Removing a checklist (with
// confirmation) deletes only this lead's copy — the Settings template is kept.

// Fix OOOO2 / ZZZZ2 PART 5: dashes in a template name become spaces when shown
// as a section header. "Pre-Call Checklist" → "Pre Call Checklist".
function displayHeader(name: string): string {
  return name.replace(/-/g, " ");
}

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
  const [pickerOpen, setPickerOpen] = useState(false);
  // Index of the checklist pending removal confirmation, or null.
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);

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

  function pickTemplate(templateId: string) {
    setPickerOpen(false);
    startTransition(async () => {
      await addResearchTemplateToLead(leadId, templateId);
    });
  }

  function confirmRemove() {
    const tIdx = confirmRemoveIdx;
    if (tIdx == null) return;
    const lrtId = templates[tIdx]?.id;
    setConfirmRemoveIdx(null);
    if (!lrtId) return;
    setTemplates((prev) => prev.filter((_, i) => i !== tIdx));
    startTransition(async () => {
      await removeResearchTemplateFromLead(lrtId);
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
    <button
      type="button"
      onClick={() => setPickerOpen(true)}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-petrol-500 px-3 py-[6px] text-xs font-medium text-petrol-500 hover:bg-petrol-50"
    >
      <IconPlus size={13} stroke={1.75} />
      Add From Template
    </button>
  );

  const pendingRemoveName =
    confirmRemoveIdx != null ? templates[confirmRemoveIdx]?.name ?? "" : "";

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
            onClick={() => setPickerOpen(true)}
            className="btn-primary mt-3 inline-flex items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium"
          >
            <IconPlus size={13} stroke={1.75} />
            Add From Template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t, tIdx) => {
            const total = t.steps.length;
            const doneCount = t.steps.filter((s) => s.done).length;
            const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-[#f8fafc]"
              >
                {/* Fix SSSS2 PART 3: petrol-tinted header — name · progress ·
                    collapse toggle · Remove. */}
                <div className="flex items-center gap-2 border-b border-gray-200 bg-[#e8f4f6] px-3 py-[10px]">
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(tIdx, t.id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                  >
                    {t.collapsed ? (
                      <IconChevronRight size={14} stroke={2.25} className="shrink-0 text-gray-500" />
                    ) : (
                      <IconChevronDown size={14} stroke={2.25} className="shrink-0 text-gray-500" />
                    )}
                    <span className="truncate text-[13px] font-medium text-[#0a3d4a]">
                      {displayHeader(t.name)}
                    </span>
                  </button>
                  <span className="shrink-0 text-[11px] font-medium text-gray-500">
                    {doneCount} / {total} {total === 1 ? "Step" : "Steps"} Done
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveIdx(tIdx)}
                    className="shrink-0 cursor-pointer rounded p-[2px] text-gray-400 hover:bg-white hover:text-danger"
                    aria-label="Remove template from lead"
                    title="Remove from lead"
                  >
                    <IconX size={14} stroke={2.25} />
                  </button>
                </div>
                {/* Fix SSSS2 PART 4: thin progress bar reflecting done / total. */}
                <div className="h-[3px] w-full bg-gray-200">
                  <div
                    className="h-full bg-[#0d6c7d] transition-[width] duration-200"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!t.collapsed && (
                  // Fix ZZZZ2 PART 1: strict 3-per-row grid — every step card is
                  // exactly 1/3 of the row width (1fr columns), left-aligned,
                  // wrapping to a new row after the third. No full-width cards.
                  <div className="grid auto-rows-fr grid-cols-3 gap-3 p-3">
                    {t.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={cn(
                          "flex min-w-0 gap-2 rounded-xl border p-3 transition-colors",
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
                          <span
                            className={cn(
                              "block text-[13px] font-medium leading-snug text-ink",
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
                              className="mt-[2px] inline-flex cursor-pointer items-center gap-1 break-all text-[11px] text-petrol-500 underline hover:text-petrol-700"
                            >
                              {step.url}
                              <IconExternalLink size={10} stroke={1.75} className="shrink-0" />
                            </a>
                          )}
                          {step.instructions && (
                            <div className="mt-[2px] text-[11px] leading-snug text-gray-500">
                              {step.instructions}
                            </div>
                          )}
                          {/* Findings textarea is full-width *of the card* —
                              i.e. it never exceeds the card's 1/3 row width. */}
                          <textarea
                            value={step.findings ?? ""}
                            onChange={(e) =>
                              updateStep(tIdx, sIdx, { findings: e.target.value })
                            }
                            onBlur={() => commitStepFindings(tIdx, sIdx, t.id)}
                            rows={3}
                            placeholder="Findings"
                            className="mt-2 w-full resize-y rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
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

      {/* Fix OOOO2 PART 2: Add From Template modal. */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add From Template">
        {availableTemplates.length === 0 ? (
          <div className="text-[13px] text-gray-600">
            No templates found.{" "}
            <Link href="/settings" className="font-medium text-petrol-500 hover:text-petrol-700">
              Go to Settings to create one.
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {availableTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTemplate(t.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] text-ink hover:bg-[#e0f2f7]"
              >
                <span className="font-medium">{displayHeader(t.name)}</span>
                {(t.state || t.saleType) && (
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {[t.state, t.saleType].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Fix SSSS2 PART 1: confirm before removing a checklist from this lead. */}
      <Modal
        open={confirmRemoveIdx != null}
        onClose={() => setConfirmRemoveIdx(null)}
        title="Remove Template From Lead"
      >
        <p className="text-[13px] leading-relaxed text-gray-700">
          Remove{pendingRemoveName ? ` "${displayHeader(pendingRemoveName)}"` : " this template"} from this lead? Steps and findings will be deleted. This does not affect the template in Settings.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmRemoveIdx(null)}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmRemove}
            className="cursor-pointer rounded-md bg-danger px-3 py-[6px] text-xs font-medium text-white hover:opacity-90"
          >
            Remove From Lead
          </button>
        </div>
      </Modal>
    </div>
  );
}
