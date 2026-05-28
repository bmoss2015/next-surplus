"use client";

// Settings clone · Phase C.2 — Pipeline & Lost Reasons wired to real data.
//
// Two cards in one panel (the mockup combined them):
//   1. Needs Action threshold — saves on blur via setNeedsActionThreshold.
//   2. Lost Reasons list — add via addLostReason, soft-delete (archive)
//      via setLostReasonArchived. We render only un-archived rows.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setNeedsActionThreshold,
  addLostReason,
  setLostReasonArchived,
  countLeadsUsingLostReason,
  reassignAndArchiveLostReason,
} from "@/app/(app)/settings/_actions";
import type { LostReasonAdminRow } from "@/lib/settings/fetch";
import type { OrgStage } from "@/lib/stages/types";
import {
  ReassignAndRemoveDialog,
  type ReassignOption,
} from "./ReassignAndRemoveDialog";
import { PipelineStagesCard } from "./PipelineStagesCard";

export function PipelineSection({
  initialNeedsActionThreshold,
  initialLostReasons,
  initialStages,
  canEdit,
}: {
  initialNeedsActionThreshold: number | null;
  initialLostReasons: LostReasonAdminRow[];
  initialStages: OrgStage[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [threshold, setThreshold] = useState(
    initialNeedsActionThreshold == null ? "" : String(initialNeedsActionThreshold)
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [addLabel, setAddLabel] = useState("");
  const [, startTransition] = useTransition();

  function saveThreshold() {
    setErrMsg(null);
    const trimmed = threshold.trim();
    let days: number | null = null;
    if (trimmed) {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 1) {
        setErrMsg("Enter a whole number of days, or leave blank to disable.");
        return;
      }
      days = n;
    }
    startTransition(async () => {
      const res = await setNeedsActionThreshold(days);
      if (!res.ok) setErrMsg(res.error);
      else router.refresh();
    });
  }

  function add() {
    const label = addLabel.trim();
    if (!label) return;
    startTransition(async () => {
      const res = await addLostReason(label);
      if (!res.ok) setErrMsg(res.error);
      else {
        setAddLabel("");
        router.refresh();
      }
    });
  }

  const [confirmingArchive, setConfirmingArchive] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<{
    id: string;
    label: string;
    count: number;
  } | null>(null);

  function archive(id: string) {
    setErrMsg(null);
    // Click 1: ask the server how many leads use this reason. If zero,
    // arm the regular confirm flow (two-click trash). If non-zero, open
    // the Reassign dialog instead.
    if (confirmingArchive !== id && reassignTarget?.id !== id) {
      startTransition(async () => {
        const usage = await countLeadsUsingLostReason(id);
        if (!usage.ok) {
          setErrMsg(usage.error);
          return;
        }
        if (usage.count === 0) {
          setConfirmingArchive(id);
        } else {
          setReassignTarget({
            id,
            label: usage.label,
            count: usage.count,
          });
        }
      });
      return;
    }
    // Click 2 on a zero-usage reason: actually archive.
    if (confirmingArchive === id) {
      startTransition(async () => {
        const res = await setLostReasonArchived(id, true);
        if (!res.ok) setErrMsg(res.error);
        else {
          setConfirmingArchive(null);
          router.refresh();
        }
      });
    }
  }

  const liveReasons = initialLostReasons.filter((r) => !r.archived);

  return (
    <section id="panel-pipeline" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Leads</a>
        <i className="icon icon-chevron-right" />
        <span>Pipeline &amp; Lost Reasons</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Pipeline &amp; Lost Reasons</h1>
          <p className="section-desc">
            How leads move through your pipeline and the reasons they can be
            marked Lost.
          </p>
        </div>
      </div>

      <PipelineStagesCard initialStages={initialStages} canEdit={canEdit} />

      <div className="settings-card">
        <div className="settings-card-head">
          <div>
            <div className="settings-card-eyebrow">Auto-Flag</div>
            <div className="settings-card-title">Needs Action Threshold</div>
            <div className="settings-card-desc">
              Leads with no note, task, or stage change in this many days are
              automatically flagged Needs Action on the Daily Work board.
              Leave blank to disable.
            </div>
          </div>
          <div className="settings-card-control">
            <div className="field" style={{ width: 180 }}>
              <input
                className="input tabular has-suffix text-right"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                onBlur={saveThreshold}
              />
              <span className="suffix">days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-head">
          <div>
            <div className="settings-card-eyebrow">Lost Reasons</div>
            <div className="settings-card-title">Mark Lost Dropdown</div>
            <div className="settings-card-desc">
              Options that appear when marking a lead Lost.
            </div>
          </div>
          <div className="settings-card-control" style={{ gap: 8 }}>
            <input
              className="input"
              placeholder="New reason"
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
              }}
              style={{ width: 200 }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={add}
              disabled={!addLabel.trim()}
            >
              <i className="icon icon-plus" /> Add Reason
            </button>
          </div>
        </div>
        {/* Inside-card list rows take 24px horizontal padding so each label
            aligns with "Mark Lost Dropdown" up in the card head (which uses
            settings-card-head's 22px 24px). The default .list-row 16px
            would land them 8px further left of the head copy. */}
        <div className="list" style={{ border: 0, borderRadius: 0 }}>
          {liveReasons.length === 0 ? (
            <div
              className="list-row reason-row"
              style={{ color: "var(--text-3)", fontSize: 13, padding: "13px 24px" }}
            >
              No lost reasons yet. Add one above to populate the Mark Lost
              dropdown.
            </div>
          ) : (
            liveReasons.map((r) => (
              <div
                key={r.id}
                className="list-row reason-row"
                style={{ padding: "13px 24px" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium">{r.label}</div>
                </div>
                <div className="overflow flex items-center gap-2 ml-2">
                  {confirmingArchive === r.id && (
                    <span
                      className="text-[11.5px]"
                      style={{ color: "var(--danger)" }}
                    >
                      Click again to archive
                    </span>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    title={
                      confirmingArchive === r.id
                        ? "Confirm archive"
                        : "Archive (existing leads keep this label; new leads won't see it)"
                    }
                    onClick={() => archive(r.id)}
                    style={
                      confirmingArchive === r.id
                        ? { color: "var(--danger)" }
                        : undefined
                    }
                  >
                    <i className="icon icon-trash" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {errMsg && (
        <div className="mt-3" style={{ color: "var(--danger)", fontSize: 12.5 }}>
          {errMsg}
        </div>
      )}

      <ReassignAndRemoveDialog
        open={Boolean(reassignTarget)}
        onClose={() => setReassignTarget(null)}
        itemLabel={reassignTarget?.label ?? ""}
        itemKind="lost reason"
        dependentNoun="leads"
        dependentCount={reassignTarget?.count ?? 0}
        options={
          (liveReasons
            .filter((r) => r.id !== reassignTarget?.id)
            .map((r) => ({ id: r.id, label: r.label })) as ReassignOption[]) ?? []
        }
        onCommit={async (replacementId) => {
          if (!reassignTarget) {
            return { ok: false as const, error: "No target" };
          }
          const res = await reassignAndArchiveLostReason(
            reassignTarget.id,
            replacementId
          );
          if (!res.ok) return { ok: false as const, error: res.error };
          router.refresh();
          return { ok: true as const };
        }}
      />
    </section>
  );
}
