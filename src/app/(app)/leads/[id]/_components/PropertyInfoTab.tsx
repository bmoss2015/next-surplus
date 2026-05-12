"use client";

import { useRef, useState, useTransition } from "react";
import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { updateLeadField, addDataSource } from "../_actions";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatCurrency } from "@/lib/leads/format";
import { cn } from "@/lib/cn";
import { INLINE_INPUT_CLASS } from "@/lib/inline-field";
import { SectionSubheader } from "./SectionSubheader";
import { InlineTextField } from "./InlineTextField";

// Fix FFFF2: a Property Info tab — every property / sale-financial field on the
// lead, each inline editable (display as text, click to edit, commit on
// blur/Enter, revert on Escape). The Overview tab no longer duplicates these.

const SALE_TYPE_OPTIONS = [
  { value: "TAX", label: "Tax Sale" },
  { value: "MTG", label: "Mortgage" },
  { value: "unknown", label: "Unknown" },
];
const RECOVERY_TYPE_OPTIONS = [
  { value: "judicial", label: "Judicial" },
  { value: "non_judicial", label: "Non Judicial" },
  { value: "unknown", label: "Unknown" },
];

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const NOT_SET = "Not Set";

function InlineSelectField({
  leadId,
  field,
  initial,
  options,
}: {
  leadId: string;
  field: string;
  initial: string | null;
  options: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? "");
  const [, startTransition] = useTransition();
  const label = options.find((o) => o.value === value)?.label;
  const display = label && value !== "unknown" ? label : value === "unknown" ? "Unknown" : null;

  function commit(next: string) {
    setEditing(false);
    if (next === (initial ?? "")) {
      setValue(initial ?? "");
      return;
    }
    setValue(next);
    startTransition(async () => {
      await updateLeadField(leadId, field, next || null);
    });
  }

  if (editing) {
    return (
      <select
        autoFocus
        value={value}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setValue(initial ?? "");
            setEditing(false);
          }
        }}
        className={cn(INLINE_INPUT_CLASS, "w-[180px] cursor-pointer")}
      >
        <option value="">{NOT_SET}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click To Edit"
      className={
        display
          ? "cursor-text rounded-[3px] px-0.5 text-[13px] font-medium text-[#0f1729] hover:bg-petrol-50"
          : "cursor-text rounded-[3px] px-0.5 text-[13px] italic text-gray-400 hover:bg-petrol-50"
      }
    >
      {display ?? NOT_SET}
    </button>
  );
}

function InlineDateField({
  leadId,
  field,
  initial,
}: {
  leadId: string;
  field: string;
  initial: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? "");
  const [, startTransition] = useTransition();
  const cancelNext = useRef(false);

  function commit() {
    setEditing(false);
    if (cancelNext.current) {
      cancelNext.current = false;
      setValue(initial ?? "");
      return;
    }
    if (value === (initial ?? "")) return;
    startTransition(async () => {
      await updateLeadField(leadId, field, value || null);
    });
  }

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          else if (e.key === "Escape") {
            cancelNext.current = true;
            e.currentTarget.blur();
          }
        }}
        className={cn(INLINE_INPUT_CLASS, "w-[170px] cursor-pointer")}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click To Edit"
      className={
        value
          ? "cursor-text rounded-[3px] px-0.5 text-[13px] font-medium text-[#0f1729] hover:bg-petrol-50"
          : "cursor-text rounded-[3px] px-0.5 text-[13px] italic text-gray-400 hover:bg-petrol-50"
      }
    >
      {value ? fmtDate(value) : NOT_SET}
    </button>
  );
}

function InlineCurrencyField({
  leadId,
  field,
  initial,
}: {
  leadId: string;
  field: string;
  initial: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<number | null>(initial);
  const [, startTransition] = useTransition();

  function commit(n: number | null) {
    setEditing(false);
    if (n === value) return;
    setValue(n);
    startTransition(async () => {
      await updateLeadField(leadId, field, n);
    });
  }

  if (editing) {
    return (
      <CurrencyInput
        value={value}
        onCommit={commit}
        prefix="$"
        align="left"
        placeholder="0"
        autoFocus
        className={cn(INLINE_INPUT_CLASS, "inline-flex w-[150px] items-center gap-1")}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click To Edit"
      className={
        value != null
          ? "cursor-text rounded-[3px] px-0.5 text-[13px] font-medium text-[#0f1729] hover:bg-petrol-50"
          : "cursor-text rounded-[3px] px-0.5 text-[13px] italic text-gray-400 hover:bg-petrol-50"
      }
    >
      {value != null ? formatCurrency(value) : NOT_SET}
    </button>
  );
}

// Fix JJJJ2: the Data Source field is a dropdown of preset + custom sources,
// with an "Add New" option that lets the user type and persist a new source.
const ADD_NEW_SOURCE = "__add_new_source__";

function InlineDataSourceField({
  leadId,
  initial,
  options,
}: {
  leadId: string;
  initial: string | null;
  options: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState(initial ?? "");
  const [newName, setNewName] = useState("");
  const [opts, setOpts] = useState(options);
  const [, startTransition] = useTransition();

  const allOpts = value && !opts.includes(value) ? [value, ...opts] : opts;

  function commitValue(next: string) {
    setEditing(false);
    if (next === value) return;
    setValue(next);
    startTransition(async () => {
      await updateLeadField(leadId, "data_source", next || null);
    });
  }

  function commitNew() {
    const n = newName.trim();
    if (!n) {
      setAdding(false);
      setNewName("");
      return;
    }
    startTransition(async () => {
      const res = await addDataSource(n);
      if (res.ok) {
        setOpts((prev) => (prev.includes(res.name) ? prev : [...prev, res.name].sort()));
        setValue(res.name);
        await updateLeadField(leadId, "data_source", res.name);
      }
      setAdding(false);
      setNewName("");
    });
  }

  if (adding) {
    return (
      <input
        type="text"
        autoFocus
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onBlur={commitNew}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          else if (e.key === "Escape") {
            setNewName("");
            setAdding(false);
          }
        }}
        placeholder="New Source Name"
        className={cn(INLINE_INPUT_CLASS, "w-[200px]")}
      />
    );
  }
  if (editing) {
    return (
      <select
        autoFocus
        value={value}
        onChange={(e) => {
          if (e.target.value === ADD_NEW_SOURCE) {
            setEditing(false);
            setAdding(true);
          } else {
            commitValue(e.target.value);
          }
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        className={cn(INLINE_INPUT_CLASS, "w-[200px] cursor-pointer")}
      >
        <option value="">{NOT_SET}</option>
        {allOpts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={ADD_NEW_SOURCE}>+ Add New…</option>
      </select>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click To Edit"
      className={
        value
          ? "cursor-text rounded-[3px] px-0.5 text-[13px] font-medium text-[#0f1729] hover:bg-petrol-50"
          : "cursor-text rounded-[3px] px-0.5 text-[13px] italic text-gray-400 hover:bg-petrol-50"
      }
    >
      {value || NOT_SET}
    </button>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-2 leading-[2]">
      <span className="text-[13px] font-medium text-[#64748b]">{label}</span>
      <span>{children}</span>
    </div>
  );
}

export function PropertyInfoTab({
  lead,
  dataSources,
}: {
  lead: LeadDetailWithCounts;
  dataSources: string[];
}) {
  const id = lead.id;
  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <SectionSubheader>Property Info</SectionSubheader>
      <div className="space-y-0">
        <FieldRow label="Parcel Number">
          <InlineTextField leadId={id} field="parcel_number" initial={lead.parcel_number} placeholder={NOT_SET} />
        </FieldRow>
        <FieldRow label="Case Number">
          <InlineTextField leadId={id} field="case_number" initial={lead.case_number} placeholder={NOT_SET} />
        </FieldRow>
        <FieldRow label="County">
          <InlineTextField leadId={id} field="county" initial={lead.county} placeholder={NOT_SET} />
        </FieldRow>
        <FieldRow label="State">
          <InlineTextField leadId={id} field="state" initial={lead.state} placeholder={NOT_SET} />
        </FieldRow>
        <FieldRow label="Sale Type">
          <InlineSelectField leadId={id} field="sale_type" initial={lead.sale_type} options={SALE_TYPE_OPTIONS} />
        </FieldRow>
        <FieldRow label="Sale Date">
          <InlineDateField leadId={id} field="sale_date" initial={lead.sale_date} />
        </FieldRow>
        <FieldRow label="Closing Bid">
          <InlineCurrencyField leadId={id} field="closing_bid" initial={lead.closing_bid} />
        </FieldRow>
        <FieldRow label="Opening Bid">
          <InlineCurrencyField leadId={id} field="opening_bid" initial={lead.opening_bid} />
        </FieldRow>
        <FieldRow label="Outstanding Debt">
          <InlineCurrencyField leadId={id} field="outstanding_debt" initial={lead.outstanding_debt} />
        </FieldRow>
        <FieldRow label="Court Costs And Fees">
          <InlineCurrencyField leadId={id} field="court_costs" initial={lead.court_costs} />
        </FieldRow>
        <FieldRow label="Recovery Type">
          <InlineSelectField leadId={id} field="recovery_type" initial={lead.recovery_type} options={RECOVERY_TYPE_OPTIONS} />
        </FieldRow>
        <FieldRow label="Lead Source">
          <InlineTextField leadId={id} field="lead_source" initial={lead.lead_source} placeholder={NOT_SET} />
        </FieldRow>
        <FieldRow label="Data Source">
          <InlineDataSourceField leadId={id} initial={lead.data_source} options={dataSources} />
        </FieldRow>
      </div>
    </div>
  );
}
