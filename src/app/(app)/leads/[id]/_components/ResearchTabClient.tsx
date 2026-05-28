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

// Parse a step name into { parent, leaf } when it follows the
// "Parent · Child" format the snapshot flatten emits for nested templates.
// Plain steps (no separator) are treated as their own parent group with a
// single leaf using the same name — render path renders them as one row.
function splitStepName(name: string): { parent: string; leaf: string } {
  const i = name.indexOf(" · ");
  if (i <= 0) return { parent: name, leaf: name };
  return { parent: name.slice(0, i), leaf: name.slice(i + 3) };
}

type Group = {
  parent: string;
  leaves: Array<{ name: string; idx: number; isStandalone: boolean }>;
};

function groupSteps(steps: LeadResearchTemplate["steps"]): Group[] {
  const groups: Group[] = [];
  let cur: Group | null = null;
  steps.forEach((step, idx) => {
    const { parent, leaf } = splitStepName(step.name);
    const isStandalone = leaf === parent;
    if (isStandalone) {
      cur = { parent, leaves: [{ name: leaf, idx, isStandalone: true }] };
      groups.push(cur);
      cur = null;
    } else {
      if (!cur || cur.parent !== parent) {
        cur = { parent, leaves: [] };
        groups.push(cur);
      }
      cur.leaves.push({ name: leaf, idx, isStandalone: false });
    }
  });
  return groups;
}

export type LeadInfo = {
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  saleType: string | null;
  importedAt: string | null;
  stage: string | null;
};

export function ResearchTabClient({
  leadId,
  templates: initialTemplates,
  availableTemplates,
  overallFindings,
  leadInfo,
}: {
  leadId: string;
  templates: LeadResearchTemplate[];
  availableTemplates: AvailableTemplate[];
  overallFindings: string | null;
  leadInfo: LeadInfo;
}) {
  const [, startTransition] = useTransition();
  const [templates, setTemplates] =
    useState<LeadResearchTemplate[]>(initialTemplates);
  const [overall, setOverall] = useState(overallFindings ?? "");
  const [savedOverall, setSavedOverall] = useState(overallFindings ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  // Step keys (`${tIdx}:${sIdx}`) whose findings editor the user has opened.
  const [openFindings, setOpenFindings] = useState<Set<string>>(new Set());
  // Step keys that just successfully saved their findings — drives the
  // inline "Saved" badge so reps see the commit landed.
  const [savedFlashes, setSavedFlashes] = useState<Set<string>>(new Set());
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
    const key = `${tIdx}:${sIdx}`;
    startTransition(async () => {
      await saveLeadResearchStepFindings(lrtId, sIdx, findings);
      setSavedFlashes((prev) => new Set(prev).add(key));
      setTimeout(() => {
        setSavedFlashes((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2200);
    });
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
      Add Playbook
    </button>
  );

  const pendingRemoveName =
    confirmRemoveIdx != null ? templates[confirmRemoveIdx]?.name ?? "" : "";

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0d4b3a]">
          Playbooks
        </h3>
        {addButton}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-[#f8fafc] px-4 py-7 text-center">
          <div className="text-[12.5px] text-gray-500">
            No playbook on this lead yet.
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="btn-primary mt-3 inline-flex items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium"
          >
            <IconPlus size={13} stroke={1.75} />
            Add Playbook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t, tIdx) => (
            <PlaybookTimeline
              key={t.id}
              t={t}
              tIdx={tIdx}
              leadInfo={leadInfo}
              openFindings={openFindings}
              setOpenFindings={setOpenFindings}
              savedFlashes={savedFlashes}
              onToggleDone={toggleDone}
              onUpdateStep={updateStep}
              onCommitFindings={commitStepFindings}
              onCollapseToggle={() => toggleCollapsed(tIdx, t.id)}
              onRemove={() => setConfirmRemoveIdx(tIdx)}
            />
          ))}
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

      {/* Add Playbook modal: lists every playbook in the org. Each row has
          an explicit "Add" button so the action is unmistakable; already-
          added playbooks show a disabled "Added" pill instead. */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add Playbook">
        {availableTemplates.length === 0 ? (
          <div className="text-[13px] text-gray-600">
            No playbooks yet. Create one in{" "}
            <Link href="/playbooks" className="font-medium text-petrol-500 hover:text-petrol-700">
              Playbooks
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
                `${t.stepCount} ${t.stepCount === 1 ? "Step" : "Steps"}`,
              ].join(" · ");
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[13px] hover:bg-[#f3f4f6]"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">
                      {displayHeader(t.name)}
                    </span>
                    <span className="block text-[11px] text-gray-400">{meta}</span>
                  </span>
                  {isAdded ? (
                    <span className="shrink-0 rounded bg-gray-150 px-2 py-[3px] text-[10.5px] font-medium text-gray-500">
                      Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pickTemplate(t.id)}
                      className="btn-primary shrink-0 cursor-pointer rounded-md px-3 py-[5px] text-[11.5px] font-medium text-white"
                    >
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Fix SSSS2 PART 1: confirm before removing a playbook from this lead. */}
      <Modal
        open={confirmRemoveIdx != null}
        onClose={() => setConfirmRemoveIdx(null)}
        title="Remove Playbook From Lead"
      >
        <p className="text-[13px] leading-relaxed text-gray-700">
          Remove{pendingRemoveName ? ` "${displayHeader(pendingRemoveName)}"` : " this playbook"} from this lead? Steps and findings will be deleted. This does not affect the playbook in Settings.
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

      <PlaybookTimelineCss />
    </div>
  );
}

function formatUSDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function PlaybookTimeline({
  t,
  tIdx,
  leadInfo,
  openFindings,
  setOpenFindings,
  savedFlashes,
  onToggleDone,
  onUpdateStep,
  onCommitFindings,
  onCollapseToggle,
  onRemove,
}: {
  t: LeadResearchTemplate;
  tIdx: number;
  leadInfo: LeadInfo;
  openFindings: Set<string>;
  setOpenFindings: React.Dispatch<React.SetStateAction<Set<string>>>;
  savedFlashes: Set<string>;
  onToggleDone: (tIdx: number, sIdx: number, lrtId: string) => void;
  onUpdateStep: (
    tIdx: number,
    sIdx: number,
    patch: Partial<LeadResearchTemplate["steps"][number]>
  ) => void;
  onCommitFindings: (tIdx: number, sIdx: number, lrtId: string) => void;
  onCollapseToggle: () => void;
  onRemove: () => void;
}) {
  const groups = useMemo(() => groupSteps(t.steps), [t.steps]);
  const total = t.steps.length;
  const doneCount = t.steps.filter((s) => s.done).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const nextIdx = t.steps.findIndex((s) => !s.done);
  const stageCount = groups.length;
  const subStepCount = groups.reduce(
    (acc, g) => acc + (g.leaves.length > 1 || !g.leaves[0]?.isStandalone ? g.leaves.length : 0),
    0
  );

  const ownerName = leadInfo.name ?? "Lead";
  const initials = ownerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "LD";
  const addressLine = [
    leadInfo.address,
    [leadInfo.city, leadInfo.state].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(", ");
  const subParts = [
    addressLine,
    leadInfo.saleType === "TAX"
      ? "Tax Sale"
      : leadInfo.saleType === "MTG"
        ? "Mortgage Foreclosure"
        : null,
    leadInfo.importedAt
      ? `Added ${formatUSDate(leadInfo.importedAt) ?? ""}`.trim()
      : null,
  ].filter(Boolean);

  return (
    <div className="ptl">
      <div className="ptl__lead">
        <div className="ptl__avatar">{initials}</div>
        <div className="ptl__meta">
          <div className="ptl__lead-name">{ownerName}</div>
          {subParts.length > 0 && (
            <div className="ptl__lead-sub">
              {subParts.map((p, i) => (
                <span key={i}>
                  {p}
                  {i < subParts.length - 1 && (
                    <span className="ptl__lead-sep"> · </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
        {leadInfo.stage && (
          <span className="ptl__lead-badge">{leadInfo.stage}</span>
        )}
        <button
          type="button"
          onClick={onCollapseToggle}
          className="ptl__lead-chev"
          aria-label={t.collapsed ? "Expand" : "Collapse"}
        >
          {t.collapsed ? (
            <IconChevronRight size={14} stroke={2.25} />
          ) : (
            <IconChevronDown size={14} stroke={2.25} />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="ptl__lead-x"
          aria-label="Remove template from lead"
          title="Remove from lead"
        >
          <IconX size={14} stroke={2.25} />
        </button>
      </div>

      <div className="ptl__top">
        <div>
          <div className="ptl__title">
            Playbook <span className="ptl__title-sep">·</span>{" "}
            {displayHeader(t.name)}
          </div>
          {t.sourceTemplateId && (
            <Link
              href={`/playbooks/${t.sourceTemplateId}`}
              className="ptl__view"
            >
              View Board →
            </Link>
          )}
        </div>
        <span className="ptl__top-meta">
          {stageCount} {stageCount === 1 ? "Stage" : "Stages"}
          {subStepCount > 0
            ? ` · ${subStepCount} Sub-${subStepCount === 1 ? "Step" : "Steps"}`
            : ""}
        </span>
      </div>

      {!t.collapsed && (
        <div className="ptl__body">
          {groups.map((g, gi) => {
            const groupSteps = g.leaves.map((l) => t.steps[l.idx]);
            const groupDone = groupSteps.every((s) => s.done);
            const groupNext = groupSteps.some((s) => !s.done);
            const isLastGroup = gi === groups.length - 1;
            return (
              <div
                key={gi}
                className={
                  "ptl__node" + (groupDone ? " is-done" : "") + (isLastGroup ? " is-last" : "")
                }
              >
                <div className="ptl__trunk" />
                <div className="ptl__dot" />
                {g.leaves[0]?.isStandalone && g.leaves.length === 1 ? null : (
                  <div className="ptl__group-head">
                    <span className="ptl__group-name">{g.parent}</span>
                    <span className="ptl__group-prog">
                      <strong>{groupSteps.filter((s) => s.done).length}</strong>{" "}
                      of {g.leaves.length} Done
                    </span>
                  </div>
                )}
                <div className="ptl__branch">
                  {g.leaves.map((leaf) => {
                    const step = t.steps[leaf.idx];
                    const isCurrent = leaf.idx === nextIdx;
                    const key = `${tIdx}:${leaf.idx}`;
                    const hasFindings = (step.findings ?? "").trim() !== "";
                    const detailOpen = hasFindings || openFindings.has(key);
                    const labelText =
                      leaf.isStandalone && g.leaves.length === 1
                        ? g.parent
                        : leaf.name;
                    return (
                      <div key={leaf.idx}>
                        <div
                          className={
                            "ptl__leaf" +
                            (step.done ? " is-done" : "") +
                            (isCurrent ? " is-current" : "") +
                            (groupNext ? "" : "")
                          }
                        >
                          <button
                            type="button"
                            onClick={() => onToggleDone(tIdx, leaf.idx, t.id)}
                            className="ptl__check"
                            aria-label={step.done ? "Mark not done" : "Mark done"}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setOpenFindings((prev) => {
                                const next = new Set(prev);
                                if (next.has(key)) next.delete(key);
                                else next.add(key);
                                return next;
                              });
                            }}
                            className="ptl__leaf-body"
                          >
                            <span className="ptl__leaf-label">{labelText}</span>
                            {hasFindings && (
                              <span className="ptl__leaf-noted" title="Has a note">
                                Note
                              </span>
                            )}
                            {isCurrent && (
                              <span className="ptl__leaf-here">Here</span>
                            )}
                          </button>
                        </div>
                        {detailOpen && (
                          <div className="ptl__detail">
                            {step.instructions && (
                              <>
                                <div className="ptl__detail-lbl">Instructions</div>
                                <div className="ptl__detail-body">
                                  {step.instructions}
                                </div>
                              </>
                            )}
                            {step.url && (
                              <>
                                <div className="ptl__detail-lbl">Link</div>
                                <a
                                  href={step.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ptl__detail-link"
                                >
                                  {step.url}
                                  <IconExternalLink size={11} stroke={1.75} />
                                </a>
                              </>
                            )}
                            <div className="ptl__detail-lblrow">
                              <span className="ptl__detail-lbl">Your Notes</span>
                              {savedFlashes.has(key) && (
                                <span className="ptl__detail-saved">
                                  Saved Just Now
                                </span>
                              )}
                            </div>
                            <textarea
                              value={step.findings ?? ""}
                              onChange={(e) =>
                                onUpdateStep(tIdx, leaf.idx, {
                                  findings: e.target.value,
                                })
                              }
                              onBlur={() =>
                                onCommitFindings(tIdx, leaf.idx, t.id)
                              }
                              rows={3}
                              placeholder="What happened on this step? Saves when you click out."
                              autoFocus={!hasFindings}
                              className="ptl__detail-input"
                            />
                            <div className="ptl__detail-hint">
                              Saves automatically when you click out. Notes also
                              appear in the lead Activity feed.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="ptl__progress">
            <span className="ptl__progress-lbl">Playbook Progress</span>
            <div className="ptl__progress-bar">
              <div className="ptl__progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="ptl__progress-stat">
              <strong>{doneCount}</strong> of {total} Done
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaybookTimelineCss() {
  return (
    <style>{`
.ptl { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,41,0.04), 0 1px 3px rgba(15,23,41,0.06); }
.ptl__lead { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-bottom: 1px solid #e5e7eb; background: #fafbfc; border-radius: 10px 10px 0 0; }
.ptl__avatar { width: 36px; height: 36px; border-radius: 50%; background: #0d4b3a; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex: none; }
.ptl__meta { flex: 1; min-width: 0; }
.ptl__lead-name { font-size: 14px; font-weight: 600; color: #0f1729; }
.ptl__lead-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
.ptl__lead-sep { color: #d1d5db; padding: 0 4px; }
.ptl__lead-badge { font-size: 11px; padding: 4px 10px; border-radius: 999px; background: #fff; border: 1px solid #e5e7eb; color: #374151; font-weight: 500; flex: none; }
.ptl__lead-chev { flex: none; background: transparent; border: 0; color: #6b7280; padding: 4px; border-radius: 4px; cursor: pointer; }
.ptl__lead-chev:hover { background: #fff; color: #0f1729; }
.ptl__lead-x { flex: none; background: transparent; border: 0; color: #9ca3af; padding: 4px; border-radius: 4px; cursor: pointer; }
.ptl__lead-x:hover { background: #fff; color: #b91c1c; }

.ptl__top { display: flex; align-items: baseline; justify-content: space-between; padding: 18px 22px 0; gap: 12px; }
.ptl__title { font-size: 16px; font-weight: 600; color: #0f1729; letter-spacing: -0.005em; }
.ptl__title-sep { color: #9ca3af; padding: 0 4px; font-weight: 400; }
.ptl__view { font-size: 11.5px; color: #0d4b3a; font-weight: 500; margin-top: 4px; display: inline-block; }
.ptl__view:hover { text-decoration: underline; }
.ptl__top-meta { font-size: 12px; color: #6b7280; font-variant-numeric: tabular-nums; }

.ptl__body { padding: 18px 22px 22px; }
.ptl__node { position: relative; padding-left: 32px; padding-bottom: 20px; }
.ptl__node.is-last { padding-bottom: 0; }
.ptl__trunk { position: absolute; left: 9px; top: 22px; bottom: -2px; width: 2px; background: #e5e7eb; }
.ptl__node.is-last .ptl__trunk { display: none; }
.ptl__node.is-done .ptl__trunk { background: #0f1729; }
.ptl__dot { position: absolute; left: 3px; top: 4px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #d1d5db; background: #fff; }
.ptl__node.is-done .ptl__dot { background: #0f1729; border-color: #0f1729; }
.ptl__node.is-done .ptl__dot::after { content: ''; position: absolute; left: 2px; top: 0; width: 3px; height: 6px; border: solid #fff; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }

.ptl__group-head { display: flex; align-items: baseline; gap: 10px; }
.ptl__group-name { font-size: 14px; font-weight: 600; color: #0f1729; letter-spacing: -0.005em; }
.ptl__group-prog { font-size: 11.5px; color: #6b7280; margin-left: auto; font-variant-numeric: tabular-nums; }
.ptl__group-prog strong { color: #0f1729; font-weight: 600; }
.ptl__branch { margin-top: 6px; display: flex; flex-direction: column; }

.ptl__leaf { display: grid; grid-template-columns: 22px 1fr; align-items: center; gap: 10px; padding: 7px 8px; margin: 0 -8px; border-radius: 6px; transition: background .12s ease; }
.ptl__leaf:hover { background: #fafbfc; }
.ptl__check { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #d1d5db; background: #fff; padding: 0; cursor: pointer; position: relative; }
.ptl__leaf:hover .ptl__check { border-color: #0f1729; }
.ptl__leaf.is-done .ptl__check { background: #0f1729; border-color: #0f1729; }
.ptl__leaf.is-done .ptl__check::after { content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.ptl__leaf.is-current .ptl__check { border-color: #0d4b3a; box-shadow: 0 0 0 3px rgba(13,75,58,0.15); }
.ptl__leaf-body { display: flex; align-items: center; gap: 10px; background: transparent; border: 0; padding: 0; color: #0f1729; font-family: inherit; font-size: 13px; cursor: pointer; text-align: left; min-width: 0; }
.ptl__leaf-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ptl__leaf.is-done .ptl__leaf-label { color: #6b7280; text-decoration: line-through; text-decoration-color: #d1d5db; }
.ptl__leaf.is-current .ptl__leaf-label { font-weight: 600; }
.ptl__leaf-here { font-size: 10px; color: #0d4b3a; letter-spacing: 0.08em; font-weight: 700; text-transform: uppercase; flex: none; }
.ptl__leaf-noted { font-size: 10px; color: #374151; background: #fafbfc; border: 1px solid #e5e7eb; padding: 2px 6px; border-radius: 3px; font-weight: 600; flex: none; letter-spacing: 0.04em; }

.ptl__detail-lblrow { display: flex; align-items: center; justify-content: space-between; }
.ptl__detail-saved { font-size: 10.5px; color: #0d4b3a; font-weight: 600; letter-spacing: 0.04em; }
.ptl__detail-hint { font-size: 10.5px; color: #9ca3af; margin-top: 4px; }

.ptl__detail { margin: 0 -8px 6px; padding: 12px 16px 14px 36px; background: #fafbfc; border-left: 3px solid #0d4b3a; border-radius: 0 6px 6px 0; }
.ptl__detail-lbl { font-size: 10.5px; color: #6b7280; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
.ptl__detail-lbl + .ptl__detail-lbl { margin-top: 10px; }
.ptl__detail-body { font-size: 13px; line-height: 1.55; color: #374151; margin-bottom: 8px; }
.ptl__detail-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #0d4b3a; text-decoration: underline; margin-bottom: 8px; word-break: break-all; }
.ptl__detail-link:hover { color: #13644e; }
.ptl__detail-input { width: 100%; border: 1px solid #e5e7eb; border-radius: 5px; background: #fff; padding: 8px 10px; font-family: inherit; font-size: 12.5px; resize: vertical; min-height: 56px; margin-top: 4px; }
.ptl__detail-input:focus { outline: 0; border-color: #0d4b3a; }

.ptl__progress { margin-top: 18px; padding-top: 14px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 14px; }
.ptl__progress-lbl { font-size: 12px; color: #6b7280; white-space: nowrap; }
.ptl__progress-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.ptl__progress-fill { height: 100%; background: #0f1729; transition: width .25s ease; }
.ptl__progress-stat { font-size: 12px; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ptl__progress-stat strong { color: #0f1729; font-weight: 600; }
    `}</style>
  );
}
