"use client";

import { useEffect, useState, useTransition } from "react";
import { IconPlus, IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { upsertRelative, deleteRelative, type RelativePatch } from "../_actions";
import type { RelativeRow } from "@/lib/leads/fetch-detail";
import { useRole } from "@/components/RoleProvider";
import { Modal } from "@/components/Modal";
import { AgeEditField } from "./ContactsTabClient";
import { formatPhone } from "@/lib/format/phone";
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
  { value: "phone", type: "phone_type", dnc: "phone_is_dnc", lit: "phone_is_litigator" },
  { value: "phone_2", type: "phone_2_type", dnc: "phone_2_is_dnc", lit: "phone_2_is_litigator" },
  { value: "phone_3", type: "phone_3_type", dnc: "phone_3_is_dnc", lit: "phone_3_is_litigator" },
  { value: "phone_4", type: "phone_4_type", dnc: "phone_4_is_dnc", lit: "phone_4_is_litigator" },
  { value: "phone_5", type: "phone_5_type", dnc: "phone_5_is_dnc", lit: "phone_5_is_litigator" },
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
    phone_2: null,
    phone_2_type: null,
    phone_2_is_dnc: false,
    phone_2_is_litigator: false,
    phone_3: null,
    phone_3_type: null,
    phone_3_is_dnc: false,
    phone_3_is_litigator: false,
    phone_4: null,
    phone_4_type: null,
    phone_4_is_dnc: false,
    phone_4_is_litigator: false,
    phone_5: null,
    phone_5_type: null,
    phone_5_is_dnc: false,
    phone_5_is_litigator: false,
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
  const [draftName, setDraftName] = useState("");
  const [draftRelationship, setDraftRelationship] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function add() {
    setError(null);
    const name = draftName.trim();
    if (!name) {
      setError("Name Is Required");
      return;
    }
    const phone = draftPhone.trim() || null;
    const relationship = draftRelationship.trim() || null;
    startTransition(async () => {
      const res = await upsertRelative(leadId, null, {
        full_name: name,
        relationship,
        phone,
      });
      if (res.ok) {
        setRelatives((prev) => [
          ...prev,
          makeRelativeRow(res.id, leadId, name, relationship, phone),
        ]);
        setDraftName("");
        setDraftRelationship("");
        setDraftPhone("");
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
    startTransition(async () => {
      await upsertRelative(leadId, id, fields);
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
            />
          ))}
        </div>
      )}

      <Modal
        open={adding}
        onClose={() => {
          setAdding(false);
          setDraftName("");
          setDraftRelationship("");
          setDraftPhone("");
          setError(null);
        }}
        title="Add Relative"
        description="Family members of an owner. Address and additional contact details can be edited on the relative card after saving."
        width={460}
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
        <label className="mt-3 mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
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
        <label className="mt-3 mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Phone
        </label>
        <input
          value={draftPhone}
          onChange={(e) => setDraftPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="(555) 555-5555"
          className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
        {error && <div className="mt-3 text-[12px] text-danger">{error}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setDraftName("");
              setDraftRelationship("");
              setDraftPhone("");
              setError(null);
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
}: {
  relative: RelativeRow;
  canRemove: boolean;
  onPatch: (fields: RelativePatch) => void;
  onRemove: () => void;
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

function PhoneSlot({
  slot,
  relative,
  onPatch,
}: {
  slot: (typeof PHONE_SLOTS)[number];
  relative: RelativeRow;
  onPatch: (fields: RelativePatch) => void;
}) {
  const stored = ((relative[slot.value] as string | null) ?? "").trim();
  const [val, setVal] = useState(stored);
  // Show the formatted number while the field is idle; drop to raw digits the
  // moment it's focused so the value stays clean to edit.
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    setVal(((relative[slot.value] as string | null) ?? "").trim());
  }, [relative, slot.value]);

  const type = relative[slot.type] as string | null;
  const isDnc = relative[slot.dnc] as boolean;
  const isLit = relative[slot.lit] as boolean;

  const pill = (active: boolean, activeClass: string) =>
    cn(
      "cursor-pointer rounded-full px-1.5 py-[1px] text-[9px] font-medium transition-colors",
      active ? activeClass : "bg-[#f1f5f9] text-[#64748b] hover:bg-gray-150"
    );

  return (
    <div className="rounded-md border border-gray-150 bg-gray-50 p-1.5">
      <div className="flex items-center gap-1">
        <input
          value={focused ? val : formatPhone(val)}
          onFocus={() => setFocused(true)}
          onChange={(e) => setVal(e.target.value.replace(/\D/g, "").slice(0, 10))}
          onBlur={() => {
            setFocused(false);
            const t = val.trim();
            if (t !== stored) onPatch({ [slot.value]: t || null } as RelativePatch);
          }}
          placeholder="(555) 555-5555"
          className="min-w-0 flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
        />
        {stored && (
          <button
            type="button"
            onClick={() => onPatch({ [slot.value]: null } as RelativePatch)}
            className="cursor-pointer text-gray-300 hover:text-danger"
            aria-label="Clear Phone"
          >
            <IconTrash size={11} stroke={1.75} />
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
        <button
          type="button"
          onClick={() => onPatch({ [slot.dnc]: !isDnc } as RelativePatch)}
          className={pill(isDnc, "bg-danger-bg text-danger")}
          aria-label="Do Not Call"
        >
          DNC
        </button>
        <button
          type="button"
          onClick={() => onPatch({ [slot.lit]: !isLit } as RelativePatch)}
          className={pill(isLit, "bg-[#7f1d1d] text-white")}
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
