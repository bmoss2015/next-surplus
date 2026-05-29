"use client";

// Full-page playbook editor that ports the v5 design mockup verbatim.
// CSS lives inline at the bottom of this file so the visual treatment
// (card outlines, section strips, state picker dropdown, sub-step
// table) matches the approved mockup exactly without fighting Tailwind
// utility defaults.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SettingsSaveProvider,
  useSaveBarSection,
} from "@/components/SettingsSaveBar";
import { US_STATES } from "@/components/StatesPicker";
import {
  upsertResearchTemplate,
  deleteResearchTemplate,
} from "@/app/(app)/settings/_actions";
import type {
  PlaybookApplyMode,
  ResearchStep,
  ResearchTemplateRow,
} from "@/lib/settings/fetch";

// `returnTo` controls which namespace the editor lives under. "settings" keeps
// the existing Settings -> Playbooks editor URLs; "playbooks" routes back into
// the Playbooks tab so users who clicked "+ Create Playbook" from /playbooks
// stay there instead of being yanked into Settings.
type ReturnTo = "settings" | "playbooks";

export function PlaybookEditPage({
  row,
  canEdit,
  returnTo = "settings",
}: {
  row: ResearchTemplateRow | null;
  canEdit: boolean;
  returnTo?: ReturnTo;
}) {
  return (
    <SettingsSaveProvider>
      <Editor row={row} canEdit={canEdit} returnTo={returnTo} />
      <PageCss />
    </SettingsSaveProvider>
  );
}

function emptyStep(): ResearchStep {
  return { name: "", url: null, instructions: null, children: [] };
}

function Editor({
  row,
  canEdit,
  returnTo,
}: {
  row: ResearchTemplateRow | null;
  canEdit: boolean;
  returnTo: ReturnTo;
}) {
  const router = useRouter();
  const initialSteps: ResearchStep[] = row?.steps?.length
    ? row.steps
    : [emptyStep()];

  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [applyMode, setApplyMode] = useState<PlaybookApplyMode>(
    row?.apply_mode ?? "match"
  );
  const [applyStates, setApplyStates] = useState<string[]>(
    row?.apply_states ?? []
  );
  const [steps, setSteps] = useState<ResearchStep[]>(initialSteps);
  const [openStepIdx, setOpenStepIdx] = useState<number | null>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState("");

  const [savedSnap, setSavedSnap] = useState({
    name: row?.name ?? "",
    description: row?.description ?? "",
    applyMode: (row?.apply_mode ?? "match") as PlaybookApplyMode,
    applyStates: row?.apply_states ?? [],
    steps: initialSteps,
  });
  const [savedFlash, setSavedFlash] = useState<null | "saved">(null);

  const isDirty =
    name !== savedSnap.name ||
    description !== savedSnap.description ||
    applyMode !== savedSnap.applyMode ||
    !arrEq(applyStates, savedSnap.applyStates) ||
    JSON.stringify(steps) !== JSON.stringify(savedSnap.steps);

  // Close the state picker when clicking outside.
  useEffect(() => {
    if (!pickerOpen) return;
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target?.closest("[data-state-picker]")) setPickerOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pickerOpen]);

  const save = useCallback(async () => {
    if (!name.trim()) return { ok: false as const, error: "Name is required" };
    if (applyMode === "match" && applyStates.length === 0) {
      return {
        ok: false as const,
        error: "Pick at least one state, or change When To Apply to All Imported Leads",
      };
    }
    const res = await upsertResearchTemplate({
      id: row?.id ?? null,
      name: name.trim(),
      description: description.trim() || null,
      state: row?.state ?? null,
      sale_type: row?.sale_type ?? null,
      apply_mode: applyMode,
      apply_states: applyMode === "match" ? applyStates : [],
      steps: steps.map((s) => ({
        name: s.name,
        url: s.url,
        instructions: s.instructions,
        children: (s.children ?? []).map((c) => ({
          name: c.name,
          url: c.url,
          instructions: c.instructions,
        })),
      })),
    });
    if (!res.ok) return res;
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    setName(trimmedName);
    setDescription(trimmedDesc);
    setSavedSnap({
      name: trimmedName,
      description: trimmedDesc,
      applyMode,
      applyStates: [...applyStates],
      steps: JSON.parse(JSON.stringify(steps)) as ResearchStep[],
    });
    setSavedFlash("saved");
    setTimeout(() => setSavedFlash(null), 2200);
    if (!row) {
      const dest =
        returnTo === "playbooks"
          ? `/playbooks/${res.id}/edit`
          : `/settings/playbooks/${res.id}`;
      router.replace(dest);
    } else {
      router.refresh();
    }
    return { ok: true as const };
  }, [
    name,
    description,
    applyMode,
    applyStates,
    steps,
    row,
    router,
    returnTo,
  ]);

  const discard = useCallback(() => {
    setName(savedSnap.name);
    setDescription(savedSnap.description);
    setApplyMode(savedSnap.applyMode);
    setApplyStates([...savedSnap.applyStates]);
    setSteps(JSON.parse(JSON.stringify(savedSnap.steps)) as ResearchStep[]);
  }, [savedSnap]);

  useSaveBarSection("playbook-edit", { isDirty, save, discard });

  const setStep = (idx: number, patch: Partial<ResearchStep>) =>
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const toggleChildren = (idx: number) =>
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const has = (s.children ?? []).length > 0;
        return { ...s, children: has ? [] : [emptyStep()] };
      })
    );

  const setChild = (
    idx: number,
    ci: number,
    patch: Partial<ResearchStep>
  ) =>
    setSteps((prev) =>
      prev.map((s, i) =>
        i !== idx
          ? s
          : {
              ...s,
              children: (s.children ?? []).map((c, j) =>
                j === ci ? { ...c, ...patch } : c
              ),
            }
      )
    );

  const addChild = (idx: number) =>
    setSteps((prev) =>
      prev.map((s, i) =>
        i !== idx
          ? s
          : { ...s, children: [...(s.children ?? []), emptyStep()] }
      )
    );

  const removeChild = (idx: number, ci: number) =>
    setSteps((prev) =>
      prev.map((s, i) =>
        i !== idx
          ? s
          : {
              ...s,
              children: (s.children ?? []).filter((_, j) => j !== ci),
            }
      )
    );

  const addStep = () => {
    setSteps((prev) => {
      const next = [...prev, emptyStep()];
      setOpenStepIdx(next.length - 1);
      return next;
    });
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
    setOpenStepIdx(null);
  };

  const onDelete = async () => {
    if (!row) return;
    setPendingDelete(true);
    const res = await deleteResearchTemplate(row.id);
    setPendingDelete(false);
    if (res.ok) {
      router.push(returnTo === "playbooks" ? "/playbooks" : "/settings");
    }
  };

  const totalSteps = useMemo(
    () =>
      steps.reduce(
        (acc, s) => acc + Math.max(1, s.children?.length ?? 0),
        0
      ),
    [steps]
  );

  const allStates = US_STATES.map((s) => s.code);
  const totalStates = allStates.length;
  const selectedCount = applyStates.length;
  const filteredStates = stateFilter
    ? US_STATES.filter(
        (s) =>
          s.code.toLowerCase().includes(stateFilter.toLowerCase()) ||
          s.label.toLowerCase().includes(stateFilter.toLowerCase())
      )
    : US_STATES;

  const summaryText = useMemo(() => {
    if (selectedCount === 0) {
      return (
        <span>
          <strong>No states selected.</strong> Pick at least one state for this
          playbook to auto-apply.
        </span>
      );
    }
    if (selectedCount === totalStates) {
      return (
        <span>
          Auto-applies to <strong>every new imported lead</strong>, with no
          state filter.
        </span>
      );
    }
    if (selectedCount <= 6) {
      const names = US_STATES.filter((s) => applyStates.includes(s.code)).map(
        (s) => s.label
      );
      const joined =
        names.length === 1
          ? names[0]
          : names.length === 2
            ? names.join(" or ")
            : names.slice(0, -1).join(", ") + ", or " + names.slice(-1);
      return (
        <span>
          Auto-applies to new imported leads in <strong>{joined}</strong>.
          Other leads will not get this playbook.
        </span>
      );
    }
    const excluded = US_STATES.filter(
      (s) => !applyStates.includes(s.code)
    ).map((s) => s.label);
    return (
      <span>
        Auto-applies to new imported leads in{" "}
        <strong>{selectedCount} states</strong>. Excluded: {excluded.join(", ")}
        .
      </span>
    );
  }, [applyStates, selectedCount, totalStates]);

  return (
    <div className="pe-page">
      <div className="pe-crumbs">
        <Link href="/playbooks">Playbooks</Link>
        <span className="pe-crumbs__sep">/</span>
        <span className="pe-crumbs__cur">{row?.name || "New Playbook"}</span>
      </div>

      <div className="pe-head">
        <div>
          <h1 className="pe-h1">{row ? "Edit Playbook" : "New Playbook"}</h1>
          <div className="pe-sub">
            {totalSteps} {totalSteps === 1 ? "Step" : "Steps"}
          </div>
        </div>
        {row && canEdit && (
          <button
            type="button"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            disabled={pendingDelete}
            className="pe-danger-btn"
          >
            {pendingDelete
              ? "Deleting..."
              : confirmDelete
                ? "Click again to confirm"
                : "Delete Playbook"}
          </button>
        )}
      </div>

      {/* ============ Block 1: Playbook Settings ============ */}
      <section className="pe-blk">
        <header className="pe-blk__head">
          <h3>Playbook Settings</h3>
          <span className="pe-blk__sub">Name, Description, And When To Apply</span>
        </header>
        <div className="pe-blk__body">
          <div className="pe-row-2">
            <PeField label="Playbook Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                placeholder="Texas Tax Sale Research"
                className="pe-input"
              />
            </PeField>
            <PeField label="Short Description" hint="Optional">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="Three calls, three texts, two letters, close"
                className="pe-input"
              />
            </PeField>
          </div>

          <PeField label="When To Apply" topPad>
            <div className="pe-apply-list">
              {(
                [
                  {
                    v: "manual" as const,
                    title: "Manually Only",
                    hint: "Reps Add This Playbook From The Lead Page",
                  },
                  {
                    v: "all" as const,
                    title: "All Imported Leads",
                    hint: "No Filters",
                  },
                  {
                    v: "match" as const,
                    title: "Auto-Apply To Leads That Match States",
                    hint: "Recommended",
                  },
                ]
              ).map((opt) => {
                const on = applyMode === opt.v;
                return (
                  <div
                    key={opt.v}
                    className={"pe-apply" + (on ? " is-on" : "")}
                    onClick={() => canEdit && setApplyMode(opt.v)}
                  >
                    <div className="pe-apply__head">
                      <span className="pe-apply__radio" />
                      <span className="pe-apply__title">{opt.title}</span>
                      <span className="pe-apply__hint">{opt.hint}</span>
                    </div>
                    {on && opt.v === "match" && (
                      <div
                        className="pe-apply__body"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PeField label="States" hint="Pick One Or More">
                          <div className="pe-picker" data-state-picker>
                            <div
                              className={
                                "pe-picker__trigger" + (pickerOpen ? " is-open" : "")
                              }
                              onClick={() =>
                                canEdit && setPickerOpen((v) => !v)
                              }
                            >
                              <PickerTriggerBody
                                applyStates={applyStates}
                                totalStates={totalStates}
                                setApplyStates={setApplyStates}
                              />
                            </div>
                            {pickerOpen && (
                              <div className="pe-picker__panel">
                                <div className="pe-picker__search">
                                  <span className="pe-picker__ic">🔍</span>
                                  <input
                                    autoFocus
                                    value={stateFilter}
                                    onChange={(e) =>
                                      setStateFilter(e.target.value)
                                    }
                                    placeholder="Search states..."
                                  />
                                </div>
                                <div className="pe-picker__actions">
                                  <button
                                    type="button"
                                    className="pe-picker__action"
                                    onClick={() => setApplyStates(allStates)}
                                  >
                                    Select All
                                  </button>
                                  <span className="pe-picker__count">
                                    {selectedCount} of {totalStates} Selected
                                  </span>
                                  <button
                                    type="button"
                                    className="pe-picker__action pe-picker__action--muted"
                                    onClick={() => setApplyStates([])}
                                  >
                                    Clear All
                                  </button>
                                </div>
                                <div className="pe-picker__list">
                                  {filteredStates.map((s) => {
                                    const isOn = applyStates.includes(s.code);
                                    return (
                                      <div
                                        key={s.code}
                                        className={
                                          "pe-picker__opt" + (isOn ? " is-on" : "")
                                        }
                                        onClick={() =>
                                          setApplyStates((prev) =>
                                            isOn
                                              ? prev.filter((x) => x !== s.code)
                                              : [...prev, s.code]
                                          )
                                        }
                                      >
                                        <span className="pe-picker__box" />
                                        <span className="pe-picker__abbr">
                                          {s.code}
                                        </span>
                                        <span className="pe-picker__full">
                                          {s.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </PeField>
                        <div className="pe-summary">{summaryText}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </PeField>
        </div>
      </section>

      {/* ============ Block 2: Steps ============ */}
      <section className="pe-blk">
        <header className="pe-blk__head">
          <h3>Steps</h3>
          <span className="pe-blk__sub">Click A Step To Edit. Drag To Reorder.</span>
        </header>
        <div className="pe-blk__body pe-steps-grid">
          <div className="pe-steps">
            {steps.map((s, idx) => {
              const isOpen = openStepIdx === idx;
              const hasChildren = (s.children ?? []).length > 0;
              const subLabel = hasChildren
                ? `${s.children!.length} Sub-Steps`
                : "Single Step";
              return (
                <div
                  key={idx}
                  className={"pe-step" + (isOpen ? " is-open" : "")}
                >
                  <button
                    type="button"
                    onClick={() => setOpenStepIdx(isOpen ? null : idx)}
                    className="pe-step__head"
                  >
                    <span className="pe-step__grip">⋮⋮</span>
                    <span className="pe-step__num">{idx + 1}</span>
                    <span className="pe-step__name">
                      {s.name.trim() || `Step ${idx + 1}`}
                    </span>
                    <span className="pe-step__sub">{subLabel}</span>
                    <span
                      className={"pe-step__caret" + (isOpen ? " is-open" : "")}
                    >
                      ▶
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pe-step__body">
                      <PeField label="Step Name">
                        <input
                          value={s.name}
                          onChange={(e) =>
                            setStep(idx, { name: e.target.value })
                          }
                          disabled={!canEdit}
                          placeholder='e.g. "Send opening letter"'
                          className="pe-input"
                        />
                      </PeField>

                      <div
                        className={"pe-toggle" + (hasChildren ? "" : " is-off")}
                        onClick={() => canEdit && toggleChildren(idx)}
                      >
                        <span className="pe-toggle__tog" />
                        <span className="pe-toggle__lbl">
                          {hasChildren
                            ? "This Step Has Sub-Steps"
                            : "This Step Doesn't Have Sub-Steps"}
                        </span>
                        <span className="pe-toggle__helper">
                          For Repeating Actions Like Call 1, Call 2, Call 3
                        </span>
                      </div>

                      {!hasChildren && (
                        <PeField label="Step Description" hint="Optional" topPad>
                          <textarea
                            value={s.instructions ?? ""}
                            onChange={(e) =>
                              setStep(idx, {
                                instructions: e.target.value || null,
                              })
                            }
                            disabled={!canEdit}
                            placeholder="What should the operator do at this step?"
                            className="pe-input pe-textarea"
                          />
                        </PeField>
                      )}

                      {hasChildren && (
                        <div className="pe-sstable">
                          <div className="pe-sstable__thead">
                            <span />
                            <span>#</span>
                            <span>Sub-Step Name</span>
                            <span>Description</span>
                            <span />
                          </div>
                          {(s.children ?? []).map((c, ci) => (
                            <div key={ci} className="pe-sstable__row">
                              <span className="pe-sstable__grip">⋮⋮</span>
                              <span className="pe-sstable__num">
                                {idx + 1}.{ci + 1}
                              </span>
                              <input
                                value={c.name}
                                onChange={(e) =>
                                  setChild(idx, ci, { name: e.target.value })
                                }
                                disabled={!canEdit}
                                placeholder="Name"
                                className="pe-sstable__input"
                              />
                              <input
                                value={c.instructions ?? ""}
                                onChange={(e) =>
                                  setChild(idx, ci, {
                                    instructions: e.target.value || null,
                                  })
                                }
                                disabled={!canEdit}
                                placeholder="Optional"
                                className="pe-sstable__input"
                              />
                              <button
                                type="button"
                                onClick={() => removeChild(idx, ci)}
                                className="pe-sstable__del"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addChild(idx)}
                            className="pe-sstable__add"
                          >
                            + Add Sub-Step
                          </button>
                        </div>
                      )}

                      {steps.length > 1 && (
                        <div className="pe-step__actions">
                          <button
                            type="button"
                            onClick={() => removeStep(idx)}
                            className="pe-step__remove"
                          >
                            Remove Step
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button type="button" onClick={addStep} className="pe-add-step">
              + Add Step
            </button>
          </div>

          <aside className="pe-preview">
            <div className="pe-preview__head">
              <div className="pe-preview__h">Live Preview</div>
              <div className="pe-preview__sub">How This Step Looks On A Lead</div>
            </div>
            <div className="pe-preview__body">
              <div className="pe-preview__lead">
                <div className="pe-preview__av">RM</div>
                <span>Roberta Mendes</span>
              </div>
              {openStepIdx !== null && steps[openStepIdx] ? (
                <PreviewNode step={steps[openStepIdx]} />
              ) : (
                <div className="pe-preview__empty">
                  Click a step on the left to preview it here.
                </div>
              )}
              <div className="pe-preview__note">
                Updates live as you type. Toggle off Sub-Steps to see the
                single-step view.
              </div>
            </div>
          </aside>
        </div>
      </section>

      {savedFlash === "saved" && (
        <div className="pe-flash">Saved</div>
      )}
    </div>
  );
}

function PreviewNode({ step }: { step: ResearchStep }) {
  const hasChildren = (step.children ?? []).length > 0;
  const stepName = step.name.trim() || "Step";
  return (
    <div className="pe-pv">
      <div className="pe-pv__trunk" />
      <div className="pe-pv__dot" />
      <div className="pe-pv__name">{stepName}</div>
      {hasChildren ? (
        <>
          <div className="pe-pv__progress">
            0 of {step.children!.length} Done
          </div>
          <div className="pe-pv__branch">
            {step.children!.map((c, i) => (
              <div key={i} className="pe-pv__leaf">
                <span className="pe-pv__ch" />
                <span className="pe-pv__leaf-lbl">
                  {c.name.trim() || `Sub ${i + 1}`}
                  {c.instructions && (
                    <span className="pe-pv__leaf-sub"> {c.instructions}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {step.instructions && (
            <div className="pe-pv__desc">{step.instructions}</div>
          )}
          <div className="pe-pv__leaf pe-pv__leaf--single">
            <span className="pe-pv__ch" />
            <span className="pe-pv__leaf-lbl">{stepName}</span>
          </div>
        </>
      )}
    </div>
  );
}

function PeField({
  label,
  hint,
  topPad,
  children,
}: {
  label: string;
  hint?: string;
  topPad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={"pe-field" + (topPad ? " pe-field--toppad" : "")}>
      <span className="pe-field__lbl">
        {label}
        {hint && <span className="pe-field__hint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function PickerTriggerBody({
  applyStates,
  totalStates,
  setApplyStates,
}: {
  applyStates: string[];
  totalStates: number;
  setApplyStates: (next: string[]) => void;
}) {
  const count = applyStates.length;
  if (count === totalStates) {
    return (
      <>
        <span className="pe-picker__all">All States Selected</span>
        <span className="pe-picker__caret">▼</span>
      </>
    );
  }
  if (count === 0) {
    return (
      <>
        <span className="pe-picker__placeholder">No States Selected</span>
        <span className="pe-picker__caret">▼</span>
      </>
    );
  }
  if (count <= 4) {
    const labels = US_STATES.filter((s) => applyStates.includes(s.code));
    return (
      <>
        {labels.map((s) => (
          <span key={s.code} className="pe-picker__chip">
            {s.label}
            <span
              className="pe-picker__chip-x"
              onClick={(e) => {
                e.stopPropagation();
                setApplyStates(applyStates.filter((x) => x !== s.code));
              }}
            >
              ×
            </span>
          </span>
        ))}
        <span className="pe-picker__caret">▼</span>
      </>
    );
  }
  return (
    <>
      <span className="pe-picker__chip">{count} States Selected</span>
      <span className="pe-picker__caret">▼</span>
    </>
  );
}

function arrEq(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function PageCss() {
  return (
    <style>{`
:root {
  --pe-bg: #f0f3f7;
  --pe-card: #ffffff;
  --pe-surface-muted: #fafbfc;
  --pe-ink: #0f1729;
  --pe-ink-2: #374151;
  --pe-muted: #6b7280;
  --pe-muted-2: #9ca3af;
  --pe-hairline: #e5e7eb;
  --pe-hairline-2: #d1d5db;
  --pe-petrol: #0d4b3a;
  --pe-petrol-hover: #13644e;
  --pe-shadow-card: 0 1px 2px rgba(15,23,41,0.04), 0 1px 3px rgba(15,23,41,0.06);
  --pe-shadow-pop: 0 8px 28px rgba(15,23,41,0.12);
}
.pe-page { max-width: 1180px; margin: 0 auto; padding: 32px 28px 140px; color: var(--pe-ink); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.pe-crumbs { color: var(--pe-muted); font-size: 13px; margin-bottom: 14px; }
.pe-crumbs a { color: var(--pe-muted); text-decoration: none; }
.pe-crumbs a:hover { text-decoration: underline; }
.pe-crumbs__sep { color: var(--pe-hairline-2); padding: 0 8px; }
.pe-crumbs__cur { color: var(--pe-ink); font-weight: 500; }
.pe-head { display: flex; align-items: end; justify-content: space-between; margin-bottom: 22px; gap: 16px; }
.pe-h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; margin: 0; color: var(--pe-ink); }
.pe-sub { margin-top: 4px; font-size: 13px; color: var(--pe-muted); }
.pe-danger-btn { font-size: 12px; color: #b91c1c; border: 1px solid var(--pe-hairline); padding: 6px 12px; border-radius: 6px; background: var(--pe-card); cursor: pointer; font-weight: 500; }
.pe-danger-btn:hover { background: #fff5f5; border-color: #fecaca; }

.pe-blk { background: var(--pe-card); border: 1px solid var(--pe-hairline); border-radius: 10px; box-shadow: var(--pe-shadow-card); margin-bottom: 20px; }
.pe-blk__head { display: flex; align-items: center; justify-content: space-between; padding: 16px 22px; border-bottom: 1px solid var(--pe-hairline); background: var(--pe-surface-muted); border-radius: 10px 10px 0 0; }
.pe-blk__head h3 { font-size: 14px; font-weight: 600; margin: 0; color: var(--pe-ink); }
.pe-blk__sub { font-size: 12px; color: var(--pe-muted); }
.pe-blk__body { padding: 22px 24px; }

.pe-field { display: block; margin-bottom: 0; }
.pe-field--toppad { margin-top: 18px; }
.pe-field__lbl { display: block; font-size: 12px; font-weight: 600; color: var(--pe-ink); margin-bottom: 6px; }
.pe-field__hint { color: var(--pe-muted); font-weight: 400; margin-left: 6px; font-size: 11px; }
.pe-input { width: 100%; padding: 10px 12px; font-size: 13px; border: 1px solid var(--pe-hairline); border-radius: 8px; background: var(--pe-card); color: var(--pe-ink); font-family: inherit; box-sizing: border-box; }
.pe-input:focus { outline: 0; border-color: var(--pe-petrol); box-shadow: 0 0 0 3px rgba(13,75,58,0.15); }
.pe-textarea { min-height: 80px; resize: vertical; line-height: 1.55; }
.pe-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.pe-apply-list { display: flex; flex-direction: column; gap: 8px; }
.pe-apply { padding: 14px 16px; border: 1.5px solid var(--pe-hairline); border-radius: 10px; cursor: pointer; transition: all .15s ease; background: var(--pe-card); }
.pe-apply:hover { border-color: var(--pe-muted-2); }
.pe-apply.is-on { border-color: var(--pe-petrol); }
.pe-apply__head { display: flex; align-items: center; gap: 10px; }
.pe-apply__radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--pe-hairline-2); flex: none; position: relative; }
.pe-apply.is-on .pe-apply__radio { border-color: var(--pe-petrol); }
.pe-apply.is-on .pe-apply__radio::after { content: ''; position: absolute; left: 3px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background: var(--pe-petrol); }
.pe-apply__title { font-size: 13px; font-weight: 600; }
.pe-apply__hint { font-size: 12px; color: var(--pe-muted); margin-left: auto; }
.pe-apply__body { padding-top: 14px; margin-top: 14px; border-top: 1px solid var(--pe-hairline); }

.pe-picker { position: relative; }
.pe-picker__trigger { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 42px; padding: 7px 10px; border: 1px solid var(--pe-hairline); border-radius: 8px; background: var(--pe-card); cursor: pointer; }
.pe-picker__trigger:hover { border-color: var(--pe-muted-2); }
.pe-picker__trigger.is-open { border-color: var(--pe-petrol); box-shadow: 0 0 0 3px rgba(13,75,58,0.15); }
.pe-picker__all { color: var(--pe-ink); font-weight: 500; font-size: 13px; }
.pe-picker__placeholder { color: var(--pe-muted); font-size: 13px; }
.pe-picker__caret { font-size: 10px; color: var(--pe-muted-2); margin-left: auto; }
.pe-picker__chip { display: inline-flex; align-items: center; gap: 4px; background: var(--pe-surface-muted); border: 1px solid var(--pe-hairline); padding: 3px 4px 3px 10px; border-radius: 999px; font-size: 12px; color: var(--pe-ink-2); font-weight: 500; }
.pe-picker__chip-x { width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--pe-muted); font-size: 13px; cursor: pointer; }
.pe-picker__chip-x:hover { background: var(--pe-hairline); color: var(--pe-ink); }

.pe-picker__panel { position: absolute; top: calc(100% + 6px); left: 0; width: 460px; max-width: 100%; background: var(--pe-card); border: 1px solid var(--pe-hairline); border-radius: 10px; box-shadow: var(--pe-shadow-pop); z-index: 100; padding: 0; overflow: hidden; }
.pe-picker__search { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--pe-hairline); }
.pe-picker__search input { flex: 1; border: 0; outline: 0; padding: 4px 0; font-family: inherit; font-size: 13px; background: transparent; color: var(--pe-ink); }
.pe-picker__ic { color: var(--pe-muted-2); font-size: 14px; }
.pe-picker__actions { display: flex; align-items: center; justify-content: space-between; padding: 9px 16px; background: var(--pe-surface-muted); border-bottom: 1px solid var(--pe-hairline); font-size: 12px; }
.pe-picker__action { background: transparent; border: 0; color: var(--pe-petrol); cursor: pointer; font-weight: 600; font-size: 12px; padding: 2px 0; }
.pe-picker__action:hover { text-decoration: underline; }
.pe-picker__action--muted { color: var(--pe-muted); }
.pe-picker__count { color: var(--pe-muted); font-variant-numeric: tabular-nums; }
.pe-picker__list { max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; }
.pe-picker__opt { display: grid; grid-template-columns: 18px 36px 1fr; align-items: center; gap: 12px; padding: 9px 16px; cursor: pointer; font-size: 13px; border-bottom: 1px solid var(--pe-hairline); }
.pe-picker__opt:last-child { border-bottom: 0; }
.pe-picker__opt:hover { background: var(--pe-surface-muted); }
.pe-picker__box { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--pe-hairline-2); background: var(--pe-card); position: relative; }
.pe-picker__opt.is-on .pe-picker__box { background: var(--pe-petrol); border-color: var(--pe-petrol); }
.pe-picker__opt.is-on .pe-picker__box::after { content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid #fff; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }
.pe-picker__abbr { font-weight: 600; color: var(--pe-ink); font-variant-numeric: tabular-nums; }
.pe-picker__full { color: var(--pe-muted); }
.pe-picker__opt.is-on .pe-picker__full { color: var(--pe-ink-2); }

.pe-summary { margin-top: 14px; padding: 12px 14px; background: var(--pe-surface-muted); border-left: 3px solid var(--pe-petrol); border-radius: 0 8px 8px 0; font-size: 13px; color: var(--pe-ink-2); line-height: 1.55; }
.pe-summary strong { color: var(--pe-ink); font-weight: 600; }

.pe-steps { display: flex; flex-direction: column; gap: 6px; }
.pe-step { background: var(--pe-card); border: 1px solid var(--pe-hairline); border-radius: 10px; transition: border-color .12s ease; }
.pe-step:hover { border-color: var(--pe-muted-2); }
.pe-step.is-open { border-color: var(--pe-petrol); box-shadow: 0 0 0 3px rgba(13,75,58,0.06); }
.pe-step__head { display: grid; grid-template-columns: 16px 24px 1fr auto auto; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; background: transparent; border: 0; width: 100%; text-align: left; font-family: inherit; }
.pe-step__grip { color: var(--pe-muted-2); font-size: 14px; line-height: 1; cursor: grab; }
.pe-step__num { font-size: 12px; color: var(--pe-muted); font-variant-numeric: tabular-nums; font-weight: 500; }
.pe-step__name { font-size: 13px; font-weight: 600; color: var(--pe-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pe-step__sub { font-size: 11px; color: var(--pe-muted); background: var(--pe-surface-muted); padding: 3px 8px; border-radius: 4px; }
.pe-step__caret { font-size: 11px; color: var(--pe-muted); transition: transform .15s ease; }
.pe-step__caret.is-open { color: var(--pe-petrol); transform: rotate(90deg); }
.pe-step__body { padding: 6px 14px 16px 50px; border-top: 1px solid var(--pe-hairline); }
.pe-step__body .pe-field { margin-top: 14px; }
.pe-step__actions { display: flex; justify-content: flex-end; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--pe-hairline); }
.pe-step__remove { font-size: 12px; color: var(--pe-muted); cursor: pointer; padding: 4px 8px; border-radius: 4px; background: transparent; border: 0; font-family: inherit; }
.pe-step__remove:hover { color: #b91c1c; }

.pe-toggle { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--pe-surface-muted); border: 1px solid var(--pe-hairline); border-radius: 8px; cursor: pointer; margin: 14px 0 0; }
.pe-toggle__tog { width: 32px; height: 20px; border-radius: 999px; background: var(--pe-petrol); position: relative; flex: none; transition: all .15s ease; }
.pe-toggle__tog::after { content: ''; position: absolute; right: 3px; top: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: all .15s ease; }
.pe-toggle.is-off .pe-toggle__tog { background: var(--pe-hairline-2); }
.pe-toggle.is-off .pe-toggle__tog::after { right: 15px; }
.pe-toggle__lbl { font-size: 13px; font-weight: 600; color: var(--pe-ink); }
.pe-toggle__helper { font-size: 12px; color: var(--pe-muted); margin-left: auto; }

.pe-sstable { margin-top: 14px; border: 1px solid var(--pe-hairline); border-radius: 10px; overflow: hidden; background: var(--pe-card); }
.pe-sstable__thead { display: grid; grid-template-columns: 16px 28px 1.1fr 1.4fr 60px; gap: 10px; padding: 10px 14px; background: var(--pe-surface-muted); border-bottom: 1px solid var(--pe-hairline); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--pe-muted); font-weight: 600; }
.pe-sstable__row { display: grid; grid-template-columns: 16px 28px 1.1fr 1.4fr 60px; gap: 10px; padding: 10px 14px; align-items: center; border-bottom: 1px solid var(--pe-hairline); }
.pe-sstable__row:hover { background: var(--pe-surface-muted); }
.pe-sstable__row:last-of-type { border-bottom: 0; }
.pe-sstable__grip { color: var(--pe-muted-2); font-size: 13px; line-height: 1; cursor: grab; text-align: center; }
.pe-sstable__num { font-size: 11px; color: var(--pe-muted); font-variant-numeric: tabular-nums; text-align: center; }
.pe-sstable__input { padding: 6px 8px; font-size: 13px; border: 1px solid transparent; border-radius: 5px; background: transparent; color: var(--pe-ink); font-family: inherit; width: 100%; box-sizing: border-box; }
.pe-sstable__input:hover { background: var(--pe-surface-muted); }
.pe-sstable__input:focus { outline: 0; background: var(--pe-card); border-color: var(--pe-petrol); box-shadow: 0 0 0 2px rgba(13,75,58,0.1); }
.pe-sstable__del { font-size: 11px; color: var(--pe-muted); cursor: pointer; padding: 4px 8px; border-radius: 4px; text-align: center; background: transparent; border: 0; font-family: inherit; }
.pe-sstable__del:hover { background: var(--pe-card); color: #b91c1c; }
.pe-sstable__add { display: block; width: 100%; padding: 10px 14px; background: var(--pe-surface-muted); border: 0; border-top: 1px solid var(--pe-hairline); color: var(--pe-petrol); font-size: 12px; cursor: pointer; font-weight: 600; font-family: inherit; text-align: center; }
.pe-sstable__add:hover { background: var(--pe-card); }

.pe-add-step { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px; border: 1px dashed var(--pe-hairline-2); border-radius: 10px; color: var(--pe-muted); font-size: 13px; cursor: pointer; font-weight: 500; margin-top: 6px; background: transparent; font-family: inherit; }
.pe-add-step:hover { color: var(--pe-petrol); border-color: var(--pe-petrol); background: var(--pe-surface-muted); }

.pe-flash { position: fixed; left: 50%; bottom: 88px; transform: translateX(-50%); background: var(--pe-petrol); color: #fff; padding: 9px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; box-shadow: 0 8px 24px rgba(13,75,58,0.35); z-index: 200; animation: pe-flash-in 200ms ease-out; }
@keyframes pe-flash-in { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }

.pe-steps-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
@media (max-width: 1000px) { .pe-steps-grid { grid-template-columns: 1fr; } }

.pe-preview { position: sticky; top: 20px; background: var(--pe-card); border: 1px solid var(--pe-hairline); border-radius: 10px; overflow: hidden; }
.pe-preview__head { padding: 12px 16px; border-bottom: 1px solid var(--pe-hairline); background: var(--pe-surface-muted); }
.pe-preview__h { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--pe-muted); font-weight: 600; }
.pe-preview__sub { font-size: 11px; color: var(--pe-muted-2); margin-top: 2px; }
.pe-preview__body { padding: 18px 18px 20px; }
.pe-preview__lead { font-size: 11px; color: var(--pe-muted); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.pe-preview__av { width: 22px; height: 22px; border-radius: 50%; background: var(--pe-petrol); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; }
.pe-preview__empty { font-size: 12px; color: var(--pe-muted); padding: 12px 0; }
.pe-preview__note { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--pe-hairline); font-size: 11px; color: var(--pe-muted); line-height: 1.55; }

.pe-pv { position: relative; padding-left: 26px; }
.pe-pv__trunk { position: absolute; left: 7px; top: 16px; bottom: -2px; width: 2px; background: var(--pe-hairline); }
.pe-pv__dot { position: absolute; left: 1px; top: 2px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--pe-hairline-2); background: var(--pe-card); }
.pe-pv__name { font-size: 14px; font-weight: 600; color: var(--pe-ink); }
.pe-pv__desc { font-size: 12px; color: var(--pe-muted); margin-top: 4px; line-height: 1.5; }
.pe-pv__progress { font-size: 11px; color: var(--pe-muted); margin-top: 4px; font-variant-numeric: tabular-nums; }
.pe-pv__branch { margin-top: 10px; }
.pe-pv__leaf { display: grid; grid-template-columns: 14px 1fr; gap: 8px; align-items: center; padding: 5px 0; }
.pe-pv__leaf--single { margin-top: 10px; }
.pe-pv__ch { width: 13px; height: 13px; border-radius: 4px; border: 1.5px solid var(--pe-hairline-2); background: var(--pe-card); }
.pe-pv__leaf-lbl { font-size: 12px; color: var(--pe-ink); }
.pe-pv__leaf-sub { color: var(--pe-muted); margin-left: 4px; font-size: 11px; }
    `}</style>
  );
}
