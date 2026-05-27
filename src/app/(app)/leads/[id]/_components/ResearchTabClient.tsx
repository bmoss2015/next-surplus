"use client";

import { useMemo, useState, useTransition } from "react";
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

// Fix ZZZZ2: Research tab. A lead carries its own snapshot of one or more
// checklists. Each checklist is a collapsible section with a petrol-tinted
// header (name · "X / Y Steps Done" · collapse chevron · X to remove) and a thin
// petrol progress bar. PART 6: steps render as a single-column list (no boxes,
// no grid) — checkbox, step name (font-medium; struck-through and faded when
// done), description in muted text below, and an "Add Findings" / "Edit
// Findings" link on the right; the findings textarea is hidden until clicked (or
// shown automatically when findings already exist), indented under the step
// name, no border, with a subtle tint. PART 5: "Add From Template" opens a modal
// listing the org's templates with state / sale-type tags and a step count;
// templates already on the lead show as "Added" and can't be added again;
// picking one writes its steps onto the lead and appears immediately.

// Fix OOOO2 / ZZZZ2: dashes in a template name become spaces when shown as a
// section header. "Pre-Call Checklist" → "Pre Call Checklist".
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
  // Step keys (`${tIdx}:${sIdx}`) whose findings editor the user has opened.
  const [openFindings, setOpenFindings] = useState<Set<string>>(new Set());
  // Index of the checklist pending removal confirmation, or null.
  const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);

  // Source-template ids already on this lead — kept in sync with local state so
  // the picker reflects an optimistic add right away.
  const addedSourceIds = useMemo(
    () => new Set(templates.map((t) => t.sourceTemplateId).filter((x): x is string => !!x)),
    [templates]
  );

  function updateStep(
    tIdx: number,
    sIdx: number,
    patch: Partial<LeadResearchTemplate["steps"][number]>
  ) {
    setTemplates((prev) =>
      prev.map((t, i) =>
        i === tIdx
          ? { ...t, steps: t.steps.map((s, j) => (j === sIdx ? { ...s, ...patch } : s)) }
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

  function openFindingsEditor(tIdx: number, sIdx: number) {
    setOpenFindings((prev) => new Set(prev).add(`${tIdx}:${sIdx}`));
  }

  function toggleCollapsed(tIdx: number, lrtId: string) {
    const next = !templates[tIdx].collapsed;
    setTemplates((prev) => prev.map((t, i) => (i === tIdx ? { ...t, collapsed: next } : t)));
    startTransition(async () => {
      await setLeadResearchTemplateCollapsed(lrtId, next);
    });
  }

  function pickTemplate(templateId: string) {
    if (addedSourceIds.has(templateId)) return;
    setPickerOpen(false);
    startTransition(async () => {
      const res = await addResearchTemplateToLead(leadId, templateId);
      if (res.ok) {
        setTemplates((prev) => [
          ...prev,
          {
            id: res.template.id,
            sourceTemplateId: res.template.sourceTemplateId,
            name: res.template.name,
            collapsed: res.template.collapsed,
            steps: res.template.steps,
          },
        ]);
      }
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
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0d4b3a]">
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
                className="overflow-hidden rounded-xl border border-gray-200 bg-surface"
              >
                {/* Petrol-tinted section header — name · progress · collapse · X. */}
                <div className="flex items-center gap-2 border-b border-gray-200 bg-[#f3f4f6] px-3 py-[10px]">
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
                    <span className="truncate text-[13px] font-medium text-[#0d4b3a]">
                      {displayHeader(t.name)}
                    </span>
                  </button>
                  <span className="shrink-0 text-[11px] font-medium text-gray-500">
                    {doneCount} / {total} {total === 1 ? "Step" : "Steps"} Done
                  </span>
                  {t.sourceTemplateId && (
                    <Link
                      href={`/playbooks/${t.sourceTemplateId}`}
                      className="shrink-0 text-[11px] font-medium text-[#0d4b3a] hover:underline"
                      title="See every lead currently using this playbook"
                    >
                      View Board →
                    </Link>
                  )}
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
                {/* Thin progress bar reflecting done / total. */}
                <div className="h-[3px] w-full bg-gray-200">
                  <div
                    className="h-full bg-[#13644e] transition-[width] duration-200"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!t.collapsed && (
                  <div className="divide-y divide-gray-150">
                    {t.steps.map((step, sIdx) => {
                      const hasFindings = (step.findings ?? "").trim() !== "";
                      const findingsOpen = hasFindings || openFindings.has(`${tIdx}:${sIdx}`);
                      return (
                        <div
                          key={sIdx}
                          className={cn(
                            "flex items-start gap-3 px-3 py-[10px] transition-opacity",
                            step.done && "opacity-60"
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
                            <div className="flex items-start justify-between gap-3">
                              <span
                                className={cn(
                                  "text-[13px] font-medium leading-snug text-ink",
                                  step.done && "text-gray-400 line-through"
                                )}
                              >
                                {step.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => openFindingsEditor(tIdx, sIdx)}
                                className="shrink-0 cursor-pointer whitespace-nowrap text-[11px] text-gray-500 underline-offset-2 hover:text-petrol-700 hover:underline"
                              >
                                {hasFindings ? "Edit Findings" : "Add Findings"}
                              </button>
                            </div>
                            {step.instructions && (
                              <div className="mt-[2px] text-[11.5px] leading-snug text-gray-500">
                                {step.instructions}
                              </div>
                            )}
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
                            {findingsOpen && (
                              <textarea
                                value={step.findings ?? ""}
                                onChange={(e) => updateStep(tIdx, sIdx, { findings: e.target.value })}
                                onBlur={() => commitStepFindings(tIdx, sIdx, t.id)}
                                rows={3}
                                placeholder="Findings"
                                autoFocus={!hasFindings}
                                className="mt-2 w-full resize-y rounded-md bg-[#f1f5f9] px-2 py-[6px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-petrol-200"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-gray-200 bg-[#f8fafc] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0d4b3a]">
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

      {/* PART 5: Add From Template modal. */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add From Template">
        {availableTemplates.length === 0 ? (
          <div className="text-[13px] text-gray-600">
            No research templates yet. Add templates in{" "}
            <Link href="/settings" className="font-medium text-petrol-500 hover:text-petrol-700">
              Settings
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-1">
            {availableTemplates.map((t) => {
              const isAdded = t.alreadyAdded || addedSourceIds.has(t.id);
              const meta = [
                ...(t.state ? [t.state] : []),
                ...(t.saleType ? [t.saleType] : []),
                `${t.stepCount} ${t.stepCount === 1 ? "step" : "steps"}`,
              ].join(" · ");
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={isAdded}
                  onClick={() => pickTemplate(t.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[13px]",
                    isAdded
                      ? "cursor-not-allowed text-gray-400"
                      : "cursor-pointer text-ink hover:bg-[#f3f4f6]"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{displayHeader(t.name)}</span>
                    <span className="block text-[11px] text-gray-400">{meta}</span>
                  </span>
                  {isAdded && (
                    <span className="shrink-0 rounded bg-gray-150 px-2 py-[2px] text-[10.5px] font-medium text-gray-500">
                      Added
                    </span>
                  )}
                </button>
              );
            })}
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
