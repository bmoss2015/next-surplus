"use client";

import { useState, useTransition } from "react";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconBuildingBank,
} from "@tabler/icons-react";
import { Drawer } from "@/components/Drawer";
import { formatPhoneUS } from "@/lib/phone";
import {
  LEAD_PARTY_ROLE_LABELS,
  type LeadPartyRole,
  type LeadPartyRow,
} from "@/lib/leads/lead-parties-types";
import {
  upsertLeadParty,
  deleteLeadParty,
} from "../_lead-parties-actions";

const ROLE_OPTIONS: LeadPartyRole[] = [
  "attorney_for_owner",
  "trustee",
  "successor_heir",
  "county_clerk",
  "court",
  "opposing_counsel",
  "title_company",
  "realtor",
  "notary",
  "guardian",
  "other",
];

function roleLabel(row: LeadPartyRow): string {
  if (row.role === "other" && row.custom_role_label) {
    return row.custom_role_label;
  }
  return LEAD_PARTY_ROLE_LABELS[row.role];
}

export function OtherContactsSection({
  leadId,
  initial,
}: {
  leadId: string;
  initial: LeadPartyRow[];
}) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<LeadPartyRow | "new" | null>(null);
  const [, startTransition] = useTransition();

  function close() {
    setEditing(null);
  }

  function save(form: LeadPartyFormValues) {
    startTransition(async () => {
      const id = typeof editing === "object" && editing !== null ? editing.id : null;
      const result = await upsertLeadParty({
        id,
        lead_id: leadId,
        role: form.role,
        custom_role_label: form.custom_role_label,
        name: form.name,
        organization: form.organization,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
      });
      if (!result.ok) return;
      if (id) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  role: form.role,
                  custom_role_label:
                    form.role === "other"
                      ? form.custom_role_label.trim() || null
                      : null,
                  name: form.name.trim(),
                  organization: form.organization.trim() || null,
                  email: form.email.trim().toLowerCase() || null,
                  phone: form.phone.trim() || null,
                  notes: form.notes.trim() || null,
                }
              : r
          )
        );
      } else {
        setRows((prev) => [
          ...prev,
          {
            id: result.id,
            lead_id: leadId,
            role: form.role,
            custom_role_label:
              form.role === "other"
                ? form.custom_role_label.trim() || null
                : null,
            name: form.name.trim(),
            organization: form.organization.trim() || null,
            email: form.email.trim().toLowerCase() || null,
            phone: form.phone.trim() || null,
            notes: form.notes.trim() || null,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      close();
    });
  }

  function remove(id: string) {
    if (!confirm("Remove this contact?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteLeadParty(id, leadId);
    });
  }

  return (
    <div className="mt-4 rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="section-subheader">Other Contacts</h3>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            Attorneys, trustees, clerks, opposing counsel — anyone besides the
            owners and their relatives.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
        >
          <IconPlus size={13} stroke={2} />
          Add Contact
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12px] text-gray-500">
          No other contacts yet. Click Add Contact to record an attorney,
          trustee, county clerk, or anyone else connected to this case.
        </div>
      ) : (
        <div className="divide-y divide-gray-150">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-petrol-50 text-petrol-500">
                <IconBuildingBank size={15} stroke={1.75} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink">
                  <span className="text-petrol-500">{roleLabel(row)}</span>
                  <span className="text-gray-400"> · </span>
                  {row.name}
                  {row.organization ? (
                    <span className="text-gray-500"> ({row.organization})</span>
                  ) : null}
                </div>
                <div className="truncate text-[11px] text-gray-500">
                  {[row.email, row.phone ? formatPhoneUS(row.phone) : null]
                    .filter(Boolean)
                    .join("  ·  ") || "No contact info"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(row)}
                className="text-gray-400 hover:text-petrol-500"
                aria-label="Edit"
              >
                <IconEdit size={14} stroke={1.75} />
              </button>
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="text-gray-400 hover:text-danger"
                aria-label="Remove"
              >
                <IconTrash size={14} stroke={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "Add Other Contact" : "Edit Contact"}
        description="Anyone connected to this lead who isn't an owner or relative."
      >
        {editing !== null && (
          <LeadPartyForm
            initial={editing === "new" ? null : editing}
            onCancel={close}
            onSave={save}
          />
        )}
      </Drawer>
    </div>
  );
}

type LeadPartyFormValues = {
  role: LeadPartyRole;
  custom_role_label: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
};

function LeadPartyForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: LeadPartyRow | null;
  onCancel: () => void;
  onSave: (form: LeadPartyFormValues) => void;
}) {
  const [role, setRole] = useState<LeadPartyRole>(initial?.role ?? "attorney_for_owner");
  const [customLabel, setCustomLabel] = useState(
    initial?.custom_role_label ?? ""
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [organization, setOrganization] = useState(initial?.organization ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-gray-500">
        Role
      </label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as LeadPartyRole)}
        className={inputClass}
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {LEAD_PARTY_ROLE_LABELS[r]}
          </option>
        ))}
      </select>

      {role === "other" && (
        <>
          <label className="mt-3 mb-1 block text-[11px] font-medium text-gray-500">
            Custom Role Label
          </label>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g., Probate Referee"
            className={inputClass}
          />
        </>
      )}

      <label className="mt-3 mb-1 block text-[11px] font-medium text-gray-500">
        Name
      </label>
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Jane Doe"
        className={inputClass}
      />

      <label className="mt-3 mb-1 block text-[11px] font-medium text-gray-500">
        Organization
      </label>
      <input
        type="text"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="Doe Law Firm"
        className={inputClass}
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-1234"
            className={inputClass}
          />
        </div>
      </div>

      <label className="mt-3 mb-1 block text-[11px] font-medium text-gray-500">
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="Optional"
        className={`${inputClass} resize-y`}
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              role,
              custom_role_label: customLabel,
              name,
              organization,
              email,
              phone,
              notes,
            })
          }
          disabled={!name.trim() || (role === "other" && !customLabel.trim())}
          className="rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Add Contact"}
        </button>
      </div>
    </div>
  );
}
