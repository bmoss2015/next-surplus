"use client";

import { useRef, useState, useTransition } from "react";
import {
  IconPlus,
  IconTrash,
  IconPencil,
} from "@tabler/icons-react";
import {
  upsertContact,
  upsertOwner,
  deleteOwner,
  deleteContact,
} from "../_actions";
import type { ContactRow, OwnerRowFull } from "@/lib/leads/fetch-detail";
import { OWNER_STATUS_LABELS, type OwnerStatus } from "@/lib/leads/types";
import { useRole } from "@/components/RoleProvider";
import { Modal } from "@/components/Modal";
import { cn } from "@/lib/cn";
import { formatPhone } from "@/lib/format/phone";
import { formatPhoneInput } from "@/lib/phone";
import { SectionSubheader } from "./SectionSubheader";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PER_CHANNEL = 5;

// Phone-line classification — a type pill (Mobile / Landline / Other) plus DNC
// and Litigator flags, all stored on the contacts row.
type PhoneMetaPatch = {
  phone_type?: string | null;
  is_dnc?: boolean;
  is_litigator?: boolean;
};
// Fix TTTT4: imports now write the canonical "Landline" stored value
// directly (parsePhoneType collapses "Residential" / "Landline" inputs to
// "Landline"); legacy rows that were stored as "Residential" still need to
// render as Landline. Recognize both so neither falls through to "Type".
function phoneTypeShort(t: string | null): string {
  if (t === "Mobile") return "Mobile";
  if (t === "Landline") return "Landline";
  if (t === "Residential") return "Landline";
  if (t === "Other") return "Other";
  return "Type";
}

type ContactStatus = "untested" | "valid" | "invalid" | "dnc";

const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  untested: "Untested",
  valid: "Valid",
  invalid: "Invalid",
  dnc: "DNC",
};

const CONTACT_STATUS_ORDER: ContactStatus[] = [
  "untested",
  "valid",
  "invalid",
  "dnc",
];

// Fix BBBBB PART 3: a tiny inline age editor used on owner *and* relative cards
// — shows "Age N" (or "Add Age"); click to edit, commit on blur / Enter, revert
// on Escape; clearing the value stores null.
export function AgeEditField({
  value,
  onCommit,
}: {
  value: number | null;
  onCommit: (n: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value != null ? String(value) : "");
  const cancelNext = useRef(false);

  function startEdit() {
    setText(value != null ? String(value) : "");
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    if (cancelNext.current) {
      cancelNext.current = false;
      return;
    }
    const digits = text.replace(/[^\d]/g, "");
    const n = digits ? parseInt(digits, 10) : NaN;
    const next = Number.isFinite(n) && n > 0 && n < 130 ? n : null;
    if (next !== value) onCommit(next);
  }

  if (editing) {
    return (
      <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={text}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            cancelNext.current = true;
            e.currentTarget.blur();
          }
        }}
        className="ml-1.5 w-[44px] rounded border border-petrol-500 bg-white px-1 py-[1px] text-[10px] text-ink outline-none"
        aria-label="Age"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={startEdit}
      title="Click To Edit Age"
      className={cn(
        "ml-1.5 cursor-text rounded px-0.5 text-[10px] hover:bg-petrol-50",
        value != null ? "font-normal text-gray-400" : "italic text-gray-300"
      )}
    >
      {value != null ? `Age ${value}` : "Add Age"}
    </button>
  );
}

export function ContactsTabClient({
  leadId,
  initialOwners,
  initialContacts,
}: {
  leadId: string;
  initialOwners: OwnerRowFull[];
  initialContacts: ContactRow[];
}) {
  const [owners, setOwners] = useState<OwnerRowFull[]>(initialOwners);
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerStatus, setNewOwnerStatus] = useState<OwnerStatus>("unknown");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerNotes, setNewOwnerNotes] = useState("");
  const [, startTransition] = useTransition();

  function resetOwnerForm() {
    setNewOwnerName("");
    setNewOwnerStatus("unknown");
    setNewOwnerPhone("");
    setNewOwnerEmail("");
    setNewOwnerNotes("");
  }

  function addOwner() {
    const name = newOwnerName.trim();
    if (!name) return;
    const willBePrimary = owners.length === 0;
    const phone = newOwnerPhone.trim();
    const email = newOwnerEmail.trim().toLowerCase();
    const notes = newOwnerNotes.trim() || null;
    startTransition(async () => {
      const result = await upsertOwner(leadId, null, {
        full_name: name,
        status: newOwnerStatus,
        is_primary: willBePrimary,
        notes,
      });
      if (!result.ok) return;
      const ownerId = result.id;

      const newContacts: ContactRow[] = [];
      if (phone) {
        const r = await upsertContact(leadId, ownerId, null, {
          channel: "phone",
          value: phone,
          status: "untested",
          is_primary: true,
        });
        if (r.ok) {
          newContacts.push({
            id: r.id,
            owner_id: ownerId,
            lead_id: leadId,
            channel: "phone",
            value: phone,
            status: "untested",
            connection_status: null,
            source: null,
            last_attempted: null,
            is_primary: true,
            phone_type: null,
            is_dnc: false,
            is_litigator: false,
            mailed: false,
            mailed_at: null,
            notes: null,
          });
        }
      }
      if (email) {
        const r = await upsertContact(leadId, ownerId, null, {
          channel: "email",
          value: email,
          status: "untested",
          is_primary: true,
        });
        if (r.ok) {
          newContacts.push({
            id: r.id,
            owner_id: ownerId,
            lead_id: leadId,
            channel: "email",
            value: email,
            status: "untested",
            connection_status: null,
            source: null,
            last_attempted: null,
            is_primary: true,
            phone_type: null,
            is_dnc: false,
            is_litigator: false,
            mailed: false,
            mailed_at: null,
            notes: null,
          });
        }
      }

      setOwners((prev) => [
        ...prev,
        {
          id: ownerId,
          lead_id: leadId,
          full_name: name,
          status: newOwnerStatus,
          date_of_death: null,
          is_primary: willBePrimary,
          is_deceased: false,
          age: null,
          relationship: null,
          notes,
        },
      ]);
      if (newContacts.length > 0) {
        setContacts((prev) => [...prev, ...newContacts]);
      }
      resetOwnerForm();
      setShowOwnerForm(false);
    });
  }

  function removeOwner(ownerId: string) {
    if (!confirm("Remove this owner and all of their contacts?")) return;
    setOwners((prev) => prev.filter((o) => o.id !== ownerId));
    setContacts((prev) => prev.filter((c) => c.owner_id !== ownerId));
    startTransition(async () => {
      await deleteOwner(ownerId, leadId);
    });
  }

  function changeOwnerStatus(ownerId: string, status: OwnerStatus) {
    setOwners((prev) =>
      prev.map((o) => (o.id === ownerId ? { ...o, status } : o))
    );
    startTransition(async () => {
      await upsertOwner(leadId, ownerId, { status });
    });
  }

  // Fix BBBBB PART 3: Age is an inline-editable field on the owner card.
  function changeOwnerAge(ownerId: string, age: number | null) {
    setOwners((prev) => prev.map((o) => (o.id === ownerId ? { ...o, age } : o)));
    startTransition(async () => {
      await upsertOwner(leadId, ownerId, { age });
    });
  }

  function addContact(
    ownerId: string,
    channel: "phone" | "email",
    value: string
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await upsertContact(leadId, ownerId, null, {
        channel,
        value: trimmed,
        status: "untested",
      });
      if (result.ok) {
        setContacts((prev) => [
          ...prev,
          {
            id: result.id,
            owner_id: ownerId,
            lead_id: leadId,
            channel,
            value: trimmed,
            status: "untested",
            connection_status: null,
            source: null,
            last_attempted: null,
            is_primary: false,
            phone_type: null,
            is_dnc: false,
            is_litigator: false,
            mailed: false,
            mailed_at: null,
            notes: null,
          },
        ]);
      }
    });
  }

  function removeContact(contactId: string) {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    startTransition(async () => {
      await deleteContact(contactId, leadId);
    });
  }

  function setContactStatus(contactId: string, status: ContactStatus) {
    const target = contacts.find((c) => c.id === contactId);
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, status } : c))
    );
    startTransition(async () => {
      await upsertContact(leadId, target?.owner_id ?? "", contactId, { status });
    });
  }

  function setPhoneMeta(contactId: string, patch: PhoneMetaPatch) {
    const target = contacts.find((c) => c.id === contactId);
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, ...patch } : c))
    );
    startTransition(async () => {
      await upsertContact(leadId, target?.owner_id ?? "", contactId, patch);
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="section-subheader">
          Owners
        </h3>
        {!showOwnerForm && (
          <button
            type="button"
            onClick={() => setShowOwnerForm(true)}
            className="btn-primary inline-flex items-center gap-1 rounded-md px-3 py-[6px] text-xs font-medium"
          >
            <IconPlus size={13} stroke={2} />
            Add Owner
          </button>
        )}
      </div>

      <Modal
        open={showOwnerForm}
        onClose={() => {
          setShowOwnerForm(false);
          resetOwnerForm();
        }}
        title="Add Owner"
        description="Capture the owner's full details up front. Additional phones, emails, and mailing addresses can be added on the card afterwards."
        width={500}
      >
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Full Name
        </label>
        <input
          type="text"
          autoFocus
          value={newOwnerName}
          onChange={(e) => setNewOwnerName(e.target.value)}
          placeholder="Robert Smith"
          className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
        <label className="mt-3 mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Status
        </label>
        <select
          value={newOwnerStatus}
          onChange={(e) => setNewOwnerStatus(e.target.value as OwnerStatus)}
          className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none focus:border-petrol-500"
        >
          {(Object.keys(OWNER_STATUS_LABELS) as OwnerStatus[]).map((s) => (
            <option key={s} value={s}>
              {OWNER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Phone
            </label>
            <input
              type="tel"
              value={newOwnerPhone}
              onChange={(e) => setNewOwnerPhone(formatPhoneInput(e.target.value))}
              placeholder="(555) 555-1234"
              className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={newOwnerEmail}
              onChange={(e) => setNewOwnerEmail(e.target.value)}
              placeholder="robert@example.com"
              className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </div>
        </div>
        <label className="mt-3 mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Notes
        </label>
        <textarea
          value={newOwnerNotes}
          onChange={(e) => setNewOwnerNotes(e.target.value)}
          rows={3}
          placeholder="Optional context about this owner — preferences, history, anything useful for the team."
          className="w-full resize-y rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setShowOwnerForm(false);
              resetOwnerForm();
            }}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={addOwner}
            disabled={!newOwnerName.trim()}
            className="btn-primary cursor-pointer rounded-md px-4 py-[6px] text-xs font-medium disabled:opacity-50"
          >
            Add Owner
          </button>
        </div>
      </Modal>

      {owners.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No Owners Yet. Click Add Owner To Get Started.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {owners.map((owner) => (
            <OwnerCard
              key={owner.id}
              owner={owner}
              phones={contacts.filter(
                (c) => c.owner_id === owner.id && c.channel === "phone"
              )}
              emails={contacts.filter(
                (c) => c.owner_id === owner.id && c.channel === "email"
              )}
              onChangeStatus={(s) => changeOwnerStatus(owner.id, s)}
              onChangeAge={(n) => changeOwnerAge(owner.id, n)}
              onRemoveOwner={() => removeOwner(owner.id)}
              onAddContact={(channel, value) =>
                addContact(owner.id, channel, value)
              }
              onRemoveContact={removeContact}
              onSetContactStatus={setContactStatus}
              onSetPhoneMeta={setPhoneMeta}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerCard({
  owner,
  phones,
  emails,
  onChangeStatus,
  onChangeAge,
  onRemoveOwner,
  onAddContact,
  onRemoveContact,
  onSetContactStatus,
  onSetPhoneMeta,
}: {
  owner: OwnerRowFull;
  phones: ContactRow[];
  emails: ContactRow[];
  onChangeStatus: (s: OwnerStatus) => void;
  onChangeAge: (n: number | null) => void;
  onRemoveOwner: () => void;
  onAddContact: (channel: "phone" | "email", value: string) => void;
  onRemoveContact: (id: string) => void;
  onSetContactStatus: (id: string, s: ContactStatus) => void;
  onSetPhoneMeta: (id: string, patch: PhoneMetaPatch) => void;
}) {
  const { isAdmin } = useRole();
  const [addingPhone, setAddingPhone] = useState(false);
  const [addingEmail, setAddingEmail] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  function submitPhone() {
    const v = newPhone.trim();
    if (!v) return;
    onAddContact("phone", v);
    setNewPhone("");
    setAddingPhone(false);
  }

  function submitEmail() {
    const v = newEmail.trim();
    if (!v) return;
    if (!EMAIL_RE.test(v)) {
      setEmailError("Enter A Valid Email Address");
      return;
    }
    setEmailError(null);
    onAddContact("email", v);
    setNewEmail("");
    setAddingEmail(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3">
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1 leading-tight">
          <span className="text-[13px] font-medium text-ink">{owner.full_name}</span>
          <AgeEditField value={owner.age} onCommit={onChangeAge} />
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onRemoveOwner}
            className="cursor-pointer text-gray-400 hover:text-danger"
            aria-label="Remove Owner"
          >
            <IconTrash size={13} stroke={1.75} />
          </button>
        )}
      </div>

      <select
        value={owner.status}
        onChange={(e) => onChangeStatus(e.target.value as OwnerStatus)}
        className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] text-ink outline-none focus:border-petrol-500"
        aria-label="Owner Status"
      >
        {(Object.keys(OWNER_STATUS_LABELS) as OwnerStatus[]).map((s) => (
          <option key={s} value={s}>
            {OWNER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-1.5">
        <SectionSubheader className="mb-0">Phone</SectionSubheader>
        {phones.map((c) => (
          <ContactLine
            key={c.id}
            kind="phone"
            value={formatPhone(c.value)}
            status={c.status}
            phoneType={c.phone_type}
            isDnc={c.is_dnc}
            isLitigator={c.is_litigator}
            canRemove={isAdmin}
            onRemove={() => onRemoveContact(c.id)}
            onSetStatus={(s) => onSetContactStatus(c.id, s)}
            onSetPhoneMeta={(patch) => onSetPhoneMeta(c.id, patch)}
          />
        ))}
        {addingPhone ? (
          <div className="flex items-center gap-1">
            <input
              type="tel"
              autoFocus
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitPhone();
                }
                if (e.key === "Escape") {
                  setAddingPhone(false);
                  setNewPhone("");
                }
              }}
              placeholder="(555) 555-5555"
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
            <button
              type="button"
              onClick={submitPhone}
              disabled={!newPhone.trim()}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-1.5 py-[3px] text-gray-500 hover:border-petrol-500 hover:text-petrol-500 disabled:opacity-50"
              aria-label="Save Phone"
            >
              <IconPlus size={11} stroke={2} />
            </button>
          </div>
        ) : (
          phones.length < MAX_PER_CHANNEL && (
            <button
              type="button"
              onClick={() => setAddingPhone(true)}
              className="w-fit cursor-pointer text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
            >
              + Add Phone
            </button>
          )
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-gray-150 pt-2">
        <SectionSubheader className="mb-0">Email</SectionSubheader>
        {emails.map((c) => (
          <ContactLine
            key={c.id}
            kind="email"
            value={c.value}
            status={c.status}
            breakAll
            canRemove={isAdmin}
            onRemove={() => onRemoveContact(c.id)}
            onSetStatus={(s) => onSetContactStatus(c.id, s)}
          />
        ))}
        {addingEmail ? (
          <div>
            <div className="flex items-center gap-1">
              <input
                type="email"
                autoFocus
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onBlur={() => {
                  const v = newEmail.trim();
                  if (v && !EMAIL_RE.test(v)) {
                    setEmailError("Enter A Valid Email Address");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitEmail();
                  }
                  if (e.key === "Escape") {
                    setAddingEmail(false);
                    setNewEmail("");
                    setEmailError(null);
                  }
                }}
                placeholder="name@example.com"
                className={cn(
                  "min-w-0 flex-1 rounded-md border bg-surface px-2 py-[3px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500",
                  emailError ? "border-danger" : "border-gray-200"
                )}
              />
              <button
                type="button"
                onClick={submitEmail}
                disabled={!newEmail.trim()}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-1.5 py-[3px] text-gray-500 hover:border-petrol-500 hover:text-petrol-500 disabled:opacity-50"
                aria-label="Save Email"
              >
                <IconPlus size={11} stroke={2} />
              </button>
            </div>
            {emailError && (
              <div className="mt-1 text-[10px] text-danger">{emailError}</div>
            )}
          </div>
        ) : (
          emails.length < MAX_PER_CHANNEL && (
            <button
              type="button"
              onClick={() => setAddingEmail(true)}
              className="w-fit cursor-pointer text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
            >
              + Add Email
            </button>
          )
        )}
      </div>
    </div>
  );
}

function ContactLine({
  kind,
  value,
  status,
  phoneType,
  isDnc,
  isLitigator,
  onRemove,
  onSetStatus,
  onSetPhoneMeta,
  canRemove,
  breakAll,
}: {
  kind: "phone" | "email";
  value: string;
  status: ContactStatus;
  phoneType?: string | null;
  isDnc?: boolean;
  isLitigator?: boolean;
  onRemove: () => void;
  onSetStatus: (s: ContactStatus) => void;
  onSetPhoneMeta?: (patch: PhoneMetaPatch) => void;
  canRemove: boolean;
  breakAll?: boolean;
}) {
  const isPhone = kind === "phone";
  const [editingType, setEditingType] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const ptype = phoneType ?? null;

  const statusClass = (s: ContactStatus) =>
    s === "valid"
      ? "bg-petrol-500 text-white"
      : s === "invalid"
        ? "bg-danger text-white"
        : s === "dnc"
          ? "bg-[#0f1729] text-white"
          : "bg-gray-200 text-gray-700";

  return (
    <div className="rounded-md border border-gray-150 bg-gray-50 p-1.5">
      {/* Line 1: number + phone type pill (click to change), then remove. */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "min-w-0 text-[11.5px] font-medium text-ink",
            breakAll ? "break-all" : "whitespace-nowrap"
          )}
        >
          {value}
        </span>
        {isPhone && (
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Phone type"
              onClick={() => {
                setEditingType((v) => !v);
                setEditingStatus(false);
              }}
              className={cn(
                "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium leading-none transition-colors",
                ptype
                  ? "bg-petrol-100 text-petrol-700"
                  : "border border-dashed border-gray-300 text-gray-400"
              )}
            >
              {phoneTypeShort(ptype)}
            </button>
            {editingType && (
              <div className="absolute left-0 top-full z-20 mt-1 w-[100px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-elevated">
                {/* Fix TTTT4: "Landline" is the canonical stored value going
                    forward; "Residential" stays as a legacy alias so old rows
                    still resolve in phoneTypeShort. New manual picks write
                    "Landline". */}
                {(["Mobile", "Landline", "Residential", "Other"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onSetPhoneMeta?.({ phone_type: ptype === t ? null : t });
                      setEditingType(false);
                    }}
                    className={cn(
                      "block w-full cursor-pointer px-2 py-1 text-left text-[11px] hover:bg-gray-50",
                      ptype === t ? "font-medium text-petrol-700" : "text-ink"
                    )}
                  >
                    {phoneTypeShort(t)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <span className="flex-1" />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 cursor-pointer text-gray-300 hover:text-danger"
            aria-label="Remove"
          >
            <IconTrash size={11} stroke={1.75} />
          </button>
        )}
      </div>

      {/* Line 2: the single selected status pill + a pencil to change it. */}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {editingStatus ? (
          CONTACT_STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onSetStatus(s);
                setEditingStatus(false);
              }}
              className={cn(
                "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium transition-colors",
                status === s
                  ? statusClass(s)
                  : "bg-[#f1f5f9] text-[#64748b] hover:bg-gray-150"
              )}
            >
              {CONTACT_STATUS_LABELS[s]}
            </button>
          ))
        ) : (
          <>
            <span
              className={cn(
                "rounded-full px-1.5 py-[1px] text-[9px] font-medium leading-none",
                statusClass(status)
              )}
            >
              {CONTACT_STATUS_LABELS[status]}
            </span>
            <button
              type="button"
              aria-label="Change status"
              onClick={() => {
                setEditingStatus(true);
                setEditingType(false);
              }}
              className="cursor-pointer text-gray-300 hover:text-petrol-500"
            >
              <IconPencil size={10} stroke={1.75} />
            </button>
          </>
        )}
      </div>

      {/* Line 3 (phones): DNC + Litigator toggle pills — always visible,
          matching the Relatives layout. */}
      {isPhone && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onSetPhoneMeta?.({ is_dnc: !isDnc })}
            className={cn(
              "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium leading-none transition-colors",
              isDnc ? "bg-danger-bg text-danger" : "bg-[#f1f5f9] text-[#64748b] hover:bg-gray-150"
            )}
            aria-label="Do Not Call"
          >
            DNC
          </button>
          <button
            type="button"
            onClick={() => onSetPhoneMeta?.({ is_litigator: !isLitigator })}
            className={cn(
              "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium leading-none transition-colors",
              isLitigator
                ? "bg-[#ffedd5] text-[#9a3412]"
                : "bg-[#f1f5f9] text-[#64748b] hover:bg-gray-150"
            )}
            aria-label="Litigator"
          >
            Litigator
          </button>
        </div>
      )}
    </div>
  );
}
