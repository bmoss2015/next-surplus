"use client";

import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { NewLeadDrawer } from "./NewLeadDrawer";

export function LeadsActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md btn-primary px-3 py-[6px] text-xs font-medium text-white"
      >
        <IconPlus size={13} stroke={2} />
        New Lead
      </button>
      <NewLeadDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
