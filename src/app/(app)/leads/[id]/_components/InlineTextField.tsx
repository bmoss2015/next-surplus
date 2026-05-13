"use client";

import { useRef, useState, useTransition } from "react";
import { updateLeadField } from "../_actions";
import { cn } from "@/lib/cn";
import { INLINE_INPUT_CLASS } from "@/lib/inline-field";

// Fix VVVV: a plain-text inline editor matching the surplus-field pattern —
// displays as text until clicked, becomes an input on click, commits on blur or
// Enter, reverts on Escape. No edit button, no modal.
export function InlineTextField({
  leadId,
  field,
  initial,
  placeholder = "Not Set",
  displayFormat,
}: {
  leadId: string;
  field: string;
  initial: string | null;
  placeholder?: string;
  // Optional transform applied to the *displayed* value only (e.g. Proper Case
  // for County). The raw stored value is still what gets edited and persisted.
  displayFormat?: (value: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [, startTransition] = useTransition();
  const cancelNext = useRef(false);

  function startEdit() {
    setText(saved);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    if (cancelNext.current) {
      cancelNext.current = false;
      setText(saved);
      return;
    }
    const next = text.trim();
    if (next === saved.trim()) {
      setText(saved);
      return;
    }
    setSaved(next);
    setText(next);
    startTransition(async () => {
      await updateLeadField(leadId, field, next || null);
    });
  }

  if (editing) {
    return (
      <input
        type="text"
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
        className={cn(INLINE_INPUT_CLASS, "w-[150px] text-right")}
      />
    );
  }

  const display = saved.trim() ? (displayFormat ? displayFormat(saved.trim()) : saved.trim()) : "";
  return (
    <button
      type="button"
      onClick={startEdit}
      title="Click To Edit"
      // Fix SSSS3: Property Info values match the rest of the app's
      // read-only fields — text-sm, font-normal. InlineTextField is only
      // consumed by Property Info today, so the change stays scoped.
      className={
        display
          ? "cursor-text rounded-[3px] px-0.5 text-sm font-normal text-[#0f1729] hover:bg-petrol-50"
          : "cursor-text rounded-[3px] px-0.5 text-sm italic text-gray-400 hover:bg-petrol-50"
      }
    >
      {display || placeholder}
    </button>
  );
}
