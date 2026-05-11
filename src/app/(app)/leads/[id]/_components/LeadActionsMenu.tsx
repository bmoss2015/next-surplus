"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { IconDots, IconArchive, IconArchiveOff } from "@tabler/icons-react";
import { setLeadArchived } from "../_actions";

export function LeadActionsMenu({
  leadId,
  archived,
}: {
  leadId: string;
  archived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggleArchived() {
    setOpen(false);
    startTransition(async () => {
      await setLeadArchived(leadId, !archived);
    });
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-label="Lead actions"
        className="cursor-pointer rounded-md border border-gray-200 bg-surface p-[6px] text-gray-500 hover:bg-gray-50 hover:text-ink disabled:opacity-50"
      >
        <IconDots size={16} stroke={1.75} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-[180px] overflow-hidden rounded-md border border-gray-200 bg-surface shadow-elevated">
          <button
            type="button"
            onClick={toggleArchived}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[12.5px] text-ink hover:bg-gray-50"
          >
            {archived ? (
              <>
                <IconArchiveOff size={15} stroke={1.75} /> Restore Lead
              </>
            ) : (
              <>
                <IconArchive size={15} stroke={1.75} /> Archive Lead
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
