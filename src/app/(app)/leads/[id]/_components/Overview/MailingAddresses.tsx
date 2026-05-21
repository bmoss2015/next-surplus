"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash, IconCheck, IconPencil } from "@tabler/icons-react";
import {
  addMailingAddress,
  setMailingAddressMailed,
  deleteContact,
  upsertContact,
  upsertRelative,
} from "../../_actions";
import { upsertLeadParty } from "../../_lead-parties-actions";
import type {
  ContactRow,
  OwnerRowFull,
  RelativeRow,
} from "@/lib/leads/fetch-detail";
import type { LeadPartyRow } from "@/lib/leads/lead-parties-types";
import { LEAD_PARTY_ROLE_LABELS } from "@/lib/leads/lead-parties-types";
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

// Split a stored "line1, city, ST zip" string back into its components so the
// edit form can prefill correctly. Mirrors the parser in src/lib/mail/address.ts
// but is lenient — falls back to putting everything in line1 when the format
// is unexpected, so a user can still fix a malformed legacy entry.
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

// Fix AAA Patch: a mailing address can be addressed to any owner OR any
// relative. We keep contacts.owner_id (FK) pointing at an owner, and store the
// full recipient label (e.g. "Jane Doe (Relative)") in contacts.recipient_label.
type Recipient = { key: string; label: string; ownerId: string };

function buildRecipients(
  owners: OwnerRowFull[],
  relatives: RelativeRow[]
): Recipient[] {
  if (owners.length === 0) return [];
  const fallbackOwnerId =
    owners.find((o) => o.is_primary)?.id ?? owners[0].id;
  return [
    ...owners.map((o) => ({
      key: `o:${o.id}`,
      label: `${o.full_name} (Owner)`,
      ownerId: o.id,
    })),
    ...relatives.map((r) => ({
      key: `r:${r.id}`,
      label: `${(r.full_name ?? "").trim() || "Unknown"} (Relative)`,
      ownerId: fallbackOwnerId,
    })),
  ];
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
  const [adding, setAdding] = useState(false);
  const [addr, setAddr] = useState<AddrDraft>(EMPTY_ADDR);
  const recipients = buildRecipients(owners, relatives);
  const [newRecipientKey, setNewRecipientKey] = useState(
    recipients[0]?.key ?? ""
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAddr, setEditAddr] = useState<AddrDraft>(EMPTY_ADDR);
  const [, startTransition] = useTransition();

  function add() {
    const value = joinAddress(addr);
    const recipient = recipients.find((r) => r.key === newRecipientKey);
    if (!addr.line1.trim() || !recipient) return;
    startTransition(async () => {
      const result = await addMailingAddress(
        leadId,
        recipient.ownerId,
        value,
        recipient.label
      );
      if (result.ok) {
        setRows((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            owner_id: recipient.ownerId,
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
      const res = await upsertContact(leadId, row.owner_id, row.id, { value });
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

  function ownerName(ownerId: string) {
    return owners.find((o) => o.id === ownerId)?.full_name ?? "—";
  }

  function recipientLabel(row: ContactRow) {
    if (row.recipient_label && row.recipient_label.trim()) return row.recipient_label;
    return `${ownerName(row.owner_id)} (Owner)`;
  }

  function addressLines(value: string): { street: string; rest: string } {
    const parts = value.split(", ");
    if (parts.length <= 1) return { street: value, rest: "" };
    return { street: parts[0], rest: parts.slice(1).join(", ") };
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const labelClass = "mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500";

  // Discriminated union of every mailing-address source. Renders in
  // one unified grid below so the user sees a single Mailing Addresses
  // list regardless of where the data lives (contacts table for owner
  // addresses, relatives row, lead_parties row).
  type DisplayRow =
    | { kind: "contact"; row: ContactRow; label: string }
    | {
        kind: "relative";
        id: string;
        label: string;
        value: string;
        street: string;
        city: string;
        state: string;
        zip: string;
      }
    | {
        kind: "leadParty";
        id: string;
        label: string;
        value: string;
        street: string;
        city: string;
        state: string;
        zip: string;
      };

  function leadPartyLabel(p: LeadPartyRow): string {
    const role =
      p.role === "other"
        ? (p.custom_role_label ?? "").trim() || "Contact"
        : LEAD_PARTY_ROLE_LABELS[p.role];
    const name = (p.name ?? "").trim() || "Unknown";
    return `${role} — ${name}`;
  }

  function relativeLabel(r: RelativeRow): string {
    const role = (r.relationship ?? "").trim() || "Relative";
    const name = (r.full_name ?? "").trim() || "Unknown";
    return `${role} — ${name}`;
  }

  function contactLabel(row: ContactRow): string {
    if (row.recipient_label && row.recipient_label.trim()) {
      // Convert "Jane Doe (Owner)" → "Owner — Jane Doe" so all sources
      // read uniformly.
      const m = row.recipient_label.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (m) return `${m[2].trim()} — ${m[1].trim()}`;
      return row.recipient_label;
    }
    const owner = owners.find((o) => o.id === row.owner_id);
    const name = owner?.full_name ?? "Unknown";
    return `Owner — ${name}`;
  }

  const displayRows: DisplayRow[] = [
    ...rows.map((row): DisplayRow => ({
      kind: "contact" as const,
      row,
      label: contactLabel(row),
    })),
    ...relatives
      .map((r): DisplayRow | null => {
        const street = (r.street ?? "").trim();
        const city = (r.city ?? "").trim();
        const state = (r.state ?? "").trim();
        const zip = (r.zip ?? "").trim();
        if (!street && !city && !state && !zip) return null;
        const tail = [city, [state, zip].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ");
        const value = [street, tail].filter(Boolean).join(", ");
        return {
          kind: "relative" as const,
          id: r.id,
          label: relativeLabel(r),
          value,
          street,
          city,
          state,
          zip,
        };
      })
      .filter((x): x is DisplayRow => x !== null),
    ...leadParties
      .map((p): DisplayRow | null => {
        const street = (p.street ?? "").trim();
        const city = (p.city ?? "").trim();
        const state = (p.state ?? "").trim();
        const zip = (p.zip ?? "").trim();
        if (!street && !city && !state && !zip) return null;
        const tail = [city, [state, zip].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ");
        const value = [street, tail].filter(Boolean).join(", ");
        return {
          kind: "leadParty" as const,
          id: p.id,
          label: leadPartyLabel(p),
          value,
          street,
          city,
          state,
          zip,
        };
      })
      .filter((x): x is DisplayRow => x !== null),
  ];

  // Inline-edit state for relative + lead-party rows (contacts use the
  // existing editingId/editAddr). Keyed by "relative:<id>" / "lp:<id>".
  const [editingExtId, setEditingExtId] = useState<string | null>(null);
  const [extAddr, setExtAddr] = useState<AddrDraft>(EMPTY_ADDR);

  function startEditExt(row: DisplayRow) {
    if (row.kind === "contact") return;
    const key = row.kind === "relative" ? `relative:${row.id}` : `lp:${row.id}`;
    setEditingExtId(key);
    setExtAddr({
      line1: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
    });
  }
  function cancelExtEdit() {
    setEditingExtId(null);
    setExtAddr(EMPTY_ADDR);
  }
  function saveExtEdit(row: DisplayRow) {
    if (row.kind === "contact") return;
    const street = extAddr.line1.trim();
    const city = extAddr.city.trim();
    const state = extAddr.state.trim().toUpperCase().slice(0, 2);
    const zip = extAddr.zip.trim();
    if (!street) return;
    startTransition(async () => {
      if (row.kind === "relative") {
        const res = await upsertRelative(leadId, row.id, {
          street,
          city,
          state,
          zip,
        });
        if (res.ok) {
          cancelExtEdit();
          router.refresh();
        }
      } else {
        const lp = leadParties.find((p) => p.id === row.id);
        if (!lp) return;
        const res = await upsertLeadParty({
          id: row.id,
          lead_id: leadId,
          role: lp.role,
          custom_role_label: lp.custom_role_label,
          name: lp.name,
          organization: lp.organization,
          email: lp.email,
          phone: lp.phone,
          street,
          city,
          state,
          zip,
          notes: lp.notes,
        });
        if (res.ok) {
          cancelExtEdit();
          router.refresh();
        }
      }
    });
  }
  function clearExtAddress(row: DisplayRow) {
    if (row.kind === "contact") return;
    startTransition(async () => {
      if (row.kind === "relative") {
        const res = await upsertRelative(leadId, row.id, {
          street: null,
          city: null,
          state: null,
          zip: null,
        });
        if (res.ok) router.refresh();
      } else {
        const lp = leadParties.find((p) => p.id === row.id);
        if (!lp) return;
        const res = await upsertLeadParty({
          id: row.id,
          lead_id: leadId,
          role: lp.role,
          custom_role_label: lp.custom_role_label,
          name: lp.name,
          organization: lp.organization,
          email: lp.email,
          phone: lp.phone,
          street: null,
          city: null,
          state: null,
          zip: null,
          notes: lp.notes,
        });
        if (res.ok) router.refresh();
      }
    });
  }

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
        <h3 className="section-subheader">
          Mailing Addresses
        </h3>
        {owners.length > 0 && addButton}
      </div>

      {owners.length === 0 && displayRows.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-[12px] text-gray-500">
          Add an owner first to attach a mailing address.
        </div>
      ) : displayRows.length === 0 && !adding ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-[12px] text-gray-500">
          No Mailing Addresses Yet.
        </div>
      ) : (
        displayRows.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {displayRows.map((dr) => {
              const key =
                dr.kind === "contact"
                  ? `c:${dr.row.id}`
                  : dr.kind === "relative"
                    ? `r:${dr.id}`
                    : `lp:${dr.id}`;
              const isContact = dr.kind === "contact";
              const isContactEditing =
                isContact && editingId === dr.row.id;
              const extKey =
                dr.kind === "relative"
                  ? `relative:${dr.id}`
                  : dr.kind === "leadParty"
                    ? `lp:${dr.id}`
                    : "";
              const isExtEditing = !isContact && editingExtId === extKey;
              const value =
                dr.kind === "contact" ? dr.row.value : dr.value;
              const { street, rest } = addressLines(value);
              return (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3"
                >
                  <div className="text-[11px] text-gray-500">{dr.label}</div>
                  {isContactEditing ? (
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
                          onClick={() => saveEdit(dr.row)}
                          disabled={!editAddr.line1.trim()}
                          className="btn-primary cursor-pointer rounded-md px-2 py-[4px] text-[11px] font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : isExtEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        autoFocus
                        value={extAddr.line1}
                        onChange={(e) =>
                          setExtAddr((d) => ({ ...d, line1: e.target.value }))
                        }
                        placeholder="Street"
                        className={inputClass}
                      />
                      <input
                        value={extAddr.city}
                        onChange={(e) =>
                          setExtAddr((d) => ({ ...d, city: e.target.value }))
                        }
                        placeholder="City"
                        className={inputClass}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={extAddr.state}
                          maxLength={2}
                          onChange={(e) =>
                            setExtAddr((d) => ({
                              ...d,
                              state: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="ST"
                          className={inputClass}
                        />
                        <input
                          value={extAddr.zip}
                          onChange={(e) =>
                            setExtAddr((d) => ({ ...d, zip: e.target.value }))
                          }
                          placeholder="Zip"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={cancelExtEdit}
                          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11px] text-ink hover:border-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveExtEdit(dr)}
                          disabled={!extAddr.line1.trim()}
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
                  {!isContactEditing && !isExtEditing && isContact && (
                    <button
                      type="button"
                      onClick={() => toggleMailed(dr.row)}
                      className={cn(
                        "inline-flex w-fit cursor-pointer items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-medium transition-colors",
                        dr.row.mailed
                          ? "border-none bg-gradient-to-br from-[#0d4b3a] to-[#13644e] text-white"
                          : "border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b] hover:border-petrol-200"
                      )}
                      title={dr.row.mailed ? "Mark Not Mailed" : "Mark Mailed"}
                    >
                      {dr.row.mailed && <IconCheck size={11} stroke={2.5} />}
                      {dr.row.mailed && dr.row.mailed_at
                        ? `Mailed ${fmtMailedAt(dr.row.mailed_at)}`
                        : "Not Mailed"}
                    </button>
                  )}
                  {!isContactEditing && !isExtEditing && (
                    <div className="mt-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (dr.kind === "contact") startEdit(dr.row);
                          else startEditExt(dr);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-gray-400 hover:text-petrol-600"
                        aria-label="Edit Mailing Address"
                      >
                        <IconPencil size={12} stroke={1.75} />
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (dr.kind === "contact") remove(dr.row);
                            else clearExtAddress(dr);
                          }}
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
                <input value={addr.state} onChange={(e) => setAddr((d) => ({ ...d, state: e.target.value }))} className={cn(inputClass, "max-w-[120px]")} />
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
