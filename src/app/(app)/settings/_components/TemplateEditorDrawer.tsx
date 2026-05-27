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
  const [stateCode, setStateCode] = useState(row?.state ?? "");
  const [saleType, setSaleType] = useState<"TAX" | "MTG" | "">(
    row?.sale_type ?? ""
  );
  const [steps, setSteps] = useState(
    row?.steps?.length
      ? row.steps
      : [{ name: "", url: null, instructions: null }]
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
      setStateCode(row?.state ?? "");
      setSaleType(row?.sale_type ?? "");
      setSteps(
        row?.steps?.length
          ? row.steps
          : [{ name: "", url: null, instructions: null }]
      );
      setSelectedStepIdx(0);
      setErrMsg(null);
      setConfirmDelete(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, row]);

  const ready =
    name.trim().length > 0 && steps.some((s) => s.name.trim().length > 0);

  function setStep(
    idx: number,
    patch: Partial<{ name: string; url: string | null; instructions: string | null }>
  ) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function addStep() {
    setSteps((prev) => {
      if (prev.length >= MAX_PLAYBOOK_STEPS) return prev;
      const next = [...prev, { name: "", url: null, instructions: null }];
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
        // Playbook-level description is no longer surfaced in the UI (per
        // design decision); preserve any existing value rather than wipe it
        // when an old playbook is edited. New playbooks pass null.
        description: row?.description ?? null,
        state: stateCode.trim() || null,
        sale_type: saleType || null,
        steps: steps.map((s) => ({
          name: s.name,
          url: s.url,
          instructions: s.instructions,
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
        <label className="drawer-label">State</label>
        <div className="drawer-hint">
          Which state does this checklist apply to. Pick All States for a
          template that runs on every lead regardless of state.
        </div>
        <select
          className="input"
          style={{ width: 220 }}
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value)}
        >
          <option value="">All States</option>
          {US_STATE_OPTIONS.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} — {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Sale Type</label>
        <div className="role-choice">
          {(["", "TAX", "MTG"] as const).map((v) => (
            <label
              key={v || "ANY"}
              className={"role-choice-card" + (saleType === v ? " selected" : "")}
              onClick={() => setSaleType(v)}
            >
              <input
                type="radio"
                name="sale-type"
                checked={saleType === v}
                onChange={() => setSaleType(v)}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {v === "" ? "Any" : v === "TAX" ? "Tax Sale" : "Mortgage"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {v === ""
                    ? "Applies to both tax and mortgage leads."
                    : v === "TAX"
                      ? "Only suggested on tax-sale leads."
                      : "Only suggested on mortgage-foreclosure leads."}
                </div>
              </div>
            </label>
          ))}
        </div>
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
                  value={steps[selectedStepIdx].instructions ?? ""}
                  onChange={(e) =>
                    setStep(selectedStepIdx, {
                      instructions: e.target.value || null,
                    })
                  }
                  placeholder="What should the operator do at this step?"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
