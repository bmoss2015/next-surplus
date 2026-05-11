"use client";

import { useState, useTransition } from "react";
import {
  IconPlus,
  IconTrash,
  IconStar,
  IconStarFilled,
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
import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PER_CHANNEL = 3;

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

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
  const [, startTransition] = useTransition();

  function addOwner() {
    const name = newOwnerName.trim();
    if (!name) return;
    const willBePrimary = owners.length === 0;
    startTransition(async () => {
      const result = await upsertOwner(leadId, null, {
        full_name: name,
        status: newOwnerStatus,
        is_primary: willBePrimary,
      });
      if (result.ok) {
        setOwners((prev) => [
          ...prev,
          {
            id: result.id,
            lead_id: leadId,
            full_name: name,
            status: newOwnerStatus,
            date_of_death: null,
            is_primary: willBePrimary,
            relationship: null,
            notes: null,
          },
        ]);
        setNewOwnerName("");
        setNewOwnerStatus("unknown");
        setShowOwnerForm(false);
      }
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

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="m-0 text-[14px] font-medium tracking-tight text-ink">
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

      {showOwnerForm && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newOwnerName}
              onChange={(e) => setNewOwnerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOwner();
                }
              }}
              placeholder="Full Name"
              className="min-w-[200px] flex-1 rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
            <select
              value={newOwnerStatus}
              onChange={(e) => setNewOwnerStatus(e.target.value as OwnerStatus)}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-xs text-ink outline-none focus:border-petrol-500"
            >
              {(Object.keys(OWNER_STATUS_LABELS) as OwnerStatus[]).map((s) => (
                <option key={s} value={s}>
                  {OWNER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setShowOwnerForm(false);
                setNewOwnerName("");
              }}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addOwner}
              disabled={!newOwnerName.trim()}
              className="btn-primary cursor-pointer rounded-md px-3 py-[6px] text-xs font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

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
              onRemoveOwner={() => removeOwner(owner.id)}
              onAddContact={(channel, value) =>
                addContact(owner.id, channel, value)
              }
              onRemoveContact={removeContact}
              onSetContactStatus={setContactStatus}
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
  onRemoveOwner,
  onAddContact,
  onRemoveContact,
  onSetContactStatus,
}: {
  owner: OwnerRowFull;
  phones: ContactRow[];
  emails: ContactRow[];
  onChangeStatus: (s: OwnerStatus) => void;
  onRemoveOwner: () => void;
  onAddContact: (channel: "phone" | "email", value: string) => void;
  onRemoveContact: (id: string) => void;
  onSetContactStatus: (id: string, s: ContactStatus) => void;
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
        {owner.is_primary ? (
          <IconStarFilled
            size={13}
            className="mt-[2px] shrink-0 text-warn"
            aria-label="Primary Owner"
          />
        ) : (
          <IconStar size={13} className="mt-[2px] shrink-0 text-gray-300" />
        )}
        <div className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-ink">
          {owner.full_name}
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
        <div className="text-[10px] font-medium uppercase tracking-[0.4px] text-gray-400">
          Phone
        </div>
        {phones.map((c) => (
          <ContactLine
            key={c.id}
            value={formatPhone(c.value)}
            status={c.status}
            canRemove={isAdmin}
            onRemove={() => onRemoveContact(c.id)}
            onSetStatus={(s) => onSetContactStatus(c.id, s)}
          />
        ))}
        {addingPhone ? (
          <div className="flex items-center gap-1">
            <input
              type="tel"
              autoFocus
              value={newPhone}
              onChange={(e) => setNewPhone(formatPhone(e.target.value))}
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
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
            <button
              type="button"
              onClick={submitPhone}
              disabled={!newPhone.trim()}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-1.5 py-[4px] text-gray-500 hover:border-petrol-500 hover:text-petrol-500 disabled:opacity-50"
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
              className="inline-flex w-fit cursor-pointer items-center gap-0.5 text-[11px] text-petrol-500 hover:text-petrol-700"
            >
              <IconPlus size={11} stroke={2} />
              Add Phone {phones.length + 1}
            </button>
          )
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-medium uppercase tracking-[0.4px] text-gray-400">
          Email
        </div>
        {emails.map((c) => (
          <ContactLine
            key={c.id}
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
                  "min-w-0 flex-1 rounded-md border bg-surface px-2 py-[4px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500",
                  emailError ? "border-danger" : "border-gray-200"
                )}
              />
              <button
                type="button"
                onClick={submitEmail}
                disabled={!newEmail.trim()}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-1.5 py-[4px] text-gray-500 hover:border-petrol-500 hover:text-petrol-500 disabled:opacity-50"
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
              className="inline-flex w-fit cursor-pointer items-center gap-0.5 text-[11px] text-petrol-500 hover:text-petrol-700"
            >
              <IconPlus size={11} stroke={2} />
              Add Email {emails.length + 1}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function ContactLine({
  value,
  status,
  onRemove,
  onSetStatus,
  canRemove,
  breakAll,
}: {
  value: string;
  status: ContactStatus;
  onRemove: () => void;
  onSetStatus: (s: ContactStatus) => void;
  canRemove: boolean;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-150 bg-gray-50 p-1.5">
      <div className="flex items-start gap-1">
        <span
          className={cn(
            "min-w-0 flex-1 text-[11.5px] font-medium text-ink",
            breakAll ? "break-all" : "whitespace-nowrap"
          )}
        >
          {value}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer text-gray-300 hover:text-danger"
            aria-label="Remove"
          >
            <IconTrash size={11} stroke={1.75} />
          </button>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {CONTACT_STATUS_ORDER.map((s) => {
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSetStatus(s)}
              className={cn(
                "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium transition-colors",
                active
                  ? s === "valid"
                    ? "bg-success-bg text-success-strong"
                    : s === "invalid"
                      ? "bg-danger-bg text-danger"
                      : s === "dnc"
                        ? "bg-warn-bg text-warn-strong"
                        : "bg-petrol-100 text-petrol-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-150"
              )}
            >
              {CONTACT_STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
