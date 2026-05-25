"use client";

// Multi-select states picker. Used by the Attorney drawer + Research
// templates editor. Renders the 50 US states + DC as checkable chips
// plus an "All States" toggle that picks all 50 at once. Values are
// stored as two-letter codes in an array. The "All States" toggle is
// purely UX: when on, value becomes the full 51-code array; when off,
// value becomes empty.
//
// Design choice: no popover. The chip grid lives inline in the form
// since people usually pick 2-5 states (not 1 or all 50), and a popover
// adds clicks. The All States toggle is at the top for one-tap select.

import { useMemo } from "react";

export const US_STATES: Array<{ code: string; label: string }> = [
  { code: "AL", label: "Alabama" },
  { code: "AK", label: "Alaska" },
  { code: "AZ", label: "Arizona" },
  { code: "AR", label: "Arkansas" },
  { code: "CA", label: "California" },
  { code: "CO", label: "Colorado" },
  { code: "CT", label: "Connecticut" },
  { code: "DE", label: "Delaware" },
  { code: "DC", label: "District of Columbia" },
  { code: "FL", label: "Florida" },
  { code: "GA", label: "Georgia" },
  { code: "HI", label: "Hawaii" },
  { code: "ID", label: "Idaho" },
  { code: "IL", label: "Illinois" },
  { code: "IN", label: "Indiana" },
  { code: "IA", label: "Iowa" },
  { code: "KS", label: "Kansas" },
  { code: "KY", label: "Kentucky" },
  { code: "LA", label: "Louisiana" },
  { code: "ME", label: "Maine" },
  { code: "MD", label: "Maryland" },
  { code: "MA", label: "Massachusetts" },
  { code: "MI", label: "Michigan" },
  { code: "MN", label: "Minnesota" },
  { code: "MS", label: "Mississippi" },
  { code: "MO", label: "Missouri" },
  { code: "MT", label: "Montana" },
  { code: "NE", label: "Nebraska" },
  { code: "NV", label: "Nevada" },
  { code: "NH", label: "New Hampshire" },
  { code: "NJ", label: "New Jersey" },
  { code: "NM", label: "New Mexico" },
  { code: "NY", label: "New York" },
  { code: "NC", label: "North Carolina" },
  { code: "ND", label: "North Dakota" },
  { code: "OH", label: "Ohio" },
  { code: "OK", label: "Oklahoma" },
  { code: "OR", label: "Oregon" },
  { code: "PA", label: "Pennsylvania" },
  { code: "RI", label: "Rhode Island" },
  { code: "SC", label: "South Carolina" },
  { code: "SD", label: "South Dakota" },
  { code: "TN", label: "Tennessee" },
  { code: "TX", label: "Texas" },
  { code: "UT", label: "Utah" },
  { code: "VT", label: "Vermont" },
  { code: "VA", label: "Virginia" },
  { code: "WA", label: "Washington" },
  { code: "WV", label: "West Virginia" },
  { code: "WI", label: "Wisconsin" },
  { code: "WY", label: "Wyoming" },
];

const ALL_CODES = US_STATES.map((s) => s.code);

export function StatesPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = useMemo(() => new Set(value), [value]);
  const allSelected = value.length >= ALL_CODES.length;

  function toggle(code: string) {
    if (selected.has(code)) {
      onChange(value.filter((c) => c !== code));
    } else {
      onChange([...value, code].sort());
    }
  }

  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange([...ALL_CODES]);
  }

  return (
    <div>
      <label className="inline-flex items-center gap-2 cursor-pointer text-[12.5px] text-ink mb-2">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="cursor-pointer accent-petrol-500"
        />
        <span className="font-medium">All States (National coverage)</span>
        <span className="text-gray-500">— picks all 51 codes</span>
      </label>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))" }}
      >
        {US_STATES.map((s) => {
          const on = selected.has(s.code);
          return (
            <button
              key={s.code}
              type="button"
              onClick={() => toggle(s.code)}
              title={s.label}
              className={
                "cursor-pointer rounded-md border px-2 py-1 text-[11.5px] font-medium transition-colors " +
                (on
                  ? "border-petrol-500 bg-petrol-500 text-white"
                  : "border-gray-200 bg-white text-ink hover:border-petrol-500")
              }
            >
              {s.code}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-[11.5px] text-gray-500">
        {value.length === 0
          ? "No states selected."
          : allSelected
            ? "All 51 codes selected — displays as National."
            : `${value.length} selected: ${value.join(", ")}`}
      </div>
    </div>
  );
}
