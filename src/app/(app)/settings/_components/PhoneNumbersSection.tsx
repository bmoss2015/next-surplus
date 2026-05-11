"use client";

import { useState, useTransition } from "react";
import { setStatePhoneNumber } from "../_actions";
import { US_STATE_NAMES } from "@/lib/leads/types";
import type { StatePhoneRow } from "@/lib/settings/fetch";

// Fix 66 — one row per US state with a manually entered outbound number.
// Data only; no Twilio API calls. Saves on blur (upsert by org + state).

const STATE_CODES = Object.keys(US_STATE_NAMES).sort((a, b) =>
  US_STATE_NAMES[a].localeCompare(US_STATE_NAMES[b])
);

// Display helper — formats a 10-digit number as (555) 555-5555; otherwise
// leaves the input untouched so partial / non-standard entries still work.
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return raw;
}

export function PhoneNumbersSection({ initial }: { initial: StatePhoneRow[] }) {
  const byState = new Map(initial.map((r) => [r.state, r.phone ?? ""]));

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h2 className="m-0 text-[14px] font-medium text-ink">Phone Numbers</h2>
        <div className="mt-[2px] text-[11px] text-gray-500">
          Outbound Numbers By State. Twilio Integration Coming In v0.5.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {STATE_CODES.map((code) => (
          <PhoneRow
            key={code}
            code={code}
            name={US_STATE_NAMES[code]}
            initialPhone={byState.get(code) ?? ""}
          />
        ))}
      </div>
    </div>
  );
}

function PhoneRow({
  code,
  name,
  initialPhone,
}: {
  code: string;
  name: string;
  initialPhone: string;
}) {
  const [phone, setPhone] = useState(formatPhoneDisplay(initialPhone));
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function commit() {
    const next = phone.trim();
    startTransition(async () => {
      const res = await setStatePhoneNumber(code, next || null);
      if (res.ok) setSavedAt(new Date().toLocaleTimeString());
    });
  }

  return (
    <div className="flex items-center gap-3 py-[3px]">
      <div className="w-40 shrink-0 text-[12.5px] text-ink">{name}</div>
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={() => {
          setPhone(formatPhoneDisplay(phone));
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="(555) 555-5555"
        className="flex-1 rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
      />
      <span className="w-12 shrink-0 text-right text-[10px] text-gray-400">
        {pending ? "Saving" : savedAt ? "Saved" : ""}
      </span>
    </div>
  );
}
