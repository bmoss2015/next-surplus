"use client";

import { useState, useTransition } from "react";
import { IconPencil } from "@tabler/icons-react";
import { Drawer } from "@/components/Drawer";
import { updateLeadField } from "../_actions";
import { US_STATE_NAMES } from "@/lib/leads/types";

type Lead = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  sale_type: string;
  sale_date: string | null;
  case_number: string | null;
  recovery_type: string | null;
};

const STATE_OPTIONS = Object.keys(US_STATE_NAMES).sort();
const SALE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "TAX", label: "Tax Sale" },
  { value: "MTG", label: "Mortgage" },
  { value: "unknown", label: "Unknown" },
];
const RECOVERY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Unknown" },
  { value: "judicial", label: "Judicial" },
  { value: "nonjudicial", label: "Nonjudicial" },
];

export function LeadEditDrawer({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const [form, setForm] = useState({
    address: lead.address ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
    zip: lead.zip ?? "",
    county: lead.county ?? "",
    sale_type: lead.sale_type ?? "unknown",
    sale_date: lead.sale_date ?? "",
    case_number: lead.case_number ?? "",
    recovery_type: lead.recovery_type ?? "",
  });

  function save(field: keyof typeof form, raw: string) {
    const value =
      field === "sale_date" || field === "county" || field === "case_number"
        ? raw.trim() || null
        : field === "recovery_type"
          ? raw || null
          : raw;
    startTransition(async () => {
      await updateLeadField(lead.id, field, value);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12px] font-medium text-ink hover:border-petrol-500"
      >
        <IconPencil size={14} stroke={1.75} />
        Edit
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Lead Details"
        description="Changes Save Automatically."
        width={460}
      >
        <div className="space-y-4">
          <Field label="Street Address">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              onBlur={(e) => save("address", e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                onBlur={(e) => save("city", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="State">
              <select
                value={form.state}
                onChange={(e) => {
                  setForm((f) => ({ ...f, state: e.target.value }));
                  save("state", e.target.value);
                }}
                className={inputCls}
              >
                {STATE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Zip">
              <input
                type="text"
                value={form.zip}
                onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                onBlur={(e) => save("zip", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="County">
              <input
                type="text"
                value={form.county}
                onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                onBlur={(e) => save("county", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale Type">
              <select
                value={form.sale_type}
                onChange={(e) => {
                  setForm((f) => ({ ...f, sale_type: e.target.value }));
                  save("sale_type", e.target.value);
                }}
                className={inputCls}
              >
                {SALE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sale Date">
              <input
                type="date"
                value={form.sale_date}
                onChange={(e) => {
                  setForm((f) => ({ ...f, sale_date: e.target.value }));
                  save("sale_date", e.target.value);
                }}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Case Number">
            <input
              type="text"
              value={form.case_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, case_number: e.target.value }))
              }
              onBlur={(e) => save("case_number", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Recovery Type">
            <select
              value={form.recovery_type}
              onChange={(e) => {
                setForm((f) => ({ ...f, recovery_type: e.target.value }));
                save("recovery_type", e.target.value);
              }}
              className={inputCls}
            >
              {RECOVERY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Drawer>
    </>
  );
}

const inputCls =
  "w-full cursor-pointer rounded-md border border-gray-200 bg-surface px-2.5 py-[7px] text-[13px] text-ink outline-none focus:border-petrol-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] tracking-[0.5px] font-medium text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}
