"use client";

import { useState, useTransition } from "react";
import {
  IconPlus,
  IconTrash,
  IconUsersGroup,
  IconPhone,
} from "@tabler/icons-react";
import { upsertRelative, deleteRelative } from "../_actions";
import type { RelativeRow } from "@/lib/leads/fetch-detail";
import { useRole } from "@/components/RoleProvider";
import { formatPhone } from "./ContactsTabClient";

type Draft = {
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
};

const EMPTY_DRAFT: Draft = { full_name: "", relationship: "", phone: "", email: "" };

export function RelativesSection({
  leadId,
  initial,
}: {
  leadId: string;
  initial: RelativeRow[];
}) {
  const { isAdmin } = useRole();
  const [relatives, setRelatives] = useState<RelativeRow[]>(initial);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function add() {
    setError(null);
    const name = draft.full_name.trim();
    if (!name) {
      setError("Name Is Required");
      return;
    }
    startTransition(async () => {
      const res = await upsertRelative(leadId, null, {
        full_name: name,
        relationship: draft.relationship.trim() || null,
        phone: draft.phone.trim() || null,
        email: draft.email.trim() || null,
        notes: null,
      });
      if (res.ok) {
        setRelatives((prev) => [
          ...prev,
          {
            id: res.id,
            lead_id: leadId,
            full_name: name,
            relationship: draft.relationship.trim() || null,
            phone: draft.phone.trim() || null,
            email: draft.email.trim() || null,
            notes: null,
          },
        ]);
        setDraft(EMPTY_DRAFT);
        setAdding(false);
      } else {
        setError(res.error);
      }
    });
  }

  function remove(id: string) {
    setRelatives((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteRelative(id, leadId);
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none focus:border-petrol-500";
  const labelClass = "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  return (
    <div className="mt-4 rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h3 className="m-0 flex items-center gap-1.5 text-[14px] font-medium tracking-tight text-ink">
          <IconUsersGroup size={15} stroke={1.75} className="text-gray-400" />
          Relatives
        </h3>
        <div className="mt-[2px] text-[11px] text-gray-500">
          Heirs, spouses, and family who aren&rsquo;t on the deed but may be useful contacts.
        </div>
      </div>

      {relatives.length === 0 && !adding ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center">
          <div className="text-[12px] text-gray-500">No Relatives Recorded</div>
          <button
            type="button"
            onClick={() => { setAdding(true); setError(null); }}
            className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium"
          >
            <IconPlus size={13} stroke={2} />
            Add Relative
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {relatives.map((r) => (
              <div key={r.id} className="group relative rounded-md border border-gray-200 bg-surface p-3">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="absolute right-2 top-2 invisible cursor-pointer text-gray-400 hover:text-danger group-hover:visible"
                    aria-label="Remove Relative"
                  >
                    <IconTrash size={13} stroke={1.75} />
                  </button>
                )}
                <div className="pr-5 text-[13px] font-medium text-ink">{r.full_name}</div>
                <div className="mt-[2px] text-[11px] text-gray-500">
                  {r.relationship || "Relationship Not Set"}
                </div>
                <div className="mt-[6px] flex items-center gap-1 text-[12px] text-gray-600">
                  <IconPhone size={12} stroke={1.75} className="text-gray-400" />
                  {r.phone || <span className="text-gray-400">No Phone</span>}
                </div>
              </div>
            ))}
          </div>

          {!adding && (
            <button
              type="button"
              onClick={() => { setAdding(true); setError(null); }}
              className="btn-primary mt-3 inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium"
            >
              <IconPlus size={13} stroke={2} />
              Add Relative
            </button>
          )}
        </>
      )}

      {adding && (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                autoFocus
                value={draft.full_name}
                onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Relationship To Owner</label>
              <input
                placeholder="Spouse, Son, Heir…"
                value={draft.relationship}
                onChange={(e) => setDraft((d) => ({ ...d, relationship: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: formatPhone(e.target.value) }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          {error && <div className="mt-2 text-[12px] text-danger">{error}</div>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setAdding(false); setDraft(EMPTY_DRAFT); setError(null); }}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12px] text-ink hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={!draft.full_name.trim()}
              className="btn-primary cursor-pointer rounded-md px-3 py-[6px] text-[12px] font-medium disabled:opacity-50"
            >
              Add Relative
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
