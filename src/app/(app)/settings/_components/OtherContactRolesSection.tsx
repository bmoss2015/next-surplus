"use client";

import { useMemo, useState, useTransition } from "react";
import {
  IconBuildingBank,
  IconTrash,
} from "@tabler/icons-react";
import { Modal } from "@/components/Modal";
import {
  LEAD_PARTY_ROLE_LABELS,
  type LeadPartyRole,
} from "@/lib/leads/lead-parties-types";
import {
  replaceCustomRole,
  type CustomRoleReplacement,
} from "@/app/(app)/leads/[id]/_lead-parties-actions";

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

// Settings home for the "Other Contacts" role list. Lists every custom role
// in the org with a Delete action. Delete prompts for a replacement so the
// rows currently using the role can be reassigned in one step instead of
// dumped into the catch-all "Other" bucket.
export function OtherContactRolesSection({
  initial,
}: {
  initial: string[];
}) {
  const [roles, setRoles] = useState<string[]>(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sortedRoles = useMemo(
    () => roles.slice().sort((a, b) => a.localeCompare(b)),
    [roles]
  );

  function confirmReplacement(replacement: CustomRoleReplacement) {
    const oldLabel = deleting;
    if (!oldLabel) return;
    setRoles((prev) => prev.filter((r) => r !== oldLabel));
    if (replacement.kind === "custom") {
      setRoles((prev) =>
        prev.includes(replacement.label) ? prev : [...prev, replacement.label]
      );
    }
    setDeleting(null);
    startTransition(async () => {
      await replaceCustomRole(oldLabel, replacement);
    });
  }

  return (
    <div className="col-span-2 rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="section-subheader m-0">Other Contact Roles</h2>
          <div className="mt-1 text-[12px] font-normal text-[#94a3b8]">
            Custom labels used across your org&apos;s Other Contacts dropdown.
            Roles are created when someone picks &quot;+ Add new role&quot; on
            an Other Contact. Delete to retire one — affected contacts get
            reassigned in one step.
          </div>
        </div>
      </div>

      {sortedRoles.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-[12px] text-gray-500">
          No custom roles yet. They appear here once a teammate adds one from a
          lead&apos;s Other Contacts section.
        </div>
      ) : (
        <ul className="divide-y divide-gray-150">
          {sortedRoles.map((label) => (
            <li
              key={label}
              className="flex items-center gap-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-petrol-50 text-petrol-500">
                <IconBuildingBank size={13} stroke={1.75} />
              </span>
              <span className="flex-1 truncate text-[13px] text-ink">
                {label}
              </span>
              <button
                type="button"
                onClick={() => setDeleting(label)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-200 bg-surface px-2.5 py-[5px] text-[11px] font-medium text-gray-600 hover:border-danger hover:text-danger"
              >
                <IconTrash size={11} stroke={1.75} />
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={deleting ? `Delete "${deleting}"` : ""}
        description="Pick where the contacts currently using this role should be moved. The role will be removed from the dropdown afterwards."
        width={460}
      >
        {deleting && (
          <DeleteRoleForm
            label={deleting}
            allCustomRoles={sortedRoles}
            onCancel={() => setDeleting(null)}
            onConfirm={confirmReplacement}
          />
        )}
      </Modal>
    </div>
  );
}

type ReplacementChoice = CustomRoleReplacement;

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
  onCancel,
  onConfirm,
}: {
  label: string;
  allCustomRoles: string[];
  onCancel: () => void;
  onConfirm: (replacement: ReplacementChoice) => void;
}) {
  type Option = { key: string; label: string };
  const otherCustom = allCustomRoles.filter((r) => r !== label);
  const options: Option[] = [
    ...BUILT_IN_ROLES.map((r) => ({
      key: choiceKey({ kind: "builtin", role: r }),
      label: LEAD_PARTY_ROLE_LABELS[r],
    })),
    ...otherCustom.map((l) => ({
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
      <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-gray-600">
        Every contact across your org currently tagged{" "}
        <strong className="font-semibold text-ink">{label}</strong> will be
        re-tagged in one step. Pick the destination role below.
      </div>

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
