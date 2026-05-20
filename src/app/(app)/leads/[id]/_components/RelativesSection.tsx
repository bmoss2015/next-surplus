"use client";

import { useEffect, useState, useTransition } from "react";
import { IconPlus, IconTrash, IconUsersGroup, IconPencil, IconPhone } from "@tabler/icons-react";
import { upsertRelative, deleteRelative, type RelativePatch } from "../_actions";
import type { RelativeRow } from "@/lib/leads/fetch-detail";
import { useRole } from "@/components/RoleProvider";
import { Modal } from "@/components/Modal";
import { AgeEditField } from "./ContactsTabClient";
import { formatPhone } from "@/lib/format/phone";
import { formatPhoneInput, toE164 } from "@/lib/phone";
import { properCaseName } from "@/lib/format/proper-case-name";
import { SectionSubheader } from "./SectionSubheader";
import { cn } from "@/lib/cn";

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

// Phone slot column names. Phone 1 lives in the bare `phone` / `phone_type` /
// `phone_is_dnc` / `phone_is_litigator` columns; phones 2..5 are numbered.
const PHONE_SLOTS = [
  { value: "phone", type: "phone_type", dnc: "phone_is_dnc", lit: "phone_is_litigator", status: "phone_status", checkedAt: "phone_validation_checked_at", provider: "phone_validation_provider" },
  { value: "phone_2", type: "phone_2_type", dnc: "phone_2_is_dnc", lit: "phone_2_is_litigator", status: "phone_2_status", checkedAt: "phone_2_validation_checked_at", provider: "phone_2_validation_provider" },
  { value: "phone_3", type: "phone_3_type", dnc: "phone_3_is_dnc", lit: "phone_3_is_litigator", status: "phone_3_status", checkedAt: "phone_3_validation_checked_at", provider: "phone_3_validation_provider" },
  { value: "phone_4", type: "phone_4_type", dnc: "phone_4_is_dnc", lit: "phone_4_is_litigator", status: "phone_4_status", checkedAt: "phone_4_validation_checked_at", provider: "phone_4_validation_provider" },
  { value: "phone_5", type: "phone_5_type", dnc: "phone_5_is_dnc", lit: "phone_5_is_litigator", status: "phone_5_status", checkedAt: "phone_5_validation_checked_at", provider: "phone_5_validation_provider" },
] as const;

const EMAIL_SLOTS = ["email", "email_2", "email_3", "email_4", "email_5"] as const;

// Fix TTTT4: cycle through Landline as a first-class option; keep
// "Residential" recognized by the display function so legacy rows still
// render as Landline rather than the "Type" placeholder.
const PHONE_TYPE_CYCLE: (string | null)[] = [null, "Mobile", "Landline", "Residential", "Other"];
function phoneTypeShort(t: string | null): string {
  if (t === "Mobile") return "Mobile";
  if (t === "Landline") return "Landline";
  if (t === "Residential") return "Landline";
  if (t === "Other") return "Other";
  return "Type";
}
function nextPhoneType(t: string | null): string | null {
  const i = PHONE_TYPE_CYCLE.indexOf(t ?? null);
  return PHONE_TYPE_CYCLE[(i + 1) % PHONE_TYPE_CYCLE.length] ?? null;
}

function makeRelativeRow(
  id: string,
  leadId: string,
  full_name: string,
  relationship: string | null,
  phone: string | null
): RelativeRow {
  return {
    id,
    lead_id: leadId,
    full_name,
    relationship,
    age: null,
    phone,
    phone_type: null,
    phone_is_dnc: false,
    phone_is_litigator: false,
    phone_status: "untested",
    phone_validation_checked_at: null,
    phone_validation_provider: null,
    phone_2: null,
    phone_2_type: null,
    phone_2_is_dnc: false,
    phone_2_is_litigator: false,
    phone_2_status: "untested",
    phone_2_validation_checked_at: null,
    phone_2_validation_provider: null,
    phone_3: null,
    phone_3_type: null,
    phone_3_is_dnc: false,
    phone_3_is_litigator: false,
    phone_3_status: "untested",
    phone_3_validation_checked_at: null,
    phone_3_validation_provider: null,
    phone_4: null,
    phone_4_type: null,
    phone_4_is_dnc: false,
    phone_4_is_litigator: false,
    phone_4_status: "untested",
    phone_4_validation_checked_at: null,
    phone_4_validation_provider: null,
    phone_5: null,
    phone_5_type: null,
    phone_5_is_dnc: false,
    phone_5_is_litigator: false,
    phone_5_status: "untested",
    phone_5_validation_checked_at: null,
    phone_5_validation_provider: null,
    email: null,
    email_2: null,
    email_3: null,
    email_4: null,
    email_5: null,
    notes: null,
    street: null,
    city: null,
    state: null,
    zip: null,
  };
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
  // Keys of phone slots currently being validated server-side, formatted as
  // "<relativeId>:<base>" (e.g. "abc-123:phone_2"). Drives the "Verifying…"
  // pill on the slot while the action awaits Veriphone.
  const [verifyingSlots, setVerifyingSlots] = useState<Set<string>>(() => new Set());
  const [draftName, setDraftName] = useState("");
  const [draftRelationship, setDraftRelationship] = useState("");
  const [draftAge, setDraftAge] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftPhoneDnc, setDraftPhoneDnc] = useState(false);
  const [draftPhoneLitigator, setDraftPhoneLitigator] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function resetDrafts() {
    setDraftName("");
    setDraftRelationship("");
    setDraftAge("");
    setDraftPhone("");
    setDraftPhoneDnc(false);
    setDraftPhoneLitigator(false);
    setDraftEmail("");
    setDraftNotes("");
    setError(null);
  }

  function add() {
    setError(null);
    const name = draftName.trim();
    if (!name) {
      setError("Name Is Required");
      return;
    }
    const phone = draftPhone.trim() || null;
    const email = draftEmail.trim().toLowerCase() || null;
    const notes = draftNotes.trim() || null;
    const relationship = draftRelationship.trim() || null;
    const ageNum = draftAge.trim() ? Number(draftAge.trim()) : null;
    const age = ageNum != null && !Number.isNaN(ageNum) ? ageNum : null;
    startTransition(async () => {
      const res = await upsertRelative(leadId, null, {
        full_name: name,
        relationship,
        age,
        phone,
        phone_is_dnc: phone ? draftPhoneDnc : false,
        phone_is_litigator: phone ? draftPhoneLitigator : false,
        email,
        notes,
      });
      if (res.ok) {
        const row = makeRelativeRow(res.id, leadId, name, relationship, phone);
        row.age = age;
        row.phone_is_dnc = phone ? draftPhoneDnc : false;
        row.phone_is_litigator = phone ? draftPhoneLitigator : false;
        row.email = email;
        row.notes = notes;
        setRelatives((prev) => [...prev, row]);
        resetDrafts();
        setAdding(false);
      } else {
        setError(res.error);
      }
    });
  }

  function patch(id: string, fields: RelativePatch) {
    setRelatives((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, ...fields } as RelativeRow) : r))
    );
    // If this patch sets a phone value on any slot, mark that slot as verifying
    // while the server-side validation runs.
    const fieldsRecord = fields as Record<string, unknown>;
    const phoneBases = ["phone", "phone_2", "phone_3", "phone_4", "phone_5"] as const;
    const touchedKeys: string[] = [];
    for (const base of phoneBases) {
      const v = fieldsRecord[base];
      if (typeof v === "string" && v.trim().length > 0) {
        touchedKeys.push(`${id}:${base}`);
      }
    }
    if (touchedKeys.length > 0) {
      setVerifyingSlots((prev) => {
        const next = new Set(prev);
        for (const k of touchedKeys) next.add(k);
        return next;
      });
    }
    startTransition(async () => {
      const result = await upsertRelative(leadId, id, fields);
      if (result.ok && result.row) {
        const validated = result.row as RelativeRow;
        setRelatives((prev) => prev.map((r) => (r.id === id ? validated : r)));
      }
      if (touchedKeys.length > 0) {
        setVerifyingSlots((prev) => {
          const next = new Set(prev);
          for (const k of touchedKeys) next.delete(k);
          return next;
        });
      }
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="section-subheader flex items-center gap-1.5">
          <IconUsersGroup size={15} stroke={1.75} className="text-gray-400" />
          Relatives
        </h3>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setError(null);
            }}
            className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-[6px] text-[12px] font-medium"
          >
            <IconPlus size={13} stroke={2} />
            Add Relative
          </button>
        )}
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
              verifyingSlots={verifyingSlots}
            />
          ))}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => {
          setAdding(false);
          resetDrafts();
        }}
        title="Add Relative"
        description="Capture the full details up front. Additional phones, addresses, and metadata can be edited on the relative card afterwards."
        width={500}
      >
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Full Name
        </label>
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Linda Smith Park"
          className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
        <div className="mt-3 grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Relationship
            </label>
            <select
              value={draftRelationship}
              onChange={(e) => setDraftRelationship(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none focus:border-petrol-500"
            >
              <option value="">Select Relationship</option>
              {RELATIONSHIP_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Age
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={draftAge}
              onChange={(e) => setDraftAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="—"
              className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Phone
            </label>
            <input
              type="tel"
              value={draftPhone}
              onChange={(e) => setDraftPhone(formatPhoneInput(e.target.value))}
              placeholder="(555) 555-1234"
              className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
            {draftPhone.trim().length > 0 && (
              <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-600">
                <label className="inline-flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={draftPhoneDnc}
                    onChange={(e) => setDraftPhoneDnc(e.target.checked)}
                  />
                  DNC
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    checked={draftPhoneLitigator}
                    onChange={(e) => setDraftPhoneLitigator(e.target.checked)}
                  />
                  Litigator
                </label>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Email
            </label>
            <input
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="linda@example.com"
              className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
            />
          </div>
        </div>
        <label className="mt-3 mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Notes
        </label>
        <textarea
          value={draftNotes}
          onChange={(e) => setDraftNotes(e.target.value)}
          rows={3}
          placeholder="Optional context — relationship details, best time to reach, etc."
          className="w-full resize-y rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
        {error && <div className="mt-3 text-[12px] text-danger">{error}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              resetDrafts();
            }}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={add}
            disabled={!draftName.trim()}
            className="btn-primary cursor-pointer rounded-md px-4 py-[6px] text-xs font-medium disabled:opacity-50"
          >
            Add Relative
          </button>
        </div>
      </Modal>
    </div>
  );
}

function RelativeCard({
  relative,
  canRemove,
  onPatch,
  onRemove,
  verifyingSlots,
}: {
  relative: RelativeRow;
  canRemove: boolean;
  onPatch: (fields: RelativePatch) => void;
  onRemove: () => void;
  verifyingSlots: Set<string>;
}) {
  const [street, setStreet] = useState(relative.street ?? "");
  const [city, setCity] = useState(relative.city ?? "");
  const [stateCode, setStateCode] = useState(relative.state ?? "");
  const [zip, setZip] = useState(relative.zip ?? "");
  // Fix III: a discrete "+ Add Phone" / "+ Add Email" link reveals the next
  // empty slot (capped at 5 each); hidden once all five are showing.
  const [extraPhones, setExtraPhones] = useState(0);
  const [extraEmails, setExtraEmails] = useState(0);

  const addrInputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  const filledPhones = PHONE_SLOTS.filter(
    (s) => ((relative[s.value] as string | null) ?? "").trim()
  ).length;
  const visiblePhoneCount = Math.min(5, Math.max(1, filledPhones + extraPhones));
  const visibleSlotIndices = Array.from({ length: visiblePhoneCount }, (_, i) => i);

  const filledEmails = EMAIL_SLOTS.filter(
    (k) => ((relative[k] as string | null) ?? "").trim()
  ).length;
  const visibleEmailCount = Math.min(5, Math.max(1, filledEmails + extraEmails));
  const visibleEmailIndices = Array.from({ length: visibleEmailCount }, (_, i) => i);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-surface p-3">
      <div className="text-[13px] font-medium leading-tight text-ink">
        {properCaseName(relative.full_name) || "Unknown"}
        <AgeEditField value={relative.age} onCommit={(n) => onPatch({ age: n })} />
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
        <SectionSubheader className="mb-0">Phone</SectionSubheader>
        {visibleSlotIndices.map((i) => (
          <PhoneSlot
            key={PHONE_SLOTS[i].value}
            slot={PHONE_SLOTS[i]}
            relative={relative}
            onPatch={onPatch}
            isVerifying={verifyingSlots.has(`${relative.id}:${PHONE_SLOTS[i].value}`)}
          />
        ))}
        {visiblePhoneCount < 5 && (
          <button
            type="button"
            onClick={() => setExtraPhones((e) => e + 1)}
            className="w-fit cursor-pointer text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
          >
            + Add Phone
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-gray-150 pt-2">
        <SectionSubheader className="mb-0">Email</SectionSubheader>
        {visibleEmailIndices.map((i) => (
          <EmailSlot
            key={EMAIL_SLOTS[i]}
            field={EMAIL_SLOTS[i]}
            relative={relative}
            onPatch={onPatch}
          />
        ))}
        {visibleEmailCount < 5 && (
          <button
            type="button"
            onClick={() => setExtraEmails((e) => e + 1)}
            className="w-fit cursor-pointer text-[11px] font-medium text-petrol-500 hover:text-petrol-700"
          >
            + Add Email
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t border-gray-150 pt-2">
        <SectionSubheader className="mb-0">Address</SectionSubheader>
        <input
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          onBlur={() => onPatch({ street: street.trim() || null })}
          placeholder="Street"
          className={addrInputClass}
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={() => onPatch({ city: city.trim() || null })}
          placeholder="City"
          className={addrInputClass}
        />
        <div className="flex gap-1">
          <input
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
            onBlur={() => onPatch({ state: stateCode.trim() || null })}
            placeholder="ST"
            maxLength={2}
            className={cn(addrInputClass, "w-12 shrink-0 uppercase")}
          />
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            onBlur={() => onPatch({ zip: zip.trim() || null })}
            placeholder="Zip"
            className={cn(addrInputClass, "min-w-0 flex-1")}
          />
        </div>
      </div>

      {relative.notes && (
        <div className="border-t border-gray-150 pt-2">
          <SectionSubheader className="mb-0">Notes</SectionSubheader>
          <NotesEditor
            value={relative.notes}
            onCommit={(v) => onPatch({ notes: v })}
          />
        </div>
      )}
      {!relative.notes && (
        <div className="border-t border-gray-150 pt-2">
          <NotesEditor
            value=""
            onCommit={(v) => onPatch({ notes: v })}
            placeholder="+ Add notes"
          />
        </div>
      )}

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

function NotesEditor({
  value,
  onCommit,
  placeholder,
}: {
  value: string;
  onCommit: (next: string | null) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const next = draft.trim();
          if (next !== value) onCommit(next || null);
        }}
        rows={2}
        placeholder="Notes — hostile to outreach, has POA, knows where owner lives, etc."
        className="w-full resize-y rounded-md border border-gray-200 bg-surface px-2 py-[5px] text-[11.5px] leading-relaxed text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
      />
    );
  }
  if (!value) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="cursor-text text-[11px] italic text-gray-400 hover:text-petrol-500"
      >
        {placeholder ?? "+ Add notes"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="block w-full cursor-text whitespace-pre-wrap rounded px-1 py-[2px] text-left text-[11.5px] italic leading-relaxed text-gray-600 hover:bg-petrol-50"
    >
      {value}
    </button>
  );
}

// Status labels match the owner-contact section so the two surfaces look
// identical (single source of truth would be nicer; for now we mirror).
const RELATIVE_PHONE_STATUS_LABELS: Record<"untested" | "valid" | "invalid", string> = {
  untested: "Not Verified",
  valid: "Verified",
  invalid: "Invalid",
};

function PhoneSlot({
  slot,
  relative,
  onPatch,
  isVerifying,
}: {
  slot: (typeof PHONE_SLOTS)[number];
  relative: RelativeRow;
  onPatch: (fields: RelativePatch) => void;
  isVerifying?: boolean;
}) {
  const stored = ((relative[slot.value] as string | null) ?? "").trim();
  // Empty slots open straight into edit mode (so the user can type); filled
  // slots stay committed until the user clicks the pencil. Matches the
  // owner-contact card pattern.
  const [editing, setEditing] = useState(stored.length === 0);
  const [val, setVal] = useState(stored);
  useEffect(() => {
    const next = ((relative[slot.value] as string | null) ?? "").trim();
    setVal(next);
    // Drop out of edit mode whenever the server returns a saved value — keeps
    // the committed display fresh after onPatch round-trips.
    if (next.length > 0) setEditing(false);
  }, [relative, slot.value]);

  const type = relative[slot.type] as string | null;
  const isDnc = relative[slot.dnc] as boolean;
  const isLit = relative[slot.lit] as boolean;
  const status = ((relative[slot.status] as string | null) ?? "untested") as
    | "untested"
    | "valid"
    | "invalid";
  const checkedAt = relative[slot.checkedAt] as string | null;
  const provider = relative[slot.provider] as string | null;
  const isDead = status === "invalid";
  const validationTooltip = (() => {
    if (!checkedAt) return undefined;
    const when = new Date(checkedAt).toLocaleDateString();
    const providerLabel = provider
      ? provider === "libphonenumber"
        ? "format check"
        : provider
      : null;
    if (isDead) {
      return `Marked invalid ${when}${providerLabel ? ` (${providerLabel})` : ""}`;
    }
    if (status === "untested") {
      return `Tried to verify ${when}${providerLabel ? ` (${providerLabel})` : ""} — result unclear, manual review may help`;
    }
    return undefined;
  })();

  const statusPillClass = (s: "untested" | "valid" | "invalid") =>
    s === "valid"
      ? "bg-petrol-500 text-white"
      : s === "invalid"
        ? "bg-danger text-white"
        : "bg-gray-200 text-gray-700";

  const togglePill = (active: boolean, activeClass: string) =>
    cn(
      "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium transition-colors",
      active ? activeClass : "bg-[#f1f5f9] text-[#64748b] hover:bg-gray-150"
    );

  const commit = () => {
    const t = val.trim();
    if (t !== stored) onPatch({ [slot.value]: t || null } as RelativePatch);
    if (t.length > 0) setEditing(false);
  };

  // Empty + non-editing shouldn't happen, but guard anyway.
  const showInput = editing || stored.length === 0;

  return (
    <div className="rounded-md border border-gray-150 bg-gray-50 p-1.5">
      <div className="flex items-center gap-1">
        {showInput ? (
          <input
            autoFocus={editing}
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === "Escape") {
                setVal(stored);
                if (stored.length > 0) setEditing(false);
              }
            }}
            placeholder="(555) 555-5555"
            className="min-w-0 flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
          />
        ) : (
          <span
            title={validationTooltip}
            className={cn(
              "min-w-0 flex-1 whitespace-nowrap text-[11.5px] font-medium",
              isDead ? "text-gray-400 line-through" : "text-ink"
            )}
          >
            {formatPhone(stored)}
          </span>
        )}
        {!showInput && stored && (
          <a
            href={`tel:${toE164(stored) ?? stored}`}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center justify-center",
              isDead
                ? "text-gray-300 hover:text-gray-500"
                : "text-petrol-500 hover:text-petrol-700"
            )}
            aria-label="Call this number"
            title="Call"
          >
            <IconPhone size={12} stroke={1.75} />
          </a>
        )}
        {!showInput && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center text-gray-300 hover:text-petrol-500"
            aria-label="Edit Phone"
          >
            <IconPencil size={12} stroke={1.75} />
          </button>
        )}
        {stored && (
          <button
            type="button"
            onClick={() => onPatch({ [slot.value]: null } as RelativePatch)}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center text-gray-300 hover:text-danger"
            aria-label="Clear Phone"
          >
            <IconTrash size={12} stroke={1.75} />
          </button>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPatch({ [slot.type]: nextPhoneType(type) } as RelativePatch)}
          className={cn(
            "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium",
            type
              ? "bg-petrol-100 text-petrol-700"
              : "border border-dashed border-gray-300 text-gray-400"
          )}
          aria-label="Phone Type"
        >
          {phoneTypeShort(type)}
        </button>
        {/* Status pill — matches owner-contact section. Shows "Verifying…"
            with a pulse while the server-side validation is in flight. */}
        {stored && (
          isVerifying ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-petrol-100 px-1.5 py-[1px] text-[9px] font-medium leading-none text-petrol-700">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-petrol-500" />
              Verifying…
            </span>
          ) : (
            <span
              title={validationTooltip}
              className={cn(
                "rounded-full px-1.5 py-[1px] text-[9px] font-medium leading-none",
                statusPillClass(status)
              )}
            >
              {RELATIVE_PHONE_STATUS_LABELS[status]}
            </span>
          )
        )}
        <button
          type="button"
          onClick={() => onPatch({ [slot.dnc]: !isDnc } as RelativePatch)}
          className={togglePill(isDnc, "bg-danger-bg text-danger")}
          aria-label="Do Not Call"
        >
          DNC
        </button>
        <button
          type="button"
          onClick={() => onPatch({ [slot.lit]: !isLit } as RelativePatch)}
          className={togglePill(isLit, "bg-[#7f1d1d] text-white")}
          aria-label="Litigator"
        >
          Litigator
        </button>
      </div>
    </div>
  );
}

function EmailSlot({
  field,
  relative,
  onPatch,
}: {
  field: (typeof EMAIL_SLOTS)[number];
  relative: RelativeRow;
  onPatch: (fields: RelativePatch) => void;
}) {
  const stored = ((relative[field] as string | null) ?? "").trim();
  const [val, setVal] = useState(stored);
  useEffect(() => {
    setVal(((relative[field] as string | null) ?? "").trim());
  }, [relative, field]);

  return (
    <div className="flex items-center gap-1">
      <input
        type="email"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          const t = val.trim();
          if (t !== stored) onPatch({ [field]: t || null } as RelativePatch);
        }}
        placeholder="name@example.com"
        className="min-w-0 flex-1 break-all rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
      />
      {stored && (
        <button
          type="button"
          onClick={() => onPatch({ [field]: null } as RelativePatch)}
          className="cursor-pointer text-gray-300 hover:text-danger"
          aria-label="Clear Email"
        >
          <IconTrash size={11} stroke={1.75} />
        </button>
      )}
    </div>
  );
}
