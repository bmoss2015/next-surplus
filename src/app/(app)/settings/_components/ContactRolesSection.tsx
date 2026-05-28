"use client";

// Contact Roles panel. Lists org-wide custom role labels and lets admins
// add new ones from this screen (instead of having to create a contact
// on a lead first). Delete is gated by usage check on lead_parties:
// roles in use can't be deleted until the contacts are reassigned.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@tabler/icons-react";
import {
  addOrgCustomRole,
  deleteOrgCustomRole,
  countContactsUsingCustomRole,
  reassignAndDeleteOrgCustomRole,
} from "@/app/(app)/settings/_actions";
import {
  ReassignAndRemoveDialog,
  type ReassignOption,
} from "./ReassignAndRemoveDialog";

export function ContactRolesSection({
  initial,
}: {
  initial: string[];
}) {
  const router = useRouter();
  const [labels, setLabels] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onAdd() {
    const clean = draft.trim();
    setErrMsg(null);
    if (!clean) return;
    if (labels.includes(clean)) {
      setErrMsg("That role already exists.");
      return;
    }
    startTransition(async () => {
      const res = await addOrgCustomRole(clean);
      if (!res.ok) {
        setErrMsg(res.error);
        return;
      }
      setLabels((prev) => [...prev, clean].sort());
      setDraft("");
      router.refresh();
    });
  }

  const [reassignTarget, setReassignTarget] = useState<{
    label: string;
    count: number;
  } | null>(null);

  function onDelete(label: string) {
    setErrMsg(null);
    // Click 1: check usage. Zero in use → arm two-click confirm.
    // Non-zero → open Reassign dialog with the other roles as options.
    if (confirmingDelete !== label && reassignTarget?.label !== label) {
      startTransition(async () => {
        const usage = await countContactsUsingCustomRole(label);
        if (!usage.ok) {
          setErrMsg(usage.error);
          return;
        }
        if (usage.count === 0) {
          setConfirmingDelete(label);
        } else {
          setReassignTarget({ label, count: usage.count });
        }
      });
      return;
    }
    if (confirmingDelete === label) {
      startTransition(async () => {
        const res = await deleteOrgCustomRole(label);
        if (!res.ok) {
          setErrMsg(res.error);
          setConfirmingDelete(null);
          return;
        }
        setLabels((prev) => prev.filter((l) => l !== label));
        setConfirmingDelete(null);
        router.refresh();
      });
    }
  }

  return (
    <section id="panel-contact-roles" className="panel active">
      <div className="breadcrumb">
        <a>Settings</a>
        <i className="icon icon-chevron-right" />
        <a>Leads</a>
        <i className="icon icon-chevron-right" />
        <span>Contact Roles</span>
      </div>
      <div className="page-head">
        <div>
          <h1 className="section-h1">Contact Roles</h1>
          <p className="section-desc">
            Custom labels for the extra people you track on a lead, anyone
            who isn&apos;t the owner or attorney. Use these for parties like
            servicers, process servers, title researchers, or anyone else
            specific to your workflow.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4" style={{ maxWidth: 480, marginTop: 8 }}>
        <input
          className="input"
          style={{ flex: 1 }}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setErrMsg(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="Process Server, Title Researcher, …"
          maxLength={60}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onAdd}
          disabled={pending || draft.trim().length === 0}
        >
          {pending ? "Adding…" : "Add Role"}
        </button>
      </div>

      <div className="role-chip-grid" style={{ marginTop: 8 }}>
        {labels.length === 0 ? null : (
          labels.map((label) => {
            const armed = confirmingDelete === label;
            return (
              <span
                key={label}
                className="role-chip"
                style={
                  armed
                    ? {
                        borderColor: "var(--danger)",
                        color: "var(--danger)",
                      }
                    : undefined
                }
              >
                {label}
                <button
                  type="button"
                  onClick={() => onDelete(label)}
                  className="cursor-pointer"
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    marginLeft: 4,
                    color: armed ? "var(--danger)" : "var(--text-3)",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  title={
                    armed
                      ? "Click again to delete"
                      : "Delete this role (must not be in use)"
                  }
                  disabled={pending}
                >
                  <IconX size={12} stroke={2} />
                </button>
              </span>
            );
          })
        )}
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
        itemKind="contact role"
        dependentNoun="contacts"
        dependentCount={reassignTarget?.count ?? 0}
        options={
          labels
            .filter((l) => l !== reassignTarget?.label)
            .map((l) => ({ id: l, label: l })) as ReassignOption[]
        }
        onCommit={async (replacementLabel) => {
          if (!reassignTarget) return { ok: false as const, error: "No target" };
          const res = await reassignAndDeleteOrgCustomRole(
            reassignTarget.label,
            replacementLabel
          );
          if (!res.ok) return { ok: false as const, error: res.error };
          setLabels((prev) => prev.filter((l) => l !== reassignTarget.label));
          router.refresh();
          return { ok: true as const };
        }}
      />
    </section>
  );
}
