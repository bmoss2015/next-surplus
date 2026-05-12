"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// Fix 14: financial inputs show comma separators as the user types; the value
// passed back via onCommit is a plain number (or null when blank).

function formatTyped(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  let intPart = firstDot >= 0 ? cleaned.slice(0, firstDot) : cleaned;
  const decPart = firstDot >= 0 ? cleaned.slice(firstDot + 1).replace(/\./g, "") : null;
  intPart = intPart.replace(/^0+(?=\d)/, "");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decPart != null) return `${withCommas || "0"}.${decPart}`;
  return withCommas;
}

function parseValue(s: string): number | null {
  const trimmed = s.replace(/,/g, "").trim();
  if (trimmed === "" || trimmed === ".") return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function CurrencyInput({
  value,
  onCommit,
  prefix = "$",
  className,
  inputClassName,
  placeholder,
  disabled,
  align = "left",
  autoFocus,
}: {
  value: number | null | undefined;
  onCommit: (n: number | null) => void;
  prefix?: string | null;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  align?: "left" | "right";
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(value != null ? formatTyped(String(value)) : "");
  useEffect(() => {
    setText(value != null ? formatTyped(String(value)) : "");
  }, [value]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] focus-within:border-petrol-500",
        disabled && "opacity-60",
        className
      )}
    >
      {prefix && <span className="select-none text-[12.5px] text-gray-500">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={autoFocus ? (e) => e.currentTarget.select() : undefined}
        onChange={(e) => setText(formatTyped(e.target.value))}
        onBlur={() => onCommit(parseValue(text))}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className={cn(
          "w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-gray-400",
          align === "right" && "text-right",
          inputClassName
        )}
      />
    </span>
  );
}
