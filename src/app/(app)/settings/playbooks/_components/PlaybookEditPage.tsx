"use client";

// Full-page playbook editor. Two blocks on one scrolling page:
//   1. Playbook Settings: name, description, When To Apply (manual /
//      all imported / leads matching states) with an inline state
//      checkbox grid.
//   2. Steps: accordion list. Click a step row to expand the inline
//      editor with Step Name + Sub-Steps toggle. Toggle on swaps the
//      Description input for a Name / Description sub-step table.
//
// Save lives in the standard SettingsSaveBar at bottom-right via
// useSaveBarSection. Discard reverts to the row's last saved state.

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronRight, IconGripVertical, IconPlus, IconTrash } from "@tabler/icons-react";
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

export function PlaybookEditPage({
  row,
  canEdit,
}: {
  row: ResearchTemplateRow | null;
  canEdit: boolean;
}) {
  return (
    <SettingsSaveProvider>
      <Editor row={row} canEdit={canEdit} />
    </SettingsSaveProvider>
  );
}

function emptyStep(): ResearchStep {
  return { name: "", url: null, instructions: null, children: [] };
}

function Editor({
  row,
  canEdit,
}: {
  row: ResearchTemplateRow | null;
  canEdit: boolean;
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

  const [savedSnap, setSavedSnap] = useState({
    name: row?.name ?? "",
    description: row?.description ?? "",
    applyMode: (row?.apply_mode ?? "match") as PlaybookApplyMode,
    applyStates: row?.apply_states ?? [],
    steps: initialSteps,
  });

  const isDirty =
    name !== savedSnap.name ||
    description !== savedSnap.description ||
    applyMode !== savedSnap.applyMode ||
    !arrEq(applyStates, savedSnap.applyStates) ||
    JSON.stringify(steps) !== JSON.stringify(savedSnap.steps);

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
    setSavedSnap({
      name: name.trim(),
      description: description.trim(),
      applyMode,
      applyStates: [...applyStates],
      steps: JSON.parse(JSON.stringify(steps)) as ResearchStep[],
    });
    if (!row) {
      router.replace(`/settings/playbooks/${res.id}`);
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
        return {
          ...s,
          children: has ? [] : [emptyStep()],
        };
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
    if (res.ok) router.push("/settings");
  };

  const stepCount = steps.length;
  const subCount = useMemo(
    () => steps.reduce((acc, s) => acc + (s.children?.length ?? 0), 0),
    [steps]
  );

  return (
    <div className="mx-auto max-w-5xl px-7 py-6 pb-32">
      <div className="text-[12px] text-gray-500 mb-2">
        <Link href="/settings" className="hover:underline">
          Settings
        </Link>
        <span className="mx-1.5 text-gray-300">/</span>
        <Link href="/settings" className="hover:underline">
          Playbooks
        </Link>
        <span className="mx-1.5 text-gray-300">/</span>
        <span className="text-ink">{row?.name || "New Playbook"}</span>
      </div>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            {row ? "Edit Playbook" : "New Playbook"}
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            {stepCount} {stepCount === 1 ? "Step" : "Steps"}
            {subCount > 0 ? `, ${subCount} Sub-Steps` : ""}
          </div>
        </div>
        {row && canEdit && (
          <button
            type="button"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            disabled={pendingDelete}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-50 hover:border-red-200 disabled:opacity-50"
          >
            {pendingDelete
              ? "Deleting..."
              : confirmDelete
                ? "Click again to confirm"
                : "Delete Playbook"}
          </button>
        )}
      </div>

      {/* === Block 1: Playbook Settings === */}
      <section className="mb-5 rounded-lg border border-gray-200 bg-surface shadow-card">
        <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div>
            <div className="text-[13px] font-semibold text-ink">
              Playbook Settings
            </div>
            <div className="text-[11.5px] text-gray-500 mt-0.5">
              Name, Description, And When To Apply
            </div>
          </div>
        </header>
        <div className="px-5 py-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Playbook Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                placeholder="Texas Tax Sale Research"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] focus:border-petrol-500 focus:outline-none focus:ring-2 focus:ring-petrol-200"
              />
            </Field>
            <Field label="Short Description" hint="Optional">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                placeholder="Three calls, three texts, two letters, close"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] focus:border-petrol-500 focus:outline-none focus:ring-2 focus:ring-petrol-200"
              />
            </Field>
          </div>

          <div className="mt-4">
            <div className="text-[12px] font-semibold text-ink mb-1">
              When To Apply
            </div>
            <div className="text-[11.5px] text-gray-500 mb-3">
              Pick how this playbook attaches to imported leads. You can change
              it any time.
            </div>
            <div className="space-y-2">
              {(
                [
                  {
                    v: "manual",
                    title: "Manually Only",
                    hint: "Reps add this playbook from the lead page.",
                  },
                  {
                    v: "all",
                    title: "All Imported Leads",
                    hint: "Every newly imported lead gets this playbook, no filters.",
                  },
                  {
                    v: "match",
                    title: "Leads That Match States",
                    hint: "Auto-apply when an imported lead's state is in the list below.",
                  },
                ] as const
              ).map((opt) => {
                const isOn = applyMode === opt.v;
                return (
                  <label
                    key={opt.v}
                    onClick={() => canEdit && setApplyMode(opt.v)}
                    className={
                      "block cursor-pointer rounded-md border-2 px-4 py-3 transition-colors " +
                      (isOn
                        ? "border-petrol-600 bg-white"
                        : "border-gray-200 bg-white hover:border-gray-300")
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={
                          "h-4 w-4 rounded-full border-2 flex-none " +
                          (isOn ? "border-petrol-600" : "border-gray-300")
                        }
                        style={{
                          position: "relative",
                        }}
                      >
                        {isOn && (
                          <span
                            className="absolute rounded-full bg-petrol-600"
                            style={{
                              left: 2,
                              top: 2,
                              width: 8,
                              height: 8,
                            }}
                          />
                        )}
                      </span>
                      <span className="text-[13px] font-semibold text-ink">
                        {opt.title}
                      </span>
                      <span className="ml-auto text-[12px] text-gray-500">
                        {opt.hint}
                      </span>
                    </div>

                    {isOn && opt.v === "match" && (
                      <div className="mt-3 pl-7" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-2 text-[11.5px]">
                          <button
                            type="button"
                            onClick={() =>
                              setApplyStates(US_STATES.map((s) => s.code))
                            }
                            className="cursor-pointer font-semibold text-petrol-700 hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-gray-300">·</span>
                          <button
                            type="button"
                            onClick={() => setApplyStates([])}
                            className="cursor-pointer font-semibold text-gray-500 hover:underline"
                          >
                            Clear All
                          </button>
                          <span className="ml-auto tabular-nums text-gray-500">
                            {applyStates.length} of {US_STATES.length} selected
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 rounded-md border border-gray-200 bg-gray-50 p-2 max-h-60 overflow-y-auto">
                          {US_STATES.map((s) => {
                            const on = applyStates.includes(s.code);
                            return (
                              <label
                                key={s.code}
                                onClick={() =>
                                  setApplyStates((prev) =>
                                    on
                                      ? prev.filter((x) => x !== s.code)
                                      : [...prev, s.code]
                                  )
                                }
                                className={
                                  "flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[12px] " +
                                  (on ? "bg-petrol-50" : "hover:bg-white")
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => {}}
                                  className="cursor-pointer"
                                />
                                <span className="tabular-nums font-semibold text-ink w-6">
                                  {s.code}
                                </span>
                                <span className="truncate text-gray-600">
                                  {s.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {applyStates.length === 0 && (
                          <div className="mt-2 text-[11.5px] text-red-700">
                            Pick at least one state, or switch to All Imported Leads.
                          </div>
                        )}
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* === Block 2: Steps === */}
      <section className="mb-5 rounded-lg border border-gray-200 bg-surface shadow-card">
        <header className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div>
            <div className="text-[13px] font-semibold text-ink">Steps</div>
            <div className="text-[11.5px] text-gray-500 mt-0.5">
              Click A Step To Edit. Drag To Reorder.
            </div>
          </div>
        </header>
        <div className="px-5 py-4 space-y-1.5">
          {steps.map((s, idx) => {
            const isOpen = openStepIdx === idx;
            const hasChildren = (s.children ?? []).length > 0;
            const subStepLabel = hasChildren
              ? `${s.children!.length} Sub-Steps`
              : "Single Step";
            return (
              <div
                key={idx}
                className={
                  "rounded-lg border bg-surface transition-colors " +
                  (isOpen
                    ? "border-petrol-500 ring-2 ring-petrol-100"
                    : "border-gray-200 hover:border-gray-300")
                }
              >
                <button
                  type="button"
                  onClick={() => setOpenStepIdx(isOpen ? null : idx)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
                >
                  <IconGripVertical
                    size={14}
                    className="flex-none text-gray-300"
                  />
                  <span className="flex-none text-[12px] tabular-nums font-medium text-gray-500">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate text-[13px] font-semibold text-ink">
                    {s.name.trim() || `Step ${idx + 1}`}
                  </span>
                  <span className="flex-none rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                    {subStepLabel}
                  </span>
                  <IconChevronRight
                    size={14}
                    className={
                      "flex-none text-gray-400 transition-transform " +
                      (isOpen ? "rotate-90 text-petrol-600" : "")
                    }
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 px-4 pb-4 pt-3 pl-12">
                    <Field label="Step Name">
                      <input
                        value={s.name}
                        onChange={(e) =>
                          setStep(idx, { name: e.target.value })
                        }
                        disabled={!canEdit}
                        placeholder='e.g. "Send opening letter"'
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] focus:border-petrol-500 focus:outline-none focus:ring-2 focus:ring-petrol-200"
                      />
                    </Field>

                    <label
                      onClick={() => canEdit && toggleChildren(idx)}
                      className="mt-3 flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5"
                    >
                      <span
                        className="relative flex-none transition-colors"
                        style={{
                          width: 32,
                          height: 20,
                          borderRadius: 999,
                          background: hasChildren ? "#0d4b3a" : "#cbd5e1",
                        }}
                      >
                        <span
                          className="absolute bg-white transition-all"
                          style={{
                            top: 2,
                            left: hasChildren ? 14 : 2,
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                          }}
                        />
                      </span>
                      <span className="text-[13px] font-semibold text-ink">
                        {hasChildren
                          ? "This Step Has Sub-Steps"
                          : "This Step Doesn't Have Sub-Steps"}
                      </span>
                      <span className="ml-auto text-[11.5px] text-gray-500">
                        For Repeating Actions Like Call 1, Call 2, Call 3
                      </span>
                    </label>

                    {!hasChildren && (
                      <div className="mt-3">
                        <Field label="Step Description" hint="Optional">
                          <textarea
                            value={s.instructions ?? ""}
                            onChange={(e) =>
                              setStep(idx, {
                                instructions: e.target.value || null,
                              })
                            }
                            disabled={!canEdit}
                            placeholder="What should the operator do at this step?"
                            className="w-full rounded-md border border-gray-200 px-3 py-2 text-[13px] resize-y min-h-[80px] focus:border-petrol-500 focus:outline-none focus:ring-2 focus:ring-petrol-200"
                          />
                        </Field>
                      </div>
                    )}

                    {hasChildren && (
                      <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
                        <div className="grid grid-cols-[16px_28px_minmax(0,1.1fr)_minmax(0,1.4fr)_56px] gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">
                          <span></span>
                          <span>#</span>
                          <span>Sub-Step Name</span>
                          <span>Description</span>
                          <span></span>
                        </div>
                        {(s.children ?? []).map((c, ci) => (
                          <div
                            key={ci}
                            className="grid grid-cols-[16px_28px_minmax(0,1.1fr)_minmax(0,1.4fr)_56px] items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 last:border-b-0"
                          >
                            <IconGripVertical
                              size={12}
                              className="text-gray-300"
                            />
                            <span className="text-[11px] tabular-nums text-gray-500">
                              {idx + 1}.{ci + 1}
                            </span>
                            <input
                              value={c.name}
                              onChange={(e) =>
                                setChild(idx, ci, { name: e.target.value })
                              }
                              disabled={!canEdit}
                              placeholder="Name"
                              className="w-full rounded border border-transparent bg-gray-50 px-2 py-1 text-[12.5px] hover:border-gray-200 hover:bg-white focus:border-petrol-500 focus:bg-white focus:outline-none"
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
                              className="w-full rounded border border-transparent bg-gray-50 px-2 py-1 text-[12.5px] hover:border-gray-200 hover:bg-white focus:border-petrol-500 focus:bg-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeChild(idx, ci)}
                              className="cursor-pointer rounded px-1.5 py-1 text-[11px] text-gray-500 hover:bg-gray-100 hover:text-red-700"
                            >
                              <IconTrash size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addChild(idx)}
                          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-gray-200 bg-gray-50 px-3 py-2 text-[12px] font-semibold text-petrol-700 hover:bg-white"
                        >
                          <IconPlus size={12} />
                          Add Sub-Step
                        </button>
                      </div>
                    )}

                    {steps.length > 1 && (
                      <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">
                        <button
                          type="button"
                          onClick={() => removeStep(idx)}
                          className="cursor-pointer rounded text-[12px] font-medium text-gray-500 hover:text-red-700"
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

          <button
            type="button"
            onClick={addStep}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3 text-[13px] font-semibold text-gray-500 hover:border-petrol-500 hover:bg-gray-50 hover:text-petrol-700"
          >
            <IconPlus size={14} />
            Add Step
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center text-[12px] font-semibold text-ink">
        {label}
        {hint && (
          <span className="ml-1.5 text-[11px] font-normal text-gray-500">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function arrEq(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
