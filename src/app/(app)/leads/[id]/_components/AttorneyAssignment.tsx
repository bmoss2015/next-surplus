"use client";

import { useState, useTransition } from "react";
import { updateLeadField } from "../_actions";

export type AttorneyOption = { id: string; name: string };

export function AttorneyAssignment({
  leadId,
  attorneys,
  currentAttorneyId,
}: {
  leadId: string;
  attorneys: AttorneyOption[];
  currentAttorneyId: string | null;
}) {
  const [value, setValue] = useState(currentAttorneyId ?? "");
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    setValue(next);
    startTransition(async () => {
      await updateLeadField(leadId, "attorney_id", next || null);
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => change(e.target.value)}
      disabled={pending}
      className="w-[220px] cursor-pointer rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none focus:border-petrol-500 disabled:opacity-60"
    >
      <option value="">Not Assigned</option>
      {attorneys.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}
