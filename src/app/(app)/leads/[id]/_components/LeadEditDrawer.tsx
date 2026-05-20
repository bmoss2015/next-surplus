"use client";

import { useState, useTransition } from "react";
import { IconPencil } from "@tabler/icons-react";
import { Modal } from "@/components/Modal";
import { updateLeadCoreFields } from "../_actions";
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
  parcel_number: string | null;
};

const STATE_OPTIONS = Object.keys(US_STATE_NAMES).sort();
const SALE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "TAX", label: "Tax Sale" },
  { value: "MTG", label: "Mortgage" },
  { value: "unknown", label: "Unknown" },
];
// DB enum (migration 0072): ('judicial', 'non_judicial', 'unknown').
// Fix JJJJ3 PART 1: display label uses the canonical hyphenated "Non-Judicial".
const RECOVERY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "judicial", label: "Judicial" },
  { value: "non_judicial", label: "Non-Judicial" },
  { value: "unknown", label: "Unknown" },
];

function initialForm(lead: Lead) {
  return {
    address: lead.address ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
    zip: lead.zip ?? "",
    county: lead.county ?? "",
    sale_type: lead.sale_type ?? "unknown",
    sale_date: lead.sale_date ?? "",
    case_number: lead.case_number ?? "",
    recovery_type: lead.recovery_type ?? "unknown",
    parcel_number: lead.parcel_number ?? "",
  };
}

// Fix X: Edit Lead is a centered modal. No autosave — nothing is written until
// Save Changes is clicked; Cancel (or the X / clicking outside) closes and drops
// any unsaved edits.
// Fix QQ Patch: `variant="icon"` renders a small ghost pencil button for the
// lead-detail header's far-right action group; the default is the labeled button.
export function LeadEditDrawer({
  lead,
  variant = "button",
}: {
  lead: Lead;
  variant?: "button" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => initialForm(lead));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openModal() {
    setForm(initialForm(lead));
    setError(null);
    setOpen(true);
  }
  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function set<K extends keyof ReturnType<typeof initialForm>>(
    key: K,
    value: string
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateLeadCoreFields(lead.id, {
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        county: form.county.trim() || null,
        sale_type: form.sale_type,
        sale_date: form.sale_date.trim() || null,
        case_number: form.case_number.trim() || null,
        recovery_type: form.recovery_type || null,
        parcel_number: form.parcel_number.trim() || null,
      });
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={openModal}
          aria-label="Edit Lead"
          title="Edit Lead"
          className="shrink-0 cursor-pointer p-1 text-[#94a3b8] transition-colors hover:text-ink"
        >
          <IconPencil size={15} stroke={1.75} />
        </button>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12px] font-medium text-ink hover:border-petrol-500"
        >
          <IconPencil size={14} stroke={1.75} />
          Edit
        </button>
      )}

      <Modal open={open} onClose={close} title="Edit Lead" width={680}>
        <div className="space-y-4">
          <Field label="Street Address">
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City">
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="State">
              <select
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <Field label="Zip">
              <input
                type="text"
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="County">
              <input
                type="text"
                value={form.county}
                onChange={(e) => set("county", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sale Type">
              <select
                value={form.sale_type}
                onChange={(e) => set("sale_type", e.target.value)}
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
                onChange={(e) => set("sale_date", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Case Number">
              <input
                type="text"
                value={form.case_number}
                onChange={(e) => set("case_number", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Recovery Type">
              <select
                value={form.recovery_type}
                onChange={(e) => set("recovery_type", e.target.value)}
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

          <Field label="Parcel Number">
            <input
              type="text"
              value={form.parcel_number}
              onChange={(e) => set("parcel_number", e.target.value)}
              className={inputCls}
            />
          </Field>

          {error && <div className="text-[12px] text-danger">{error}</div>}

          <div className="mt-2 flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="cursor-pointer rounded-md border border-[#e2e8f0] bg-white px-4 py-2 text-[13px] font-medium text-ink hover:border-petrol-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="btn-primary rounded-md px-4 py-2 text-[13px] font-medium"
            >
              {pending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const inputCls =
  "w-full rounded-md border border-[#e2e8f0] bg-white px-2.5 py-[7px] text-[13px] text-ink outline-none focus:border-[#0d4b3a]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium tracking-[0.3px] text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}
