"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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

function isComplete(d: AddrDraft): boolean {
  return Boolean(
    d.line1.trim() && d.city.trim() && d.state.trim() && d.zip.trim()
  );
}

/**
 * Inline "Mailing Addresses" section for OwnerCard / RelativeCard / LeadParty
 * row. Lists existing addresses, +Add stays visible after save, pencil/trash
 * per row. Errors from the server actions are surfaced inline (never
 * swallowed) so the user always knows when a save didn't take.
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
  recipientLabel: string;
  addresses: ContactRow[];
  canRemove: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ContactRow[]>(addresses);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AddrDraft>(EMPTY_ADDR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AddrDraft>(EMPTY_ADDR);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Count of in-flight server writes. While > 0, we ignore prop updates so
  // optimistic rows aren't clobbered mid-save. Once it drops back to 0 the
  // next effect run adopts whatever the server-component re-fetch produced.
  const pendingRef = useRef(0);
  const [propsEpoch, setPropsEpoch] = useState(0);

  useEffect(() => {
    // Adopt the prop unless we're mid-write. Effect fires on every addresses
    // identity change; bumping propsEpoch from finish handlers also re-runs
    // it so post-save adoption happens reliably.
    if (pendingRef.current === 0) {
      setRows(addresses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, propsEpoch]);

  function add() {
    if (!isComplete(draft)) return;
    setError(null);
    const value = joinAddress(draft);
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
    pendingRef.current += 1;
    startTransition(async () => {
      const result = await addMailingAddress(
        leadId,
        target,
        value,
        recipientLabel
      );
      pendingRef.current -= 1;
      if (!result.ok) {
        // Roll back optimistic row, keep the form open with the draft so the
        // user can fix and retry.
        setRows((prev) => prev.filter((r) => r.id !== tempId));
        setError(result.error || "Could not save address.");
        return;
      }
      setDraft(EMPTY_ADDR);
      setAdding(false);
      router.refresh();
      // Bump the epoch so the effect re-runs after pendingRef has dropped
      // to 0 and adopts the freshly-fetched address list.
      setPropsEpoch((n) => n + 1);
    });
  }

  function startEdit(row: ContactRow) {
    setError(null);
    setEditingId(row.id);
    setEditDraft(splitAddress(row.value));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(EMPTY_ADDR);
  }

  function saveEdit(row: ContactRow) {
    if (!isComplete(editDraft)) return;
    setError(null);
    const value = joinAddress(editDraft);
    const previousValue = row.value;
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, value } : r))
    );
    cancelEdit();
    pendingRef.current += 1;
    startTransition(async () => {
      const res = await upsertContact(
        leadId,
        row.owner_id ?? "",
        row.id,
        { value }
      );
      pendingRef.current -= 1;
      if (!res.ok) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, value: previousValue } : r
          )
        );
        setError(res.error || "Could not save address.");
        return;
      }
      router.refresh();
      setPropsEpoch((n) => n + 1);
    });
  }

  function remove(row: ContactRow) {
    setError(null);
    const snapshot = rows;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    pendingRef.current += 1;
    startTransition(async () => {
      const res = await deleteContact(row.id, leadId);
      pendingRef.current -= 1;
      if (!res.ok) {
        setRows(snapshot);
        setError(res.error || "Could not remove address.");
        return;
      }
      router.refresh();
      setPropsEpoch((n) => n + 1);
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
                setError(null);
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
          onClick={() => {
            setError(null);
            setAdding(true);
          }}
          className="w-fit cursor-pointer text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
        >
          + Add Mailing Address
        </button>
      )}

      {error && (
        <div className="rounded border border-danger/40 bg-danger/5 px-2 py-[5px] text-[11px] leading-snug text-danger">
          {error}
        </div>
      )}
    </div>
  );
}
