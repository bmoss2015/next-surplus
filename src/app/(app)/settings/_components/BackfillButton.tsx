"use client";

import { useState, useTransition } from "react";
import { runPhoneValidationBackfill } from "../_actions";

// One-shot admin button for the phone-validation backfill. Lives inside the
// Billing section. Fires runPhoneValidationBackfill() — the server action
// kicks off the sweep via after() and returns immediately. Progress shows up
// in the Billing meter on next page refresh as validations complete.
export function BackfillButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function start() {
    if (
      !window.confirm(
        "Validate every untested phone in this org (on non-lost leads)? Uses the HLR Lookup API credentials currently configured in env."
      )
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await runPhoneValidationBackfill();
      if (res.ok) {
        setMessage(
          "Backfill kicked off. Refresh in a minute or two to see the meter tick up."
        );
      } else {
        setMessage(`Failed: ${res.error}`);
      }
    });
  }

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-gray-150 pt-3">
      <button
        type="button"
        onClick={start}
        disabled={isPending}
        className="cursor-pointer rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Starting…" : "Run Backfill"}
      </button>
      <div className="text-[11px] text-gray-500">
        Validates every untested phone on non-lost leads in the background.
      </div>
      {message && (
        <div className="ml-auto text-[11px] text-petrol-700">{message}</div>
      )}
    </div>
  );
}
