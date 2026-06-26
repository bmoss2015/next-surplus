"use client";

import { useState, useTransition } from "react";
import { IconUser } from "@tabler/icons-react";
import { assignLead } from "../_actions";
import { useRole } from "@/Components/RoleProvider";
import { SectionSubheader } from "./SectionSubheader";

// Fix 75: assign a lead to a team member. Admins can reassign anyone; non-admins
// only ever see leads already assigned to them, so for them this is read-only.
export function AssignToField({
  leadId,
  currentId,
  members,
}: {
  leadId: string;
  currentId: string | null;
  members: Array<{ id: string; fullName: string }>;
}) {
  const { isAdmin } = useRole();
  const [value, setValue] = useState<string>(currentId ?? "");
  const [, startTransition] = useTransition();

  const currentName =
    members.find((m) => m.id === value)?.fullName ?? "Unassigned";

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-4 shadow-card">
      <SectionSubheader className="flex items-center gap-1.5">
        <IconUser size={13} stroke={1.75} />
        Assigned To
      </SectionSubheader>
      {isAdmin ? (
        <select
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            startTransition(async () => {
              await assignLead(leadId, next === "" ? null : next);
            });
          }}
          className="w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none focus:border-petrol-500"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-[13px] font-medium text-ink">{currentName}</div>
      )}
    </div>
  );
}
