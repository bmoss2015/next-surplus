"use client";

// Settings clone · Phase D.4 — Template editor drawer (Email / SMS / Research).
//
// Three modes on one drawer, picked by the active templates tab:
//   email     name + subject + state + body
//   sms       name + state + body (plain text)
//   research  name + state + sale_type + ordered steps (name + url + notes)
//
// Email and SMS share upsertTemplate (channel: "email" | "sms") + deleteTemplate.
// Research uses upsertResearchTemplate + deleteResearchTemplate.
//
// Body is a plain <textarea> — rich text / merge-field picker is a Phase E
// upgrade. The drawer surfaces a small hint about the {{merge_field}} syntax
// so users know it'll get substituted when sending.

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

// Hard cap for the number of steps in a single playbook. Two-pane editor
// stays readable up to about this number; past it the left rail gets too
// scrolly. If we ever need 20+ step playbooks we should switch to a list
// view or paginate.
const MAX_PLAYBOOK_STEPS = 20;
import { useRouter } from "next/navigation";
import { Drawer } from "./Drawer";
import { MergeFieldPicker } from "./MergeFieldPicker";
import { US_STATES as US_STATE_OPTIONS } from "@/components/StatesPicker";
import {
  upsertTemplate,
  deleteTemplate,
  upsertResearchTemplate,
  deleteResearchTemplate,
} from "@/app/(app)/settings/_actions";
import type {
  PlaybookApplyMode,
  ResearchStep,
  ResearchTemplateRow,
  TemplateRow,
} from "@/lib/settings/fetch";

export type TemplateEditorState =
  | { kind: "closed" }
  | { kind: "new"; channel: "email" | "sms" | "research" }
  | { kind: "edit-template"; row: TemplateRow }
  | { kind: "edit-research"; row: ResearchTemplateRow };

export function TemplateEditorDrawer({
  state,
  onClose,
}: {
  state: TemplateEditorState;
  onClose: () => void;
}) {
  if (state.kind === "closed") {
    return <Drawer open={false} onClose={onClose} title=""> </Drawer>;
  }
  if (state.kind === "new" && state.channel === "research") {
    return <ResearchEditor open onClose={onClose} row={null} />;
  }
  if (state.kind === "edit-research") {
    return <ResearchEditor open onClose={onClose} row={state.row} />;
  }
  const channel =
    state.kind === "new"
      ? state.channel
      : state.row.channel.toLowerCase() === "sms"
        ? "sms"
        : "email";
  return (
    <TextEditor
      open
      onClose={onClose}
      channel={channel as "email" | "sms"}
      row={state.kind === "edit-template" ? state.row : null}
    />
  );
}

function TextEditor({
  open,
  onClose,
  channel,
  row,
}: {
  open: boolean;
  onClose: () => void;
  channel: "email" | "sms";
  row: TemplateRow | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(row?.name ?? "");
  const [stateCode, setStateCode] = useState(row?.state ?? "");
  const [subject, setSubject] = useState(row?.subject ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const subjectRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      // Re-seed the editor fields each time the drawer opens for a new row.
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(row?.name ?? "");
      setStateCode(row?.state ?? "");
      setSubject(row?.subject ?? "");
      setBody(row?.body ?? "");
      setErrMsg(null);
      setConfirmDelete(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, row]);

  function insertIntoBody(token: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function insertIntoSubject(token: string) {
    const el = subjectRef.current;
    if (!el) {
      setSubject((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? subject.length;
    const end = el.selectionEnd ?? subject.length;
    const next = subject.slice(0, start) + token + subject.slice(end);
    setSubject(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const ready = name.trim().length > 0 && body.trim().length > 0;

  function onSave() {
    setErrMsg(null);
    startTransition(async () => {
      const res = await upsertTemplate({
        id: row?.id ?? null,
        name: name.trim(),
        channel,
        state: stateCode.trim() || null,
        subject: channel === "email" ? subject.trim() || null : null,
        body: body.trim(),
      });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function onDelete() {
    if (!row) return;
    startTransition(async () => {
      const res = await deleteTemplate(row.id);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  const eyebrow = row
    ? channel === "email"
      ? "Edit Email Template"
      : "Edit SMS Template"
    : channel === "email"
      ? "New Email Template"
      : "New SMS Template";
  const title = row?.name || (channel === "email" ? "Email Template" : "SMS Template");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      footer={
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!ready || pending}
              onClick={onSave}
            >
              {pending ? "Saving…" : row ? "Save Changes" : "Add Template"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </button>
            {errMsg && (
              <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
                {errMsg}
              </span>
            )}
          </div>
          {row && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)" }}
              disabled={pending}
              onClick={() =>
                confirmDelete ? onDelete() : setConfirmDelete(true)
              }
            >
              {confirmDelete ? "Click again to confirm" : "Delete Template"}
            </button>
          )}
        </>
      }
    >
      <div className="drawer-field">
        <label className="drawer-label">Name</label>
        <input
          className="input"
          style={{ width: "100%" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            channel === "email" ? "Initial Outreach — Tax Sale" : "First Touch"
          }
          autoFocus
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">State</label>
        <div className="drawer-hint">
          Two-letter state code, or leave blank for templates that apply to
          every lead.
        </div>
        <input
          className="input"
          style={{ width: 120 }}
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value.toUpperCase())}
          placeholder="TX"
          maxLength={2}
        />
      </div>
      {channel === "email" && (
        <div className="drawer-field">
          <label className="drawer-label">Subject</label>
          <MergeFieldPicker onInsert={insertIntoSubject} compact />
          <input
            ref={subjectRef}
            className="input"
            style={{ width: "100%" }}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Surplus funds may be owed to you"
          />
        </div>
      )}
      <div className="drawer-field">
        <label className="drawer-label">Body</label>
        <div className="drawer-hint">
          Click a merge field below to insert it at the cursor. Fields get
          substituted with real values when the template is sent.
        </div>
        <MergeFieldPicker onInsert={insertIntoBody} />
        <textarea
          ref={bodyRef}
          className="input drawer-textarea"
          style={{ width: "100%" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            channel === "email"
              ? "Hi {{contact.first_name}},\n\nWe found surplus funds tied to your property at {{lead.address}}..."
              : "Hi {{contact.first_name}}, this is Bree from Moss Equity..."
          }
        />
      </div>
    </Drawer>
  );
}

function ResearchEditor({
  open,
  onClose,
  row,
}: {
  open: boolean;
  onClose: () => void;
  row: ResearchTemplateRow | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(row?.name ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [applyMode, setApplyMode] = useState<PlaybookApplyMode>(
    row?.apply_mode ?? "match"
  );
  const [applyStates, setApplyStates] = useState<string[]>(
    row?.apply_states ?? []
  );
  const [steps, setSteps] = useState<ResearchStep[]>(
    row?.steps?.length
      ? row.steps
      : [{ name: "", url: null, instructions: null, children: [] }]
  );
  // Two-pane editor: which step's edit form is shown in the right pane. Reset
  // to 0 each time the drawer opens.
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);
  // Drag-reorder state. dragFromIdx = the step being dragged; dragOverIdx =
  // the row currently being hovered (drawn with a top accent line).
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const stepNameRef = useRef<HTMLInputElement | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // Auto-focus the step name field whenever the user changes selection. Skip
  // the very first run after the drawer opens so the playbook name's
  // autoFocus wins for fresh playbooks. Uses useLayoutEffect so focus lands
  // before paint = no flicker.
  const skipNextFocus = useRef(true);
  useLayoutEffect(() => {
    if (!open) {
      skipNextFocus.current = true;
      return;
    }
    if (skipNextFocus.current) {
      skipNextFocus.current = false;
      return;
    }
    stepNameRef.current?.focus();
    // Move the caret to end so existing names are easy to extend.
    const el = stepNameRef.current;
    if (el && el.value) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [selectedStepIdx, open]);

  useEffect(() => {
    if (open) {
      // Re-seed the step editor fields each time the drawer opens for a new row.
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(row?.name ?? "");
      setDescription(row?.description ?? "");
      setApplyMode(row?.apply_mode ?? "match");
      setApplyStates(row?.apply_states ?? []);
      setSteps(
        row?.steps?.length
          ? row.steps
          : [{ name: "", url: null, instructions: null, children: [] }]
      );
      setSelectedStepIdx(0);
      setErrMsg(null);
      setConfirmDelete(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, row]);

  const ready =
    name.trim().length > 0 &&
    steps.some((s) => s.name.trim().length > 0) &&
    (applyMode !== "match" || applyStates.length > 0);

  function setStep(
    idx: number,
    patch: Partial<{ name: string; url: string | null; instructions: string | null }>
  ) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function toggleStepHasChildren(idx: number) {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const hasChildren = s.children && s.children.length > 0;
        if (hasChildren) return { ...s, children: [] };
        return {
          ...s,
          children: [{ name: "", url: null, instructions: null, children: [] }],
        };
      })
    );
  }
  function setChild(
    idx: number,
    childIdx: number,
    patch: Partial<{ name: string; url: string | null; instructions: string | null }>
  ) {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        return {
          ...s,
          children: (s.children ?? []).map((c, ci) =>
            ci === childIdx ? { ...c, ...patch } : c
          ),
        };
      })
    );
  }
  function addChild(idx: number) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i !== idx
          ? s
          : {
              ...s,
              children: [
                ...(s.children ?? []),
                { name: "", url: null, instructions: null, children: [] },
              ],
            }
      )
    );
  }
  function removeChild(idx: number, childIdx: number) {
    setSteps((prev) =>
      prev.map((s, i) =>
        i !== idx
          ? s
          : {
              ...s,
              children: (s.children ?? []).filter((_, ci) => ci !== childIdx),
            }
      )
    );
  }
  function addStep() {
    setSteps((prev) => {
      if (prev.length >= MAX_PLAYBOOK_STEPS) return prev;
      const next = [
        ...prev,
        { name: "", url: null, instructions: null, children: [] },
      ];
      // Jump the right pane to the newly added step so the user can type
      // immediately.
      setSelectedStepIdx(next.length - 1);
      return next;
    });
  }
  function removeStep(idx: number) {
    setSteps((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // Clamp the selection so we never point past the new array.
      setSelectedStepIdx((cur) =>
        Math.min(cur, Math.max(0, next.length - 1))
      );
      return next;
    });
  }
  function moveStep(from: number, to: number) {
    if (from === to) return;
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    // Keep the moved step selected after reorder so the right pane stays
    // in sync with what the user just dropped.
    setSelectedStepIdx(to);
  }

  function onSave() {
    setErrMsg(null);
    startTransition(async () => {
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
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function onDelete() {
    if (!row) return;
    startTransition(async () => {
      const res = await deleteResearchTemplate(row.id);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={720}
      eyebrow={row ? "Edit Playbook" : "New Playbook"}
      title={row?.name || "Playbook"}
      footer={
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!ready || pending}
              onClick={onSave}
            >
              {pending ? "Saving…" : row ? "Save Changes" : "Save Playbook"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </button>
            {errMsg && (
              <span style={{ color: "var(--danger)", fontSize: 12.5 }}>
                {errMsg}
              </span>
            )}
          </div>
          {row && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)" }}
              disabled={pending}
              onClick={() =>
                confirmDelete ? onDelete() : setConfirmDelete(true)
              }
            >
              {confirmDelete ? "Click again to confirm" : "Delete Playbook"}
            </button>
          )}
        </>
      }
    >
      <div className="drawer-field">
        <label className="drawer-label">Name</label>
        <input
          className="input"
          style={{ width: "100%" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Texas Tax Sale Research"
          autoFocus
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Short Description</label>
        <div className="drawer-hint">
          Optional one-liner shown on the playbook list. Leave blank to
          skip.
        </div>
        <input
          className="input"
          style={{ width: "100%" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Three calls, three texts, two letters, close"
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">When To Apply</label>
        <div className="drawer-hint">
          Pick how this playbook attaches to imported leads. You can
          change it any time.
        </div>
        <div className="role-choice" style={{ marginTop: 6 }}>
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
          ).map((opt) => (
            <label
              key={opt.v}
              className={
                "role-choice-card" + (applyMode === opt.v ? " selected" : "")
              }
              onClick={() => setApplyMode(opt.v)}
            >
              <input
                type="radio"
                name="apply-mode"
                checked={applyMode === opt.v}
                onChange={() => setApplyMode(opt.v)}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {opt.hint}
                </div>
              </div>
            </label>
          ))}
        </div>
        {applyMode === "match" && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3, #64748b)",
                marginBottom: 6,
              }}
            >
              States &nbsp;
              <button
                type="button"
                onClick={() => setApplyStates(US_STATE_OPTIONS.map((s) => s.code))}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--brand, #0d4b3a)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
              >
                Select All
              </button>
              &nbsp;·&nbsp;
              <button
                type="button"
                onClick={() => setApplyStates([])}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--text-3, #64748b)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
              >
                Clear All
              </button>
              <span style={{ marginLeft: 8 }}>
                {applyStates.length} of {US_STATE_OPTIONS.length} selected
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 6,
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 8,
                maxHeight: 220,
                overflowY: "auto",
                background: "var(--canvas, #fafbfc)",
              }}
            >
              {US_STATE_OPTIONS.map((s) => {
                const isOn = applyStates.includes(s.code);
                return (
                  <label
                    key={s.code}
                    onClick={() =>
                      setApplyStates((prev) =>
                        isOn
                          ? prev.filter((x) => x !== s.code)
                          : [...prev, s.code]
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 6px",
                      borderRadius: 4,
                      cursor: "pointer",
                      background: isOn ? "rgba(13, 75, 58, 0.08)" : "transparent",
                      fontSize: 12,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => {}}
                      style={{ cursor: "pointer" }}
                    />
                    <span
                      style={{
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        width: 24,
                      }}
                    >
                      {s.code}
                    </span>
                    <span
                      style={{
                        color: "var(--text-2, #475569)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                    </span>
                  </label>
                );
              })}
            </div>
            {applyStates.length === 0 && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--danger, #b91c1c)",
                  marginTop: 6,
                }}
              >
                Pick at least one state, or switch to All Imported Leads.
              </div>
            )}
          </div>
        )}
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Steps</label>
        <div className="drawer-hint">
          One row per checkbox the operator will see on the lead&apos;s
          Playbook tab. Click any step on the left to edit it on the right.
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 12,
            marginTop: 8,
            minHeight: 280,
          }}
        >
          {/* LEFT: step list */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--canvas, #fafbfc)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto" }}>
              {steps.map((s, idx) => {
                const isSelected = idx === selectedStepIdx;
                const isDragging = dragFromIdx === idx;
                const isDragOver =
                  dragOverIdx === idx && dragFromIdx !== null && dragFromIdx !== idx;
                const displayName = s.name.trim() || `Step ${idx + 1}`;
                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => {
                      setDragFromIdx(idx);
                      e.dataTransfer.effectAllowed = "move";
                      // Some browsers require data to be set for drag to fire.
                      e.dataTransfer.setData("text/plain", String(idx));
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverIdx !== idx) setDragOverIdx(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverIdx === idx) setDragOverIdx(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragFromIdx !== null) moveStep(dragFromIdx, idx);
                      setDragFromIdx(null);
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => {
                      setDragFromIdx(null);
                      setDragOverIdx(null);
                    }}
                    onClick={() => setSelectedStepIdx(idx)}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      width: "100%",
                      padding: "8px 8px 8px 4px",
                      background: isSelected
                        ? "rgba(13, 75, 58, 0.08)"
                        : "transparent",
                      borderLeft: isSelected
                        ? "3px solid var(--brand, #0d4b3a)"
                        : "3px solid transparent",
                      borderTop: isDragOver
                        ? "2px solid var(--brand, #0d4b3a)"
                        : "2px solid transparent",
                      borderBottom: "1px solid var(--hairline, #e2e8f0)",
                      cursor: "grab",
                      textAlign: "left",
                      fontSize: 12.5,
                      color: isSelected ? "var(--text-1, #0f172a)" : "var(--text-2, #475569)",
                      fontWeight: isSelected ? 500 : 400,
                      opacity: isDragging ? 0.4 : 1,
                    }}
                  >
                    {/* Drag handle dots */}
                    <span
                      aria-hidden
                      style={{
                        color: "#cbd5e1",
                        fontSize: 12,
                        lineHeight: 1,
                        userSelect: "none",
                        flexShrink: 0,
                        width: 10,
                        textAlign: "center",
                      }}
                    >
                      ⋮⋮
                    </span>
                    <span
                      style={{
                        background: "var(--brand, #0d4b3a)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        height: 18,
                        minWidth: 22,
                        padding: "0 5px",
                        borderRadius: 3,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={displayName}
                    >
                      {displayName}
                    </span>
                    {(s.children ?? []).length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-3, #64748b)",
                          background: "var(--surface, #fff)",
                          border: "1px solid var(--hairline, #e2e8f0)",
                          borderRadius: 3,
                          padding: "1px 5px",
                          fontVariantNumeric: "tabular-nums",
                          flexShrink: 0,
                        }}
                      >
                        {(s.children ?? []).length}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addStep}
              disabled={steps.length >= MAX_PLAYBOOK_STEPS}
              style={{
                width: "100%",
                padding: "8px 10px",
                background: "var(--surface, #fff)",
                borderTop: "1px solid var(--hairline, #e2e8f0)",
                cursor:
                  steps.length >= MAX_PLAYBOOK_STEPS ? "not-allowed" : "pointer",
                textAlign: "left",
                fontSize: 12,
                fontWeight: 500,
                color:
                  steps.length >= MAX_PLAYBOOK_STEPS
                    ? "var(--text-3, #94a3b8)"
                    : "var(--brand, #0d4b3a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                {steps.length >= MAX_PLAYBOOK_STEPS
                  ? `Limit reached (${MAX_PLAYBOOK_STEPS})`
                  : "+ Add Step"}
              </span>
              <span style={{ fontSize: 10.5, color: "var(--text-3, #94a3b8)" }}>
                {steps.length} / {MAX_PLAYBOOK_STEPS}
              </span>
            </button>
          </div>

          {/* RIGHT: edit form for selected step */}
          {steps[selectedStepIdx] && (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 12,
                background: "var(--surface, #fff)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--text-3, #64748b)",
                  }}
                >
                  Editing Step {selectedStepIdx + 1}
                </span>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(selectedStepIdx)}
                    title="Remove this step from the playbook"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: "var(--danger, #b91c1c)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(185, 28, 28, 0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    Remove Step
                  </button>
                )}
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: "var(--text-3, #64748b)",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  Step Name
                </label>
                <input
                  ref={stepNameRef}
                  className="input"
                  style={{ width: "100%" }}
                  value={steps[selectedStepIdx].name}
                  onChange={(e) =>
                    setStep(selectedStepIdx, { name: e.target.value })
                  }
                  placeholder='e.g. "Send opening letter"'
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: "var(--text-3, #64748b)",
                    display: "block",
                    marginBottom: 3,
                  }}
                >
                  URL (optional)
                </label>
                <input
                  className="input"
                  style={{ width: "100%" }}
                  value={steps[selectedStepIdx].url ?? ""}
                  onChange={(e) =>
                    setStep(selectedStepIdx, {
                      url: e.target.value || null,
                    })
                  }
                  placeholder="https://..."
                />
              </div>
              {(() => {
                const cur = steps[selectedStepIdx];
                const hasChildren = (cur.children ?? []).length > 0;
                return (
                  <>
                    {!hasChildren && (
                      <div>
                        <label
                          style={{
                            fontSize: 11,
                            color: "var(--text-3, #64748b)",
                            display: "block",
                            marginBottom: 3,
                          }}
                        >
                          Description (optional)
                        </label>
                        <textarea
                          className="input"
                          style={{
                            width: "100%",
                            minHeight: 100,
                            resize: "vertical",
                          }}
                          value={cur.instructions ?? ""}
                          onChange={(e) =>
                            setStep(selectedStepIdx, {
                              instructions: e.target.value || null,
                            })
                          }
                          placeholder="What should the operator do at this step?"
                        />
                      </div>
                    )}
                    <label
                      onClick={() => toggleStepHasChildren(selectedStepIdx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: "var(--canvas, #fafbfc)",
                        border: "1px solid var(--hairline, #e2e8f0)",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 18,
                          borderRadius: 999,
                          background: hasChildren
                            ? "var(--brand, #0d4b3a)"
                            : "#cbd5e1",
                          position: "relative",
                          flex: "none",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            left: hasChildren ? 14 : 2,
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background: "#fff",
                            transition: "left 0.15s ease",
                          }}
                        />
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {hasChildren
                          ? "This Step Has Sub-Steps"
                          : "This Step Doesn't Have Sub-Steps"}
                      </span>
                    </label>
                    {hasChildren && (
                      <div
                        style={{
                          border: "1px solid var(--hairline, #e2e8f0)",
                          borderRadius: 6,
                          overflow: "hidden",
                          background: "var(--canvas, #fafbfc)",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "32px 1.1fr 1.4fr 60px",
                            gap: 8,
                            padding: "8px 10px",
                            borderBottom:
                              "1px solid var(--hairline, #e2e8f0)",
                            background: "var(--surface, #fff)",
                            fontSize: 10.5,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "var(--text-3, #64748b)",
                            fontWeight: 600,
                          }}
                        >
                          <span>#</span>
                          <span>Sub-Step Name</span>
                          <span>Description</span>
                          <span></span>
                        </div>
                        {(cur.children ?? []).map((child, ci) => (
                          <div
                            key={ci}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "32px 1.1fr 1.4fr 60px",
                              gap: 8,
                              padding: "8px 10px",
                              borderBottom:
                                ci ===
                                (cur.children ?? []).length - 1
                                  ? "none"
                                  : "1px solid var(--hairline, #e2e8f0)",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-3, #64748b)",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {selectedStepIdx + 1}.{ci + 1}
                            </span>
                            <input
                              className="input"
                              style={{ fontSize: 12.5 }}
                              value={child.name}
                              onChange={(e) =>
                                setChild(selectedStepIdx, ci, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Sub-step name"
                            />
                            <input
                              className="input"
                              style={{ fontSize: 12.5 }}
                              value={child.instructions ?? ""}
                              onChange={(e) =>
                                setChild(selectedStepIdx, ci, {
                                  instructions: e.target.value || null,
                                })
                              }
                              placeholder="Optional"
                            />
                            <button
                              type="button"
                              onClick={() => removeChild(selectedStepIdx, ci)}
                              style={{
                                fontSize: 11,
                                color: "var(--text-3, #64748b)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "4px 6px",
                                borderRadius: 4,
                              }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLButtonElement).style.color =
                                  "var(--danger, #b91c1c)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLButtonElement).style.color =
                                  "var(--text-3, #64748b)")
                              }
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addChild(selectedStepIdx)}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "8px 10px",
                            background: "var(--surface, #fff)",
                            borderTop: "1px solid var(--hairline, #e2e8f0)",
                            color: "var(--brand, #0d4b3a)",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          + Add Sub-Step
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
