"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { upsertRelative, deleteRelative } from "../_actions";
import type { RelativeRow } from "@/lib/leads/fetch-detail";
import { useRole } from "@/components/RoleProvider";
import { formatPhone } from "./ContactsTabClient";

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Brother",
  "Sister",
  "Parent",
  "Child",
  "Cousin",
  "Friend",
  "Neighbor",
  "Other",
] as const;

const PHONE_SEP = " | ";

function splitPhones(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[|\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

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
  const [draftName, setDraftName] = useState("");
  const [draftRelationship, setDraftRelationship] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function add() {
    setError(null);
    const name = draftName.trim();
    if (!name) {
      setError("Name Is Required");
      return;
    }
    const phone = draftPhone.trim() || null;
    const relationship = draftRelationship.trim() || null;
    startTransition(async () => {
      const res = await upsertRelative(leadId, null, {
        full_name: name,
        relationship,
        phone,
        email: null,
        notes: null,
      });
      if (res.ok) {
        setRelatives((prev) => [
          ...prev,
          {
            id: res.id,
            lead_id: leadId,
            full_name: name,
            relationship,
            phone,
            email: null,
            notes: null,
          },
        ]);
        setDraftName("");
        setDraftRelationship("");
        setDraftPhone("");
        setAdding(false);
      } else {
        setError(res.error);
      }
    });
  }

  function patch(
    id: string,
    fields: { relationship?: string | null; phone?: string | null }
  ) {
    setRelatives((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...fields } : r))
    );
    startTransition(async () => {
      await upsertRelative(leadId, id, fields);
    });
  }

  function remove(id: string) {
    if (!confirm("Remove this relative?")) return;
    setRelatives((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteRelative(id, leadId);
    });
  }

  return (
    <div className="mt-4 rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="m-0 flex items-center gap-1.5 text-[14px] font-medium tracking-tight text-ink">
          <IconUsersGroup size={15} stroke={1.75} className="text-gray-400" />
          Relatives
        </h3>
      </div>

      {relatives.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No Relatives Recorded
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {relatives.map((r) => (
            <RelativeCard
              key={r.id}
              relative={r}
              canRemove={isAdmin}
              onPatch={(fields) => patch(r.id, fields)}
              onRemove={() => remove(r.id)}
            />
          ))}
        </div>
      )}

      {adding ? (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Name"
              className="rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
            <select
              value={draftRelationship}
              onChange={(e) => setDraftRelationship(e.target.value)}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12.5px] text-ink outline-none focus:border-petrol-500"
            >
              <option value="">Select Relationship</option>
              {RELATIONSHIP_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <input
              value={draftPhone}
              onChange={(e) => setDraftPhone(formatPhone(e.target.value))}
              placeholder="(555) 555-5555"
              className="rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </div>
          {error && <div className="mt-2 text-[12px] text-danger">{error}</div>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraftName("");
                setDraftRelationship("");
                setDraftPhone("");
                setError(null);
              }}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12px] text-ink hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={!draftName.trim()}
              className="btn-primary cursor-pointer rounded-md px-3 py-[6px] text-[12px] font-medium disabled:opacity-50"
            >
              Add Relative
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setError(null);
          }}
          className="btn-primary mt-3 inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium"
        >
          <IconPlus size={13} stroke={2} />
          Add Relative
        </button>
      )}
    </div>
  );
}

function RelativeCard({
  relative,
  canRemove,
  onPatch,
  onRemove,
}: {
  relative: RelativeRow;
  canRemove: boolean;
  onPatch: (fields: { relationship?: string | null; phone?: string | null }) => void;
  onRemove: () => void;
}) {
  const [phones, setPhones] = useState<string[]>(() => {
    const list = splitPhones(relative.phone);
    return list.length > 0 ? list : [""];
  });

  function commitPhones(next: string[]) {
    setPhones(next);
    const joined = next.map((p) => p.trim()).filter(Boolean).join(PHONE_SEP);
    onPatch({ phone: joined || null });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3">
      <div className="text-[13px] font-medium leading-tight text-ink">
        {relative.full_name}
      </div>

      <select
        value={relative.relationship ?? ""}
        onChange={(e) => onPatch({ relationship: e.target.value || null })}
        className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] text-ink outline-none focus:border-petrol-500"
        aria-label="Relationship"
      >
        <option value="">Select Relationship</option>
        {RELATIONSHIP_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-medium uppercase tracking-[0.4px] text-gray-400">
          Phone
        </div>
        {phones.map((p, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <input
              value={p}
              onChange={(e) => {
                const next = [...phones];
                next[idx] = formatPhone(e.target.value);
                setPhones(next);
              }}
              onBlur={() => commitPhones(phones)}
              placeholder="(555) 555-5555"
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
            {phones.length > 1 && (
              <button
                type="button"
                onClick={() => commitPhones(phones.filter((_, i) => i !== idx))}
                className="cursor-pointer text-gray-300 hover:text-danger"
                aria-label="Remove Phone"
              >
                <IconTrash size={11} stroke={1.75} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPhones([...phones, ""])}
          className="inline-flex w-fit cursor-pointer items-center gap-0.5 text-[11px] text-petrol-500 hover:text-petrol-700"
        >
          <IconPlus size={11} stroke={2} />
          Add Phone {phones.length + 1}
        </button>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 inline-flex w-fit cursor-pointer items-center gap-1 text-[11px] text-gray-400 hover:text-danger"
          aria-label="Remove Relative"
        >
          <IconTrash size={12} stroke={1.75} />
          Remove
        </button>
      )}
    </div>
  );
}
