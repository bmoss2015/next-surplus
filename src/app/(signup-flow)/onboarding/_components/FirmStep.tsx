"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "./StepShell";
import { saveFirmProfile } from "../_actions";

const STATES = [
  { code: "SC", label: "South Carolina" },
  { code: "TN", label: "Tennessee" },
  { code: "PA", label: "Pennsylvania" },
  { code: "OH", label: "Ohio" },
  { code: "NY", label: "New York" },
  { code: "OTHER", label: "Other" },
];

export function FirmStep({
  initialName,
  initialState,
}: {
  initialName: string;
  initialState: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [state, setState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canContinue = name.trim().length > 0 && state.length > 0;

  function next() {
    setError(null);
    startTransition(async () => {
      const result = await saveFirmProfile({ name, primaryState: state });
      if (result.ok) {
        router.push("/onboarding/import");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <StepShell
      step="firm"
      title="Tell Us About Your Firm"
      subtitle="We use this to set defaults for filings, mail, and templates. You can change anything later in Settings."
      primaryLabel="Continue"
      onPrimary={next}
      primaryDisabled={!canContinue}
      primaryPending={pending}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-[#374151]">
            Firm Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-[36px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c] outline-none focus:border-[#13644e]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-medium text-[#374151]">
            Primary State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="h-[36px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13.5px] text-[#04261c] outline-none focus:border-[#13644e]"
          >
            <option value="">Select a state</option>
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#9ca3af]">
            Used for default filing templates and county lookups.
          </p>
        </div>

        {error && (
          <div className="rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[12px] text-[#b91c1c]">
            {error}
          </div>
        )}
      </div>
    </StepShell>
  );
}
