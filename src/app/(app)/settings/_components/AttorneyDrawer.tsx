"use client";

// Settings clone · Phase D — Attorney add/edit drawer.
//
// Open with attorney=null for a fresh add, or attorney=<row> to edit. On
// save calls upsertAttorney; on delete (existing only) calls deleteAttorney
// after a soft confirm. router.refresh after either keeps the parent list
// in sync.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "./Drawer";
import {
  upsertAttorney,
  deleteAttorney,
} from "@/app/(app)/settings/_actions";
import type { AttorneyRow } from "@/lib/settings/fetch";
import { StatesPickerCombobox } from "@/Components/StatesPickerCombobox";

type Form = {
  name: string;
  email: string;
  states: string[];
  cost: string;
  notes: string;
};

const EMPTY: Form = { name: "", email: "", states: [], cost: "", notes: "" };

function seedFrom(attorney: AttorneyRow | null): Form {
  if (!attorney) return EMPTY;
  return {
    name: attorney.name,
    email: attorney.email ?? "",
    states: [...attorney.states_covered],
    cost: attorney.default_cost != null ? String(attorney.default_cost) : "",
    notes: attorney.notes ?? "",
  };
}

export function AttorneyDrawer({
  attorney,
  open,
  onClose,
}: {
  attorney: AttorneyRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(seedFrom(attorney));
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // Re-seed each time the drawer opens for a new row.
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setForm(seedFrom(attorney));
      setErrMsg(null);
      setConfirmDelete(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, attorney]);

  const ready = form.name.trim().length > 0;

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSave() {
    setErrMsg(null);
    const cost = form.cost.trim();
    const costNum = cost ? Number(cost.replace(/[,\s$]/g, "")) : null;
    if (cost && (!Number.isFinite(costNum) || (costNum ?? -1) < 0)) {
      setErrMsg("Default cost must be a positive number");
      return;
    }
    startTransition(async () => {
      const res = await upsertAttorney({
        id: attorney?.id ?? null,
        name: form.name.trim(),
        email: form.email.trim() || null,
        states_covered: form.states,
        default_cost: costNum,
        notes: form.notes.trim() || null,
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
    if (!attorney) return;
    startTransition(async () => {
      const res = await deleteAttorney(attorney.id);
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
      eyebrow={attorney ? "Edit Attorney" : "New Attorney"}
      title={attorney ? attorney.name : "Add Attorney"}
      footer={
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!ready || pending}
              onClick={onSave}
            >
              {pending ? "Saving…" : attorney ? "Save Changes" : "Add Attorney"}
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
          {attorney && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)" }}
              disabled={pending}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            >
              {confirmDelete ? "Click again to confirm" : "Delete Attorney"}
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
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Jane Daniels, Esq."
          autoFocus
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Email</label>
        <input
          className="input"
          type="email"
          style={{ width: "100%" }}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="jane@danielslaw.com"
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Default Cost</label>
        <div className="drawer-hint">
          Per claim. Subtracted from the recovery fee when computing Estimated
          Net To You. Leave blank if it varies.
        </div>
        <div className="field" style={{ width: 180 }}>
          <span className="prefix">$</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            className="input tabular has-prefix text-right"
            value={form.cost}
            onChange={(e) => set("cost", e.target.value)}
            placeholder="1500"
          />
        </div>
      </div>
      <div className="drawer-field">
        <label className="drawer-label">States Covered</label>
        <div className="drawer-hint">
          Click each state this attorney handles, or toggle All States for
          national coverage.
        </div>
        <StatesPickerCombobox
          value={form.states}
          onChange={(next) => set("states", next)}
        />
      </div>
      <div className="drawer-field">
        <label className="drawer-label">Notes</label>
        <textarea
          className="input drawer-textarea"
          style={{ width: "100%" }}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Filing fee included. Prefers PDF retainers. Available after 2pm CT."
        />
      </div>
    </Drawer>
  );
}
