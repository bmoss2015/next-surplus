"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash, IconCheck, IconPencil } from "@tabler/icons-react";
import {
  addMailingAddress,
  setMailingAddressMailed,
  deleteContact,
  upsertContact,
  type MailingAddressTarget,
} from "../../_actions";
import type {
  ContactRow,
  OwnerRowFull,
  RelativeRow,
} from "@/lib/leads/fetch-detail";
import {
  LEAD_PARTY_ROLE_LABELS,
  type LeadPartyRow,
} from "@/lib/leads/lead-parties-types";
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

function leadPartyRoleLabel(row: LeadPartyRow): string {
  if (row.role === "other" && row.custom_role_label?.trim()) {
    return row.custom_role_label.trim();
  }
  return LEAD_PARTY_ROLE_LABELS[row.role];
}

type Recipient =
  | { key: string; label: string; target: MailingAddressTarget }
  | never;

function buildRecipients(
  owners: OwnerRowFull[],
  relatives: RelativeRow[],
  leadParties: LeadPartyRow[]
): Recipient[] {
  const out: Recipient[] = [];
  for (const o of owners) {
    out.push({
      key: `o:${o.id}`,
      label: `${o.full_name} (Owner)`,
      target: { kind: "owner", ownerId: o.id },
    });
  }
  for (const r of relatives) {
    const rel = (r.relationship ?? "").trim() || "Relative";
    out.push({
      key: `r:${r.id}`,
      label: `${(r.full_name ?? "").trim() || "Unknown"} (${rel})`,
      target: { kind: "relative", relativeId: r.id },
    });
  }
  for (const lp of leadParties) {
    out.push({
      key: `lp:${lp.id}`,
      label: `${(lp.name ?? "").trim() || "Recipient"} (${leadPartyRoleLabel(lp)})`,
      target: { kind: "leadParty", leadPartyId: lp.id },
    });
  }
  return out;
}

export function MailingAddresses({
  leadId,
  initialAddresses,
  owners,
  relatives = [],
  leadParties = [],
}: {
  leadId: string;
  initialAddresses: ContactRow[];
  owners: OwnerRowFull[];
  relatives?: RelativeRow[];
  leadParties?: LeadPartyRow[];
}) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [rows, setRows] = useState<ContactRow[]>(
    initialAddresses.filter((c) => c.channel === "mailing_address")
  );
  // Re-sync local rows when the server component re-fetches (e.g. after
  // adding an address elsewhere on the page).
  useEffect(() => {
    setRows(initialAddresses.filter((c) => c.channel === "mailing_address"));
  }, [initialAddresses]);

  const [adding, setAdding] = useState(false);
  const [addr, setAddr] = useState<AddrDraft>(EMPTY_ADDR);
  const recipients = buildRecipients(owners, relatives, leadParties);
  const [newRecipientKey, setNewRecipientKey] = useState(
    recipients[0]?.key ?? ""
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddr, setEditAddr] = useState<AddrDraft>(EMPTY_ADDR);
  const [, startTransition] = useTransition();

  // Lookups for deriving the label of each address row from its FK. We
  // prefer the live name from the source record over the stored
  // recipient_label so a rename on the owner/relative/lead-party flows
  // through automatically.
  const ownerById = new Map(owners.map((o) => [o.id, o]));
  const relativeById = new Map(relatives.map((r) => [r.id, r]));
  const leadPartyById = new Map(leadParties.map((lp) => [lp.id, lp]));

  function recipientLabel(row: ContactRow): string {
    if (row.relative_id) {
      const r = relativeById.get(row.relative_id);
      if (r) {
        const rel = (r.relationship ?? "").trim() || "Relative";
        return `${(r.full_name ?? "").trim() || "Unknown"} (${rel})`;
      }
    }
    if (row.lead_party_id) {
      const lp = leadPartyById.get(row.lead_party_id);
      if (lp) {
        return `${(lp.name ?? "").trim() || "Recipient"} (${leadPartyRoleLabel(lp)})`;
      }
    }
    if (row.owner_id) {
      const o = ownerById.get(row.owner_id);
      if (o) return `${o.full_name} (Owner)`;
    }
    // Legacy fallback: recipient_label was the only source of truth before
    // migration 0119.
    if (row.recipient_label?.trim()) return row.recipient_label.trim();
    return "Recipient";
  }

  function add() {
    const value = joinAddress(addr);
    const recipient = recipients.find((r) => r.key === newRecipientKey);
    if (!addr.line1.trim() || !recipient) return;
    startTransition(async () => {
      const result = await addMailingAddress(
        leadId,
        recipient.target,
        value,
        recipient.label
      );
      if (result.ok) {
        setRows((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            owner_id:
              recipient.target.kind === "owner" ? recipient.target.ownerId : null,
            relative_id:
              recipient.target.kind === "relative"
                ? recipient.target.relativeId
                : null,
            lead_party_id:
              recipient.target.kind === "leadParty"
                ? recipient.target.leadPartyId
                : null,
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
            recipient_label: recipient.label,
            validation_checked_at: null,
            validation_provider: null,
          },
        ]);
        setAddr(EMPTY_ADDR);
        setAdding(false);
        // Re-fetch the server component so the Send Mail button picks up
        // the new candidate.
        router.refresh();
      }
    });
  }

  function startEdit(row: ContactRow) {
    setEditingId(row.id);
    setEditAddr(splitAddress(row.value));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditAddr(EMPTY_ADDR);
  }

  function saveEdit(row: ContactRow) {
    const value = joinAddress(editAddr);
    if (!editAddr.line1.trim()) return;
    startTransition(async () => {
      // upsertContact only mutates by id for edits, so the ownerId argument
      // is ignored. Pass any non-null string to satisfy the signature.
      const res = await upsertContact(
        leadId,
        row.owner_id ?? "",
        row.id,
        { value }
      );
      if (res.ok) {
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, value } : r))
        );
        cancelEdit();
        router.refresh();
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
      await setMailingAddressMailed(row.id, next, leadId, row.value);
    });
  }

  function remove(row: ContactRow) {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    startTransition(async () => {
      await deleteContact(row.id, leadId);
      router.refresh();
    });
  }

  function addressLines(value: string): { street: string; rest: string } {
    const parts = value.split(", ");
    if (parts.length <= 1) return { street: value, rest: "" };
    return { street: parts[0], rest: parts.slice(1).join(", ") };
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const labelClass = "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  const noRecipients = recipients.length === 0;

  const addButton = (
    <button
      type="button"
      onClick={() => setAdding(true)}
      disabled={noRecipients}
      className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium disabled:opacity-50"
    >
      <IconPlus size={13} stroke={2} />
      Add Mailing Address
    </button>
  );

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="section-subheader">
          Mailing Addresses
        </h3>
        {!noRecipients && addButton}
      </div>

      {noRecipients ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-[12px] text-gray-500">
          Add an owner, relative, or other contact first to attach a mailing address.
        </div>
      ) : rows.length === 0 && !adding ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-[12px] text-gray-500">
          No Mailing Addresses Yet.
        </div>
      ) : (
        rows.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {rows.map((row) => {
              const { street, rest } = addressLines(row.value);
              const isEditing = editingId === row.id;
              return (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3"
                >
                  <div className="text-[11px] text-gray-500">
                    {recipientLabel(row)}
                  </div>
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        autoFocus
                        value={editAddr.line1}
                        onChange={(e) =>
                          setEditAddr((d) => ({ ...d, line1: e.target.value }))
                        }
                        placeholder="Street"
                        className={inputClass}
                      />
                      <input
                        value={editAddr.city}
                        onChange={(e) =>
                          setEditAddr((d) => ({ ...d, city: e.target.value }))
                        }
                        placeholder="City"
                        className={inputClass}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={editAddr.state}
                          maxLength={2}
                          onChange={(e) =>
                            setEditAddr((d) => ({
                              ...d,
                              state: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="ST"
                          className={inputClass}
                        />
                        <input
                          value={editAddr.zip}
                          onChange={(e) =>
                            setEditAddr((d) => ({ ...d, zip: e.target.value }))
                          }
                          placeholder="Zip"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11px] text-ink hover:border-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(row)}
                          disabled={!editAddr.line1.trim()}
                          className="btn-primary cursor-pointer rounded-md px-2 py-[4px] text-[11px] font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[12px] leading-snug text-ink">
                      <div>{street}</div>
                      {rest && <div className="text-gray-500">{rest}</div>}
                    </div>
                  )}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => toggleMailed(row)}
                      className={cn(
                        "inline-flex w-fit cursor-pointer items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-medium transition-colors",
                        row.mailed
                          ? "border-none bg-gradient-to-br from-[#0d4b3a] to-[#13644e] text-white"
                          : "border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:border-petrol-200"
                      )}
                      title={row.mailed ? "Mark Not Mailed" : "Mark Mailed"}
                    >
                      {row.mailed && <IconCheck size={11} stroke={2.5} />}
                      {row.mailed && row.mail_count > 1 && row.mailed_at
                        ? `Mailed ${row.mail_count}x · last ${fmtMailedAt(row.mailed_at)}`
                        : row.mailed && row.mailed_at
                          ? `Mailed ${fmtMailedAt(row.mailed_at)}`
                          : "Not Mailed"}
                    </button>
                  )}
                  {!isEditing && (
                    <div className="mt-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-gray-400 hover:text-petrol-600"
                        aria-label="Edit Mailing Address"
                      >
                        <IconPencil size={12} stroke={1.75} />
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => remove(row)}
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-gray-400 hover:text-danger"
                          aria-label="Remove Mailing Address"
                        >
                          <IconTrash size={12} stroke={1.75} />
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {adding && (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2">
            <label className={labelClass}>Recipient</label>
            <select
              value={newRecipientKey}
              onChange={(e) => setNewRecipientKey(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12.5px] text-ink outline-none focus:border-petrol-500"
            >
              {recipients.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
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
                <input value={addr.state} onChange={(e) => setAddr((d) => ({ ...d, state: e.target.value.toUpperCase().slice(0, 2) }))} className={cn(inputClass, "max-w-[120px]")} />
              </div>
              <div>
                <label className={labelClass}>Zip</label>
                <input value={addr.zip} onChange={(e) => setAddr((d) => ({ ...d, zip: e.target.value }))} className={cn(inputClass, "max-w-[120px]")} />
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
              disabled={!addr.line1.trim() || !newRecipientKey}
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
