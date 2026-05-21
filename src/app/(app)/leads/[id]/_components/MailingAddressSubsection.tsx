"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import {
  addMailingAddress,
  deleteContact,
  upsertContact,
  type MailingAddressTarget,
} from "../_actions";
import type { ContactRow } from "@/lib/leads/fetch-detail";
import { SectionSubheader } from "./SectionSubheader";
import { cn } from "@/lib/cn";

type AddrDraft = { line1: string; city: string; state: string; zip: string };
const EMPTY_ADDR: AddrDraft = { line1: "", city: "", state: "", zip: "" };

function joinAddress(d: AddrDraft): string {
  const tail = [d.city.trim(), [d.state.trim(), d.zip.trim()].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [d.line1.trim(), tail].filter(Boolean).join(", ");
}

function splitAddress(value: string): AddrDraft {
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 3) return { line1: value, city: "", state: "", zip: "" };
  const tail = parts[parts.length - 1];
  const tailMatch = tail.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (!tailMatch) return { line1: value, city: "", state: "", zip: "" };
  return {
    line1: parts.slice(0, parts.length - 2).join(", "),
    city: parts[parts.length - 2],
    state: tailMatch[1].toUpperCase(),
    zip: tailMatch[2],
  };
}

function addressLines(value: string): { street: string; rest: string } {
  const parts = value.split(", ");
  if (parts.length <= 1) return { street: value, rest: "" };
  return { street: parts[0], rest: parts.slice(1).join(", ") };
}

/**
 * Inline "Mailing Addresses" section for OwnerCard / RelativeCard / LeadParty
 * row. Lists existing addresses for the target (owner/relative/lead_party),
 * with pencil + trash on each row and a + Add button at the bottom. Multi-
 * address: the +Add stays visible after each save.
 */
export function MailingAddressSubsection({
  leadId,
  target,
  recipientLabel,
  addresses,
  canRemove,
}: {
  leadId: string;
  target: MailingAddressTarget;
  // Used as contacts.recipient_label on insert so legacy readers without
  // the join still get a sensible label.
  recipientLabel: string;
  // Pre-filtered to addresses owned by this target.
  addresses: ContactRow[];
  canRemove: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ContactRow[]>(addresses);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AddrDraft>(EMPTY_ADDR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AddrDraft>(EMPTY_ADDR);
  const [, startTransition] = useTransition();

  // If the parent re-renders with a different address list (e.g. after a
  // server refresh), keep local state in sync — but only when not actively
  // editing, so the user's in-flight typing isn't clobbered.
  const incomingIds = addresses.map((a) => a.id).join("|");
  const currentIds = rows.map((r) => r.id).join("|");
  if (
    !adding &&
    editingId === null &&
    incomingIds !== currentIds &&
    addresses.length !== rows.length
  ) {
    setRows(addresses);
  }

  function add() {
    const value = joinAddress(draft);
    if (!isComplete(draft)) return;
    const tempId = `pending-${crypto.randomUUID()}`;
    const optimistic: ContactRow = {
      id: tempId,
      owner_id: target.kind === "owner" ? target.ownerId : null,
      relative_id: target.kind === "relative" ? target.relativeId : null,
      lead_party_id:
        target.kind === "leadParty" ? target.leadPartyId : null,
      lead_id: leadId,
      channel: "mailing_address",
      value,
      status: "untested",
      connection_status: null,
      source: null,
      last_attempted: null,
      is_primary: rows.length === 0,
      phone_type: null,
      is_dnc: false,
      is_litigator: false,
      mailed: false,
      mailed_at: null,
      recipient_label: recipientLabel,
      validation_checked_at: null,
      validation_provider: null,
    };
    setRows((prev) => [...prev, optimistic]);
    setDraft(EMPTY_ADDR);
    setAdding(false);
    startTransition(async () => {
      const result = await addMailingAddress(leadId, target, value, recipientLabel);
      if (!result.ok) {
        // Roll back the optimistic insert on failure.
        setRows((prev) => prev.filter((r) => r.id !== tempId));
      }
      router.refresh();
    });
  }

  function startEdit(row: ContactRow) {
    setEditingId(row.id);
    setEditDraft(splitAddress(row.value));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(EMPTY_ADDR);
  }

  function saveEdit(row: ContactRow) {
    const value = joinAddress(editDraft);
    if (!isComplete(editDraft)) return;
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, value } : r))
    );
    cancelEdit();
    startTransition(async () => {
      await upsertContact(leadId, row.owner_id ?? "", row.id, { value });
      router.refresh();
    });
  }

  function remove(row: ContactRow) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    startTransition(async () => {
      await deleteContact(row.id, leadId);
      router.refresh();
    });
  }

  const inputClass =
    "w-full min-w-0 rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-150 pt-2">
      <SectionSubheader className="mb-0">Mailing Addresses</SectionSubheader>

      {rows.map((row) => {
        const isEditing = editingId === row.id;
        if (isEditing) {
          return (
            <div key={row.id} className="flex flex-col gap-1">
              <input
                autoFocus
                value={editDraft.line1}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, line1: e.target.value }))
                }
                placeholder="Street"
                className={inputClass}
              />
              <input
                value={editDraft.city}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, city: e.target.value }))
                }
                placeholder="City"
                className={inputClass}
              />
              <div className="grid grid-cols-[56px_1fr] gap-1">
                <input
                  value={editDraft.state}
                  maxLength={2}
                  onChange={(e) =>
                    setEditDraft((d) => ({
                      ...d,
                      state: e.target.value.toUpperCase().slice(0, 2),
                    }))
                  }
                  placeholder="ST"
                  className={cn(inputClass, "uppercase")}
                />
                <input
                  value={editDraft.zip}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, zip: e.target.value }))
                  }
                  placeholder="ZIP"
                  className={inputClass}
                />
              </div>
              <div className="mt-0.5 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[2px] text-[10.5px] text-ink hover:border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveEdit(row)}
                  disabled={!isComplete(editDraft)}
                  className="btn-primary cursor-pointer rounded-md px-2 py-[2px] text-[10.5px] font-medium disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          );
        }
        const { street, rest } = addressLines(row.value);
        return (
          <div
            key={row.id}
            className="flex items-start gap-1.5 rounded border border-gray-150 bg-gray-50 px-2 py-[5px]"
          >
            <div className="min-w-0 flex-1 text-[11.5px] leading-snug text-ink">
              <div className="truncate">{street}</div>
              {rest && <div className="truncate text-gray-500">{rest}</div>}
            </div>
            <button
              type="button"
              onClick={() => startEdit(row)}
              className="cursor-pointer text-gray-400 hover:text-petrol-600"
              aria-label="Edit Mailing Address"
            >
              <IconPencil size={12} stroke={1.75} />
            </button>
            {canRemove && (
              <button
                type="button"
                onClick={() => remove(row)}
                className="cursor-pointer text-gray-400 hover:text-danger"
                aria-label="Remove Mailing Address"
              >
                <IconTrash size={12} stroke={1.75} />
              </button>
            )}
          </div>
        );
      })}

      {adding ? (
        <div className="flex flex-col gap-1">
          <input
            autoFocus
            value={draft.line1}
            onChange={(e) => setDraft((d) => ({ ...d, line1: e.target.value }))}
            placeholder="Street"
            className={inputClass}
          />
          <input
            value={draft.city}
            onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            placeholder="City"
            className={inputClass}
          />
          <div className="grid grid-cols-[56px_1fr] gap-1">
            <input
              value={draft.state}
              maxLength={2}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  state: e.target.value.toUpperCase().slice(0, 2),
                }))
              }
              placeholder="ST"
              className={cn(inputClass, "uppercase")}
            />
            <input
              value={draft.zip}
              onChange={(e) => setDraft((d) => ({ ...d, zip: e.target.value }))}
              placeholder="ZIP"
              className={inputClass}
            />
          </div>
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft(EMPTY_ADDR);
              }}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[2px] text-[10.5px] text-ink hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={!isComplete(draft)}
              className="btn-primary cursor-pointer rounded-md px-2 py-[2px] text-[10.5px] font-medium disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-fit cursor-pointer text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
        >
          + Add Mailing Address
        </button>
      )}
    </div>
  );
}

function isComplete(d: AddrDraft): boolean {
  return Boolean(
    d.line1.trim() && d.city.trim() && d.state.trim() && d.zip.trim()
  );
}
