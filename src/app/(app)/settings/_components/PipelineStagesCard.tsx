"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStage,
  updateStage,
  reorderStages,
  deleteStage,
} from "@/lib/stages/actions";
import {
  MAX_STAGES,
  SOFT_STAGE_LIMIT,
  STAGE_KINDS,
  STAGE_KIND_LABELS,
  type OrgStage,
  type StageKind,
} from "@/lib/stages/types";

export function PipelineStagesCard({
  initialStages,
  canEdit,
}: {
  initialStages: OrgStage[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [, startTransition] = useTransition();
  const [addingName, setAddingName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgStage | null>(null);
  const [moveToId, setMoveToId] = useState<string>("");
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function refresh() {
    router.refresh();
  }

  function onAdd() {
    const name = addingName.trim();
    if (!name) return;
    setErrMsg(null);
    startTransition(async () => {
      const res = await createStage({ name, kind: "open" });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setAddingName("");
      refresh();
    });
  }

  function onSaveName(id: string) {
    const name = editName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    setErrMsg(null);
    startTransition(async () => {
      const res = await updateStage({ id, name });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setEditingId(null);
      refresh();
    });
  }

  function onChangeKind(id: string, kind: StageKind) {
    setErrMsg(null);
    startTransition(async () => {
      const res = await updateStage({ id, kind });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      refresh();
    });
  }

  function moveLocal(from: number, to: number) {
    if (from === to) return;
    const next = [...stages];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setStages(next);
    setErrMsg(null);
    startTransition(async () => {
      const res = await reorderStages(next.map((s) => s.id));
      if (!res.ok) {
        setErrMsg(res.error);
        setStages(initialStages);
        return;
      }
      refresh();
    });
  }

  function onConfirmDelete() {
    if (!deleteTarget) return;
    setErrMsg(null);
    startTransition(async () => {
      const res = await deleteStage({
        id: deleteTarget.id,
        moveLeadsToStageId: moveToId || null,
      });
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setDeleteTarget(null);
      setMoveToId("");
      refresh();
    });
  }

  const atCap = stages.length >= MAX_STAGES;
  const overSoft = stages.length > SOFT_STAGE_LIMIT;

  return (
    <div className="settings-card">
      <div className="settings-card-head">
        <div>
          <div className="settings-card-eyebrow">Pipeline Stages</div>
          <div className="settings-card-title">Stages</div>
          <div className="settings-card-desc">
            The columns on the Leads Kanban. Drag to reorder. Outcome
            controls dashboard math (Won and Lost are terminal, Open
            stages count as active pipeline).
          </div>
        </div>
        {canEdit && (
          <div className="settings-card-control" style={{ gap: 8 }}>
            <input
              className="input"
              placeholder="New stage name"
              value={addingName}
              onChange={(e) => setAddingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAdd();
              }}
              disabled={atCap}
              style={{ width: 200 }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onAdd}
              disabled={!addingName.trim() || atCap}
            >
              <i className="icon icon-plus" /> Add Stage
            </button>
          </div>
        )}
      </div>

      {overSoft && (
        <div
          style={{
            padding: "8px 24px",
            fontSize: 12,
            color: "var(--text-2)",
            background: "#f8fafc",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {stages.length} of {MAX_STAGES} stages used. Consider keeping
          your pipeline under {SOFT_STAGE_LIMIT} for easier scanning.
        </div>
      )}

      {errMsg && (
        <div
          style={{
            padding: "8px 24px",
            fontSize: 12.5,
            color: "var(--danger)",
            background: "#fef2f2",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {errMsg}
        </div>
      )}

      <div className="list" style={{ border: 0, borderRadius: 0 }}>
        {stages.map((s, idx) => {
          const isEditing = editingId === s.id;
          const isDragging = dragFromIdx === idx;
          const isDragOver =
            dragOverIdx === idx && dragFromIdx !== null && dragFromIdx !== idx;
          return (
            <div
              key={s.id}
              draggable={canEdit && !isEditing}
              onDragStart={(e) => {
                if (!canEdit) return;
                setDragFromIdx(idx);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(idx));
              }}
              onDragOver={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverIdx !== idx) setDragOverIdx(idx);
              }}
              onDragLeave={() => {
                if (dragOverIdx === idx) setDragOverIdx(null);
              }}
              onDrop={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                if (dragFromIdx !== null) moveLocal(dragFromIdx, idx);
                setDragFromIdx(null);
                setDragOverIdx(null);
              }}
              onDragEnd={() => {
                setDragFromIdx(null);
                setDragOverIdx(null);
              }}
              className="list-row reason-row"
              style={{
                padding: "10px 24px",
                opacity: isDragging ? 0.4 : 1,
                borderTop: isDragOver
                  ? "2px solid var(--brand, #0d4b3a)"
                  : undefined,
                cursor: canEdit && !isEditing ? "grab" : "default",
              }}
            >
              {canEdit && (
                <span
                  aria-hidden
                  style={{
                    color: "#cbd5e1",
                    fontSize: 12,
                    userSelect: "none",
                    marginRight: 8,
                  }}
                >
                  ⋮⋮
                </span>
              )}
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
                  marginRight: 10,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isEditing ? (
                  <input
                    className="input"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => onSaveName(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveName(s.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) return;
                      setEditingId(s.id);
                      setEditName(s.name);
                    }}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: canEdit ? "text" : "default",
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--text-1)",
                    }}
                  >
                    {s.name}
                  </button>
                )}
              </div>
              <div className="overflow flex items-center gap-2 ml-2">
                <select
                  className="input"
                  value={s.kind}
                  disabled={!canEdit}
                  onChange={(e) => onChangeKind(s.id, e.target.value as StageKind)}
                  style={{ fontSize: 12, padding: "4px 6px", width: 90 }}
                >
                  {STAGE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {STAGE_KIND_LABELS[k]}
                    </option>
                  ))}
                </select>
                {canEdit && (
                  <button
                    type="button"
                    className="icon-btn"
                    title="Delete stage"
                    onClick={() => {
                      setDeleteTarget(s);
                      setMoveToId("");
                    }}
                  >
                    <i className="icon icon-trash" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {deleteTarget && (
        <DeleteStageDialog
          target={deleteTarget}
          stages={stages}
          moveToId={moveToId}
          setMoveToId={setMoveToId}
          onConfirm={onConfirmDelete}
          onCancel={() => {
            setDeleteTarget(null);
            setMoveToId("");
            setErrMsg(null);
          }}
        />
      )}
    </div>
  );
}

function DeleteStageDialog({
  target,
  stages,
  moveToId,
  setMoveToId,
  onConfirm,
  onCancel,
}: {
  target: OrgStage;
  stages: OrgStage[];
  moveToId: string;
  setMoveToId: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const eligible = stages.filter((s) => s.id !== target.id);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.4)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 6,
          padding: 24,
          width: 440,
          maxWidth: "100%",
          boxShadow: "0 12px 32px rgba(15,23,42,0.18)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          Delete &quot;{target.name}&quot;?
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 14, lineHeight: 1.5 }}>
          Any leads currently in this stage need a new home. Pick another
          stage to move them to (skip if you&apos;re sure no leads use this
          stage).
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 4 }}>
            Move existing leads to
          </label>
          <select
            className="input"
            value={moveToId}
            onChange={(e) => setMoveToId(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">No leads to move</option>
            {eligible.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onConfirm}
            style={{ background: "var(--danger)", color: "#fff" }}
          >
            Delete Stage
          </button>
        </div>
      </div>
    </div>
  );
}
