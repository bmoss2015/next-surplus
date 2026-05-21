"use client";

import { useMemo, useState, useTransition } from "react";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconBuildingBank,
  IconMail,
  IconPhone,
  IconSettings,
} from "@tabler/icons-react";
import { Modal } from "@/components/Modal";
import { formatPhoneUS, formatPhoneInput } from "@/lib/phone";
import {
  LEAD_PARTY_ROLE_LABELS,
  type LeadPartyRole,
  type LeadPartyRow,
} from "@/lib/leads/lead-parties-types";
import {
  upsertLeadParty,
  deleteLeadParty,
  replaceCustomRole,
  type CustomRoleReplacement,
} from "../_lead-parties-actions";

// Built-in roles, displayed alphabetically by label. "Other" is excluded —
// it's not a real role option; selecting it reveals the "+ Add new role"
// text input below.
const BUILT_IN_ROLES: LeadPartyRole[] = (
  [
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
  ] as const
)
  .slice()
  .sort((a, b) =>
    LEAD_PARTY_ROLE_LABELS[a].localeCompare(LEAD_PARTY_ROLE_LABELS[b])
  );

function roleLabel(row: LeadPartyRow): string {
  if (row.role === "other" && row.custom_role_label) {
    return row.custom_role_label;
  }
  return LEAD_PARTY_ROLE_LABELS[row.role];
}

export function OtherContactsSection({
  leadId,
  initial,
  customRoles,
}: {
  leadId: string;
  initial: LeadPartyRow[];
  customRoles: string[];
}) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<LeadPartyRow | "new" | null>(null);
  // Custom roles are mutable client-side so a delete reflects immediately
  // in the dropdown without a full page refresh.
  const [roles, setRoles] = useState<string[]>(customRoles);
  const [managingRoles, setManagingRoles] = useState(false);
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
        street: form.street,
        city: form.city,
        state: form.state,
        zip: form.zip,
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
                  street: form.street.trim() || null,
                  city: form.city.trim() || null,
                  state:
                    form.state.trim().toUpperCase().slice(0, 2) || null,
                  zip: form.zip.trim() || null,
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
            street: form.street.trim() || null,
            city: form.city.trim() || null,
            state: form.state.trim().toUpperCase().slice(0, 2) || null,
            zip: form.zip.trim() || null,
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

  // Open the replacement modal for a role. The modal lets the user move every
  // contact using this role to a different role (built-in, another custom, or
  // plain "Other") before the label is removed from the dropdown.
  const [roleToReplace, setRoleToReplace] = useState<string | null>(null);

  function applyRoleReplacement(
    oldLabel: string,
    replacement: CustomRoleReplacement
  ) {
    // Optimistically update local state: clear the old label from the
    // dropdown, and rewrite every affected row on this lead.
    setRoles((prev) => prev.filter((r) => r !== oldLabel));
    if (replacement.kind === "custom") {
      // Make sure the destination label is in the dropdown going forward.
      setRoles((prev) => (prev.includes(replacement.label) ? prev : [...prev, replacement.label]));
    }
    setRows((prev) =>
      prev.map((r) => {
        if (!(r.role === "other" && r.custom_role_label === oldLabel)) return r;
        if (replacement.kind === "builtin") {
          return { ...r, role: replacement.role, custom_role_label: null };
        }
        if (replacement.kind === "custom") {
          return { ...r, role: "other", custom_role_label: replacement.label };
        }
        return { ...r, role: "other", custom_role_label: null };
      })
    );
    setRoleToReplace(null);
    startTransition(async () => {
      await replaceCustomRole(oldLabel, replacement);
    });
  }

  const sortedRoles = useMemo(
    () => roles.slice().sort((a, b) => a.localeCompare(b)),
    [roles]
  );

  return (
    <div className="mt-4 rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-3">
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
          className="inline-flex shrink-0 items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
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
              className="grid grid-cols-[auto_1fr_auto_auto] items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-petrol-50 text-petrol-500">
                <IconBuildingBank size={16} stroke={1.75} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">
                    {row.name}
                  </span>
                  {row.organization && (
                    <span className="truncate text-[11.5px] text-gray-500">
                      · {row.organization}
                    </span>
                  )}
                </div>
                <div className="mt-[1px] text-[9.5px] font-medium uppercase tracking-wide text-petrol-500">
                  {roleLabel(row)}
                </div>
                <div className="mt-[6px] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-600">
                  {row.email && (
                    <span className="inline-flex items-center gap-1">
                      <IconMail size={11} stroke={1.75} className="text-gray-400" />
                      {row.email}
                    </span>
                  )}
                  {row.phone && (
                    <span className="inline-flex items-center gap-1">
                      <IconPhone size={11} stroke={1.75} className="text-gray-400" />
                      {formatPhoneUS(row.phone)}
                    </span>
                  )}
                  {!row.email && !row.phone && !row.street && !row.city && (
                    <span className="text-gray-400">No contact info</span>
                  )}
                </div>
                {(row.street || row.city || row.state || row.zip) && (
                  <div className="mt-1 inline-flex items-start gap-1 text-[11.5px] text-gray-600">
                    <IconBuildingBank
                      size={11}
                      stroke={1.75}
                      className="mt-[2px] flex-shrink-0 text-gray-400"
                    />
                    <span className="leading-snug">
                      {[
                        row.street,
                        [
                          row.city,
                          [row.state, row.zip].filter(Boolean).join(" "),
                        ]
                          .filter(Boolean)
                          .join(", "),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {row.notes && (
                  <div className="mt-2 border-l-2 border-gray-200 pl-2 text-[11.5px] italic leading-relaxed text-gray-600">
                    {row.notes}
                  </div>
                )}
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

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing === "new" ? "Add Other Contact" : "Edit Contact"}
        description="Anyone connected to this lead who isn't an owner or relative."
        width={500}
      >
        {editing !== null && (
          <LeadPartyForm
            initial={editing === "new" ? null : editing}
            customRoles={sortedRoles}
            onManageRoles={() => setManagingRoles(true)}
            onCancel={close}
            onSave={save}
          />
        )}
      </Modal>

      {/* Manage Roles — single persistent modal. The body switches between
          the list view and the per-role replacement form so the user can
          manage as many roles as they want in one session without closing
          and re-opening the modal each time. */}
      <Modal
        open={managingRoles}
        onClose={() => {
          setManagingRoles(false);
          setRoleToReplace(null);
        }}
        title={
          roleToReplace
            ? `Delete "${roleToReplace}"`
            : "Manage Custom Roles"
        }
        description={
          roleToReplace
            ? "Pick where the contacts currently using this role should be moved. The role will be removed from the dropdown afterwards."
            : "Custom roles are shared across your organization. Deleting one prompts you to reassign every contact using it."
        }
        width={460}
      >
        {roleToReplace ? (
          <DeleteRoleForm
            label={roleToReplace}
            allCustomRoles={sortedRoles}
            usageCountOnThisLead={
              rows.filter(
                (r) => r.role === "other" && r.custom_role_label === roleToReplace
              ).length
            }
            onCancel={() => setRoleToReplace(null)}
            onConfirm={(replacement) =>
              applyRoleReplacement(roleToReplace, replacement)
            }
          />
        ) : sortedRoles.length === 0 ? (
          <>
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
              No custom roles yet. Pick &quot;+ Add new role&quot; in the Add
              Contact dropdown to create one.
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setManagingRoles(false)}
                className="rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="divide-y divide-gray-150">
              {sortedRoles.map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <span className="truncate text-[13px] text-ink">{label}</span>
                  <button
                    type="button"
                    onClick={() => setRoleToReplace(label)}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-surface px-2 py-[4px] text-[11px] font-medium text-gray-600 hover:border-danger hover:text-danger"
                  >
                    <IconTrash size={11} stroke={1.75} />
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setManagingRoles(false)}
                className="rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs text-ink hover:border-petrol-500"
              >
                Done
              </button>
            </div>
          </>
        )}
      </Modal>
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
  street: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

function LeadPartyForm({
  initial,
  customRoles,
  onManageRoles,
  onCancel,
  onSave,
}: {
  initial: LeadPartyRow | null;
  customRoles: string[];
  onManageRoles: () => void;
  onCancel: () => void;
  onSave: (form: LeadPartyFormValues) => void;
}) {
  // Selection model: a single dropdown shows built-in roles, then any custom
  // labels this org has used before, then "Other (Add New)" which reveals a
  // free-text field. Picking a previously-used custom label saves it again as
  // role='other' + custom_role_label=<label>, so it stays reusable.
  type SelectionValue = LeadPartyRole | `custom:${string}`;
  const initialSelection: SelectionValue =
    initial?.role === "other" && initial.custom_role_label
      ? `custom:${initial.custom_role_label}`
      : initial?.role ?? "attorney_for_owner";
  const [selection, setSelection] = useState<SelectionValue>(initialSelection);
  const showingCustomEntry = selection === "other";
  const [customLabel, setCustomLabel] = useState(
    initial?.role === "other" ? initial.custom_role_label ?? "" : ""
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [organization, setOrganization] = useState(initial?.organization ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [stateCode, setStateCode] = useState(initial?.state ?? "");
  const [zip, setZip] = useState(initial?.zip ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";

  // Built-in + custom roles merged into one alphabetized list. We display
  // them together so users don't have to scan two separate sections to find
  // the role they want.
  type RoleEntry = { value: SelectionValue; label: string; isCustom: boolean };
  const mergedRoles: RoleEntry[] = [
    ...BUILT_IN_ROLES.map((r) => ({
      value: r as SelectionValue,
      label: LEAD_PARTY_ROLE_LABELS[r],
      isCustom: false,
    })),
    ...customRoles.map((label) => ({
      value: `custom:${label}` as SelectionValue,
      label,
      isCustom: true,
    })),
  ].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-gray-500">
        Role
      </label>
      <select
        value={selection}
        onChange={(e) => setSelection(e.target.value as SelectionValue)}
        className={inputClass}
      >
        {mergedRoles.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
        <option disabled>──────────</option>
        <option value="other">+ Add new role</option>
      </select>

      {showingCustomEntry && (
        <input
          autoFocus
          type="text"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="Type the new role name"
          className={`${inputClass} mt-2`}
        />
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
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            placeholder="(555) 555-1234"
            className={inputClass}
          />
        </div>
      </div>

      <label className="mt-3 mb-1 block text-[11px] font-medium text-gray-500">
        Mailing Address
      </label>
      <input
        type="text"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        placeholder="Street"
        className={inputClass}
      />
      <div className="mt-2 grid grid-cols-[1fr_72px_120px] gap-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className={`${inputClass} min-w-0`}
        />
        <input
          type="text"
          value={stateCode}
          onChange={(e) =>
            setStateCode(e.target.value.toUpperCase().slice(0, 2))
          }
          placeholder="ST"
          maxLength={2}
          className={`${inputClass} min-w-0 uppercase`}
        />
        <input
          type="text"
          value={zip}
          onChange={(e) =>
            setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))
          }
          placeholder="ZIP"
          className={`${inputClass} min-w-0`}
        />
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
          onClick={() => {
            // Resolve the selection into (role, custom_role_label) for save.
            const role: LeadPartyRole = selection.startsWith("custom:")
              ? "other"
              : (selection as LeadPartyRole);
            const labelForCustom = selection.startsWith("custom:")
              ? selection.slice("custom:".length)
              : customLabel;
            onSave({
              role,
              custom_role_label: labelForCustom,
              name,
              organization,
              email,
              phone,
              street,
              city,
              state: stateCode,
              zip,
              notes,
            });
          }}
          disabled={
            !name.trim() ||
            (showingCustomEntry && !customLabel.trim())
          }
          className="rounded-md btn-primary px-3 py-[5px] text-xs font-medium text-white disabled:opacity-50"
        >
          {initial ? "Save Changes" : "Add Contact"}
        </button>
      </div>
    </div>
  );
}

// Choices the user can make when deleting a role: move to a built-in,
// re-tag to another custom label, or revert to plain "Other".
type ReplacementChoice =
  | { kind: "builtin"; role: LeadPartyRole }
  | { kind: "custom"; label: string }
  | { kind: "plain_other" };

function choiceKey(c: ReplacementChoice): string {
  if (c.kind === "builtin") return `builtin:${c.role}`;
  if (c.kind === "custom") return `custom:${c.label}`;
  return "plain_other";
}

function choiceFromKey(key: string): ReplacementChoice {
  if (key.startsWith("builtin:")) {
    return { kind: "builtin", role: key.slice("builtin:".length) as LeadPartyRole };
  }
  if (key.startsWith("custom:")) {
    return { kind: "custom", label: key.slice("custom:".length) };
  }
  return { kind: "plain_other" };
}

function DeleteRoleForm({
  label,
  allCustomRoles,
  usageCountOnThisLead,
  onCancel,
  onConfirm,
}: {
  label: string;
  allCustomRoles: string[];
  usageCountOnThisLead: number;
  onCancel: () => void;
  onConfirm: (replacement: ReplacementChoice) => void;
}) {
  // Merged + alphabetized replacement options, excluding the role being
  // deleted itself. Built-ins come from BUILT_IN_ROLES which is already
  // alphabetized.
  type Option = { key: string; label: string };
  const otherCustomRoles = allCustomRoles.filter((r) => r !== label);
  const options: Option[] = [
    ...BUILT_IN_ROLES.map((r) => ({
      key: choiceKey({ kind: "builtin", role: r }),
      label: LEAD_PARTY_ROLE_LABELS[r],
    })),
    ...otherCustomRoles.map((l) => ({
      key: choiceKey({ kind: "custom", label: l }),
      label: l,
    })),
  ].sort((a, b) => a.label.localeCompare(b.label));
  options.push({
    key: choiceKey({ kind: "plain_other" }),
    label: 'Plain "Other" (no label)',
  });

  const [selected, setSelected] = useState<string>(options[0].key);

  return (
    <div>
      {usageCountOnThisLead > 0 ? (
        <div className="mb-3 rounded-md border border-petrol-100 bg-petrol-50 px-3 py-2 text-[12px] text-petrol-700">
          <strong className="font-semibold">
            {usageCountOnThisLead} contact{usageCountOnThisLead === 1 ? "" : "s"}
          </strong>{" "}
          on this lead currently use this role. Org-wide the total is at least
          this many. Pick a replacement and every affected contact will be
          re-tagged in one step.
        </div>
      ) : (
        <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-gray-600">
          No contacts on this lead use this role. There may be matches on
          other leads — those will also be re-tagged.
        </div>
      )}

      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
        Move Contacts To
      </label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-surface px-3 py-[7px] text-[13px] text-ink outline-none focus:border-petrol-500"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-200 bg-surface px-3 py-[6px] text-xs text-ink hover:border-petrol-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(choiceFromKey(selected))}
          className="inline-flex items-center gap-1 rounded-md bg-danger px-4 py-[6px] text-xs font-medium text-white hover:bg-danger-strong"
        >
          <IconTrash size={11} stroke={1.75} />
          Delete &amp; Reassign
        </button>
      </div>
    </div>
  );
}
