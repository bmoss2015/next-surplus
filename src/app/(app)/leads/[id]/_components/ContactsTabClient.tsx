"use client";

import { useState, useTransition } from "react";
import {
  IconPlus,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconPhone,
  IconMail,
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

const CHANNEL_LABELS = {
  phone: "Phone",
  email: "Email",
  mailing_address: "Mailing Address",
} as const;

const CHANNEL_ICON = {
  phone: IconPhone,
  email: IconMail,
  mailing_address: IconMail,
} as const;

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    startTransition(async () => {
      const result = await upsertOwner(leadId, null, {
        full_name: name,
        status: newOwnerStatus,
        is_primary: owners.length === 0,
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
            is_primary: prev.length === 0,
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

  function setStatus(contactId: string, status: ContactStatus) {
    const target = contacts.find((c) => c.id === contactId);
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, status } : c))
    );
    startTransition(async () => {
      await upsertContact(leadId, target?.owner_id ?? "", contactId, {
        status,
      });
    });
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="m-0 text-[14px] font-medium tracking-tight text-ink">
          Contacts
        </h3>
        {!showOwnerForm && (
          <button
            type="button"
            onClick={() => setShowOwnerForm(true)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
          >
            <IconPlus size={13} stroke={2} />
            Add Owner
          </button>
        )}
      </div>

      {showOwnerForm && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="grid grid-cols-[1fr_140px_auto_auto] gap-2">
            <input
              type="text"
              autoFocus
              value={newOwnerName}
              onChange={(e) => setNewOwnerName(e.target.value)}
              placeholder="Full Name"
              className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
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
              className="cursor-pointer rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {owners.length === 0 && (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No Owners Yet. Click Add Owner To Get Started.
        </div>
      )}

      <div className="space-y-4">
        {owners.map((owner) => (
          <OwnerCard
            key={owner.id}
            owner={owner}
            contacts={contacts.filter((c) => c.owner_id === owner.id)}
            onChangeStatus={(s) => changeOwnerStatus(owner.id, s)}
            onRemoveOwner={() => removeOwner(owner.id)}
            onAddContact={(channel, value) =>
              addContact(owner.id, channel, value)
            }
            onRemoveContact={(id) => removeContact(id)}
            onSetContactStatus={(id, s) => setStatus(id, s)}
          />
        ))}
      </div>
    </div>
  );
}

function OwnerCard({
  owner,
  contacts,
  onChangeStatus,
  onRemoveOwner,
  onAddContact,
  onRemoveContact,
  onSetContactStatus,
}: {
  owner: OwnerRowFull;
  contacts: ContactRow[];
  onChangeStatus: (s: OwnerStatus) => void;
  onRemoveOwner: () => void;
  onAddContact: (channel: "phone" | "email", value: string) => void;
  onRemoveContact: (id: string) => void;
  onSetContactStatus: (id: string, s: ContactStatus) => void;
}) {
  const { isAdmin } = useRole();
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  function submitPhone() {
    const v = newPhone.trim();
    if (!v) return;
    onAddContact("phone", v);
    setNewPhone("");
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
  }

  return (
    <div className="rounded-md border border-gray-200 bg-surface">
      <div className="flex items-center gap-3 border-b border-gray-150 px-4 py-3">
        {owner.is_primary ? (
          <IconStarFilled size={14} className="text-warn" aria-label="Primary" />
        ) : (
          <IconStar size={14} className="text-gray-300" />
        )}
        <div className="flex-1">
          <div className="text-[14px] font-medium text-ink">
            {owner.full_name}
            {owner.relationship && (
              <span className="ml-2 text-[11px] font-normal text-gray-500">
                {owner.relationship}
              </span>
            )}
          </div>
        </div>
        <select
          value={owner.status}
          onChange={(e) => onChangeStatus(e.target.value as OwnerStatus)}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] text-ink outline-none focus:border-petrol-500"
        >
          {(Object.keys(OWNER_STATUS_LABELS) as OwnerStatus[]).map((s) => (
            <option key={s} value={s}>
              {OWNER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {isAdmin && (
          <button
            type="button"
            onClick={onRemoveOwner}
            className="cursor-pointer text-gray-400 hover:text-danger"
            aria-label="Remove Owner"
          >
            <IconTrash size={14} stroke={1.75} />
          </button>
        )}
      </div>

      {/* Contacts */}
      <div className="px-4 py-3">
        {contacts.length === 0 && (
          <div className="text-[11.5px] text-gray-500">No Phone Or Email Yet.</div>
        )}
        {contacts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isAdmin={isAdmin}
                onRemove={() => onRemoveContact(contact.id)}
                onSetStatus={(s) => onSetContactStatus(contact.id, s)}
              />
            ))}
          </div>
        )}

        {/* Inline add phone + email */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1">
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(formatPhone(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitPhone();
                  }
                }}
                placeholder="Add Phone"
                className="flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
              />
              <button
                type="button"
                onClick={submitPhone}
                disabled={!newPhone.trim()}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] text-gray-500 hover:border-petrol-500 hover:text-petrol-500 disabled:opacity-50"
                aria-label="Add Phone"
              >
                <IconPlus size={11} stroke={2} />
              </button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <input
                type="email"
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
                }}
                placeholder="Add Email"
                className={cn(
                  "flex-1 rounded-md border bg-surface px-2 py-[5px] text-[12px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500",
                  emailError ? "border-danger" : "border-gray-200"
                )}
              />
              <button
                type="button"
                onClick={submitEmail}
                disabled={!newEmail.trim()}
                className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11px] text-gray-500 hover:border-petrol-500 hover:text-petrol-500 disabled:opacity-50"
                aria-label="Add Email"
              >
                <IconPlus size={11} stroke={2} />
              </button>
            </div>
            {emailError && (
              <div className="mt-1 text-[10.5px] text-danger">{emailError}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  contact,
  isAdmin,
  onRemove,
  onSetStatus,
}: {
  contact: ContactRow;
  isAdmin: boolean;
  onRemove: () => void;
  onSetStatus: (s: ContactStatus) => void;
}) {
  const Icon = CHANNEL_ICON[contact.channel];
  return (
    <div className="group relative flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3">
      {isAdmin && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 invisible cursor-pointer text-gray-400 hover:text-danger group-hover:visible"
          aria-label="Remove Contact"
        >
          <IconTrash size={12} stroke={1.75} />
        </button>
      )}
      <div className="flex items-start gap-1.5 pr-4">
        <Icon size={13} stroke={1.75} className="mt-[2px] shrink-0 text-gray-400" />
        <span className="break-all text-[12.5px] font-medium text-ink">
          {contact.value}
        </span>
      </div>
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-400">
        {CHANNEL_LABELS[contact.channel]}
      </div>
      <div className="flex flex-wrap gap-1">
        {CONTACT_STATUS_ORDER.map((s) => {
          const active = contact.status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSetStatus(s)}
              className={cn(
                "cursor-pointer rounded-full px-2 py-[2px] text-[10px] font-medium transition-colors",
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
