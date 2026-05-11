"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconTrash, IconMail, IconMailOff } from "@tabler/icons-react";
import {
  addMailingAddress,
  setMailingAddressMailed,
  deleteContact,
} from "../../_actions";
import type { ContactRow, OwnerRowFull } from "@/lib/leads/fetch-detail";
import { useRole } from "@/components/RoleProvider";
import { cn } from "@/lib/cn";

function fmtMailedAt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type AddrDraft = { line1: string; city: string; state: string; zip: string };
const EMPTY_ADDR: AddrDraft = { line1: "", city: "", state: "", zip: "" };

function joinAddress(d: AddrDraft): string {
  const tail = [d.city.trim(), [d.state.trim(), d.zip.trim()].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return [d.line1.trim(), tail].filter(Boolean).join(", ");
}

export function MailingAddresses({
  leadId,
  initialAddresses,
  owners,
}: {
  leadId: string;
  initialAddresses: ContactRow[];
  owners: OwnerRowFull[];
}) {
  const { isAdmin } = useRole();
  const [rows, setRows] = useState<ContactRow[]>(
    initialAddresses.filter((c) => c.channel === "mailing_address")
  );
  const [adding, setAdding] = useState(false);
  const [addr, setAddr] = useState<AddrDraft>(EMPTY_ADDR);
  const [newOwnerId, setNewOwnerId] = useState(owners[0]?.id ?? "");
  const [, startTransition] = useTransition();

  function add() {
    const value = joinAddress(addr);
    if (!addr.line1.trim() || !newOwnerId) return;
    startTransition(async () => {
      const result = await addMailingAddress(leadId, newOwnerId, value);
      if (result.ok) {
        setRows((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            owner_id: newOwnerId,
            lead_id: leadId,
            channel: "mailing_address",
            value,
            status: "untested",
            connection_status: null,
            source: null,
            last_attempted: null,
            is_primary: prev.length === 0,
            phone_type: null,
            is_dnc: false,
            is_litigator: false,
            mailed: false,
            mailed_at: null,
            notes: null,
          },
        ]);
        setAddr(EMPTY_ADDR);
        setAdding(false);
      }
    });
  }

  function toggleMailed(row: ContactRow) {
    const next = !row.mailed;
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, mailed: next, mailed_at: next ? new Date().toISOString() : null }
          : r
      )
    );
    startTransition(async () => {
      await setMailingAddressMailed(row.id, next, leadId);
    });
  }

  function remove(row: ContactRow) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    startTransition(async () => {
      await deleteContact(row.id, leadId);
    });
  }

  function ownerName(ownerId: string) {
    return owners.find((o) => o.id === ownerId)?.full_name ?? "—";
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const labelClass = "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  const addButton = (
    <button
      type="button"
      onClick={() => setAdding(true)}
      disabled={owners.length === 0}
      className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium disabled:opacity-50"
    >
      <IconPlus size={13} stroke={2} />
      Add Mailing Address
    </button>
  );

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="m-0 text-[14px] font-medium tracking-tight text-ink">
          Mailing Addresses
        </h3>
        {!adding && owners.length > 0 && addButton}
      </div>

      {owners.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-[12px] text-gray-500">
          Add an owner first to attach a mailing address.
        </div>
      ) : rows.length === 0 && !adding ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-[12px] text-gray-500">
          No Mailing Addresses Yet.
        </div>
      ) : (
        rows.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3"
              >
                <div className="text-[12px] leading-snug text-ink">
                  {row.value}
                </div>
                <div className="text-[11px] text-gray-500">
                  {ownerName(row.owner_id)}
                </div>
                <button
                  type="button"
                  onClick={() => toggleMailed(row)}
                  className={cn(
                    "inline-flex w-fit cursor-pointer items-center gap-1 rounded-full px-2 py-[2px] text-[10px] font-medium transition-colors",
                    row.mailed
                      ? "bg-success-bg text-success-strong"
                      : "bg-gray-150 text-gray-500 hover:bg-petrol-50 hover:text-petrol-500"
                  )}
                  title={row.mailed ? "Mark Not Mailed" : "Mark Mailed"}
                >
                  {row.mailed ? (
                    <IconMail size={11} stroke={1.75} />
                  ) : (
                    <IconMailOff size={11} stroke={1.75} />
                  )}
                  {row.mailed && row.mailed_at
                    ? `Mailed ${fmtMailedAt(row.mailed_at)}`
                    : "Not Mailed"}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    className="mt-auto inline-flex w-fit cursor-pointer items-center gap-1 text-[11px] text-gray-400 hover:text-danger"
                    aria-label="Remove Mailing Address"
                  >
                    <IconTrash size={12} stroke={1.75} />
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {adding && (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2">
            <label className={labelClass}>Owner</label>
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12.5px] text-ink outline-none focus:border-petrol-500"
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.full_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Address Line 1</label>
              <input autoFocus value={addr.line1} onChange={(e) => setAddr((d) => ({ ...d, line1: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input value={addr.city} onChange={(e) => setAddr((d) => ({ ...d, city: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>State</label>
                <input value={addr.state} onChange={(e) => setAddr((d) => ({ ...d, state: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Zip</label>
                <input value={addr.zip} onChange={(e) => setAddr((d) => ({ ...d, zip: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setAdding(false); setAddr(EMPTY_ADDR); }}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[12px] text-ink hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={add}
              disabled={!addr.line1.trim() || !newOwnerId}
              className="btn-primary cursor-pointer rounded-md px-3 py-[6px] text-[12px] font-medium disabled:opacity-50"
            >
              Add Mailing Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
