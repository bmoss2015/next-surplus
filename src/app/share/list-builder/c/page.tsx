"use client";

import { useEffect, useRef, useState } from "react";
import { IconPlus, IconX, IconUserCircle, IconCheck } from "@tabler/icons-react";

type Field = {
  id: string;
  label: string;
  options: string[];
  multi: boolean;
};

const FIELDS: Field[] = [
  { id: "stage", label: "Stage", options: ["Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed"], multi: true },
  { id: "state", label: "State", options: ["TX", "NC", "AZ", "GA", "OH", "FL"], multi: true },
  { id: "county", label: "County", options: ["Travis", "Mecklenburg", "Maricopa", "Fulton", "Cuyahoga", "Harris"], multi: true },
  { id: "saleType", label: "Sale Type", options: ["Tax Sale", "Mortgage Foreclosure"], multi: true },
  { id: "ownerStatus", label: "Owner Status", options: ["Living", "Deceased"], multi: true },
  { id: "surplus", label: "Surplus", options: ["$20k+", "$50k+", "$100k+"], multi: false },
  { id: "lastTouched", label: "Last Touched", options: ["Never", "30+ Days", "60+ Days", "90+ Days"], multi: false },
  { id: "hasPhone", label: "Has Phone", options: ["Yes Only", "No Only"], multi: false },
  { id: "litigation", label: "Litigation", options: ["Skip Litigated"], multi: false },
];

const SAMPLE_LEADS = [
  { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
  { name: "Marcus Hayes Estate", county: "Mecklenburg, NC", surplus: "$31,640", status: "Deceased" },
  { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
  { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
];

export default function VariantC() {
  const [active, setActive] = useState<Record<string, string[]>>({
    stage: ["Researched"],
    state: ["TX"],
  });
  const [openChip, setOpenChip] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(t)) setOpenChip(null);
      if (addRef.current && !addRef.current.contains(t)) setAddOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const activeFields = FIELDS.filter((f) => active[f.id]?.length);
  const inactiveFields = FIELDS.filter((f) => !active[f.id]?.length);
  const filterCount = activeFields.length;
  const leadCount = filterCount === 0 ? 124 : Math.max(124 - filterCount * 15, 12);

  function toggleValue(fieldId: string, value: string, multi: boolean) {
    setActive((prev) => {
      const current = prev[fieldId] ?? [];
      if (!multi) {
        return { ...prev, [fieldId]: current.includes(value) ? [] : [value] };
      }
      return {
        ...prev,
        [fieldId]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  }

  function removeField(fieldId: string) {
    setActive((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setOpenChip(null);
  }

  function addField(fieldId: string) {
    setActive((prev) => ({ ...prev, [fieldId]: [] }));
    setOpenChip(fieldId);
    setAddOpen(false);
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-10">
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Variant C · Horizontal Chip Bar · Linear / Notion
        </div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          Build A Calling List
        </h1>
        <div className="mt-1 text-[12.5px] text-[#6b7280]">
          Click any chip to multi‑select values inline. Click + to add another filter.
        </div>
      </div>

      <div
        className="rounded-[12px] bg-white p-5"
        style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)" }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFields.map((f) => {
            const values = active[f.id] ?? [];
            const display = values.length === 0 ? "Any" : values.length === 1 ? values[0] : `${values[0]} +${values.length - 1}`;
            return (
              <div key={f.id} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenChip(openChip === f.id ? null : f.id)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#0f1729] bg-white py-1.5 pl-3 pr-2 text-[12.5px] transition hover:bg-[#fbfbfc]"
                >
                  <span className="font-medium text-[#9ca3af]">{f.label}:</span>
                  <span className="font-semibold text-[#0f1729]">{display}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeField(f.id);
                    }}
                    className="ml-0.5 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-[#9ca3af] hover:bg-[#f1f2f4] hover:text-[#0f1729]"
                  >
                    <IconX size={11} stroke={2.25} />
                  </span>
                </button>

                {openChip === f.id && (
                  <div
                    ref={popoverRef}
                    className="absolute left-0 top-full z-20 mt-1 w-[240px] overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white"
                    style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18)" }}
                  >
                    <div className="border-b border-[#f1f2f4] px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                        {f.label}
                      </div>
                      <div className="text-[11px] text-[#6b7280]">
                        {f.multi ? "Pick one or more" : "Pick one"}
                      </div>
                    </div>
                    <div className="max-h-[240px] overflow-y-auto py-1">
                      {f.options.map((opt) => {
                        const checked = values.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => toggleValue(f.id, opt, f.multi)}
                            className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-[12.5px] text-[#374151] transition hover:bg-[#f7f8f9]"
                          >
                            <span className={checked ? "font-semibold text-[#0f1729]" : "font-medium"}>{opt}</span>
                            {checked && <IconCheck size={12} stroke={2.5} className="text-[#13644e]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div ref={addRef} className="relative">
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-[#9ca3af] px-2.5 py-1.5 text-[12.5px] font-medium text-[#6b7280] transition hover:border-[#0f1729] hover:text-[#0f1729]"
            >
              <IconPlus size={12} stroke={2.5} />
              Add Filter
            </button>

            {addOpen && (
              <div
                className="absolute left-0 top-full z-20 mt-1 w-[200px] overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white"
                style={{ boxShadow: "0 12px 32px -8px rgba(15,23,41,0.18)" }}
              >
                <div className="border-b border-[#f1f2f4] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                  Add A Filter
                </div>
                <div className="max-h-[260px] overflow-y-auto py-1">
                  {inactiveFields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => addField(f.id)}
                      className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-[12.5px] font-medium text-[#374151] transition hover:bg-[#f7f8f9]"
                    >
                      {f.label}
                    </button>
                  ))}
                  {inactiveFields.length === 0 && (
                    <div className="px-3 py-3 text-center text-[11.5px] text-[#9ca3af]">
                      All filters in use
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-baseline justify-between border-t border-[#f1f2f4] pt-4">
          <div>
            <div className="text-[28px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
              {leadCount} <span className="text-[14px] font-medium text-[#6b7280]">Leads</span>
            </div>
            <div className="text-[11.5px] text-[#9ca3af]">{filterCount} filters applied</div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#f1f2f4] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
            First In Queue
          </div>
          <div className="divide-y divide-[#f1f2f4]">
            {SAMPLE_LEADS.slice(0, 5).map((l) => (
              <div key={l.name} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f7f8f9] text-[#9ca3af]">
                  <IconUserCircle size={18} stroke={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-[#0f1729]">{l.name}</div>
                  <div className="text-[11px] text-[#6b7280]">{l.county} &middot; {l.status}</div>
                </div>
                <div className="text-[12px] font-semibold tabular-nums text-[#0f1729]">{l.surplus}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-[#f1f2f4] pt-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name This List"
            className="h-10 flex-1 rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
          />
          <button
            type="button"
            className="h-10 cursor-pointer rounded-md border border-[#e5e7eb] bg-white px-4 text-[12.5px] font-medium text-[#374151] transition hover:border-[#0f1729]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            className="h-10 cursor-pointer rounded-md bg-gradient-to-r from-[#0a3d4a] to-[#13644e] px-5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.20)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save &amp; Use ({leadCount})
          </button>
        </div>
      </div>
    </div>
  );
}
