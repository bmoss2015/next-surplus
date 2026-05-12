"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconAlertTriangle } from "@tabler/icons-react";
import { clearReviewFlag } from "../_actions";

// Fix RRRR: a persistent amber alert strip directly below the lead-detail
// header whenever the lead is flagged Needs Review. "Clear Flag" removes the
// flag (which also logs an activity) and the banner disappears on refresh.
export function NeedsReviewBanner({
  leadId,
  note,
}: {
  leadId: string;
  note: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function clear() {
    startTransition(async () => {
      const res = await clearReviewFlag(leadId);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-[#fcd34d] bg-[#fffbeb] px-4 py-3">
      <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-[#92400e]">
        <IconAlertTriangle size={16} stroke={1.75} className="shrink-0 text-[#d97706]" />
        <span className="truncate">
          This Lead Is Flagged For Review
          {note ? ` — ${note}` : ""}
        </span>
      </div>
      <button
        type="button"
        onClick={clear}
        disabled={pending}
        className="shrink-0 cursor-pointer rounded-md border border-[#d97706] bg-white px-3 py-[5px] text-[12px] font-medium text-[#92400e] hover:bg-[#fef3c7] disabled:opacity-50"
      >
        {pending ? "Clearing…" : "Clear Flag"}
      </button>
    </div>
  );
}
