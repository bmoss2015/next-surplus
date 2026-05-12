"use client";

import { useRef, useState, useTransition } from "react";
import { IconPencil } from "@tabler/icons-react";
import { updateLeadField } from "../_actions";

function asNumber(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

// Fix Y: the recovery fee reads as a teal pill ("33%"). Click it and the pill
// turns into an inline editor with a teal focus ring; blur or Enter commits,
// Escape or Tab reverts.
export function RecoveryFeeField({
  leadId,
  initial,
}: {
  leadId: string;
  initial: number;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(initial));
  const [saved, setSaved] = useState(initial);
  const [, startTransition] = useTransition();
  const cancelNext = useRef(false);

  function startEdit() {
    setText(String(saved));
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (cancelNext.current) {
      cancelNext.current = false;
      setText(String(saved));
      return;
    }
    const n = asNumber(text);
    if (n == null || n < 0 || n > 100) {
      setText(String(saved));
      return;
    }
    if (n === saved) {
      setText(String(saved));
      return;
    }
    setSaved(n);
    setText(String(n));
    startTransition(async () => {
      await updateLeadField(leadId, "recovery_fee_percent", n);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] tracking-[0.4px] text-gray-500">
        Recovery Fee
      </span>
      <div className="group flex items-center gap-1.5">
        {editing ? (
          <span className="inline-flex items-center rounded-[20px] bg-gradient-to-br from-[#0a3d4a] to-[#0d6c7d] py-[4px] pl-[14px] pr-[11px] text-[14px] font-semibold text-white ring-2 ring-[#0d6c7d]/45">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={text}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setText(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  cancelNext.current = true;
                  e.currentTarget.blur();
                } else if (e.key === "Tab") {
                  cancelNext.current = true;
                }
              }}
              className="w-[34px] bg-transparent text-right font-semibold text-white outline-none"
            />
            <span className="ml-[1px]">%</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            title="Edit recovery fee"
            className="inline-flex cursor-text items-center rounded-[20px] bg-gradient-to-br from-[#0a3d4a] to-[#0d6c7d] px-[14px] py-[4px] text-[14px] font-semibold text-white transition-colors hover:from-[#0d6c7d] hover:to-[#1a8a9c]"
          >
            {saved}%
          </button>
        )}
        {!editing && (
          <IconPencil
            size={13}
            stroke={1.75}
            className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}
