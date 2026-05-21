"use client";

import { useEffect, useState, useTransition } from "react";
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
 * row. Simple model: rows are derived from the addresses prop (no optimistic
 * state). Save → await action → if ok router.refresh and the prop drives the
 * re-render; if not ok show the error inline with the draft preserved.
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
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AddrDraft>(EMPTY_ADDR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AddrDraft>(EMPTY_ADDR);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Clear stale error when the address list updates (e.g. after a successful
  // save that re-rendered the parent).
  useEffect(() => {
    setError(null);
  }, [addresses]);

  function add() {
    if (!isComplete(draft)) return;
    setError(null);
    const value = joinAddress(draft);
    startTransition(async () => {
      try {
        const result = await addMailingAddress(
          leadId,
          target,
          value,
          recipientLabel
        );
        if (!result.ok) {
          setError(result.error || "Could not save address.");
          return;
        }
        setDraft(EMPTY_ADDR);
        setAdding(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save address.");
      }
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
    startTransition(async () => {
      try {
        const res = await upsertContact(
          leadId,
          row.owner_id ?? "",
          row.id,
          { value }
        );
        if (!res.ok) {
          setError(res.error || "Could not save address.");
          return;
        }
        cancelEdit();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save address.");
      }
    });
  }

  function remove(row: ContactRow) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await deleteContact(row.id, leadId);
        if (!res.ok) {
          setError(res.error || "Could not remove address.");
          return;
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove address.");
      }
    });
  }

  const inputClass =
    "w-full min-w-0 rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-150 pt-2">
      <SectionSubheader className="mb-0">Mailing Addresses</SectionSubheader>

      {addresses.map((row) => {
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
                  disabled={isPending}
                  className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[2px] text-[10.5px] text-ink hover:border-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveEdit(row)}
                  disabled={!isComplete(editDraft) || isPending}
                  className="btn-primary cursor-pointer rounded-md px-2 py-[2px] text-[10.5px] font-medium disabled:opacity-50"
                >
                  {isPending ? "Saving…" : "Save"}
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
              disabled={isPending}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[2px] text-[10.5px] text-ink hover:border-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={!isComplete(draft) || isPending}
              className="btn-primary cursor-pointer rounded-md px-2 py-[2px] text-[10.5px] font-medium disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
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
