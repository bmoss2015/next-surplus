"use client";

import { useRef, useState, useTransition } from "react";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import type { LeadDetailWithCounts, LienRow } from "@/lib/leads/fetch-detail";
import { updateLeadField, addDataSource, addLien, updateLien, removeLien } from "../_actions";
import { addLeadSource } from "../../../imports/_actions";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatCurrency, formatCurrencyOrDash, toTitleCase } from "@/lib/leads/format";
import { US_STATE_NAMES } from "@/lib/leads/types";
import { RECOVERY_TYPE_LABELS } from "@/lib/leads/recovery-type";
import { cn } from "@/lib/cn";
import { INLINE_INPUT_CLASS } from "@/lib/inline-field";
import { SectionSubheader } from "./SectionSubheader";
import { InlineTextField } from "./InlineTextField";

// Fix ZZZZ2 PART 2: default foreclosure process per state. Changing the state
// field re-applies this default to recovery_type (a state change is a deliberate
// reset). States that use either process depending on the instrument (SC, MA)
// default to non-judicial — the more common case for surplus recovery — and the
// user can still override recovery_type by hand afterward.
const STATE_RECOVERY_DEFAULT: Record<string, "judicial" | "non_judicial"> = {
  // Non-judicial (incl. SC and PA; MA below is overridden to non-judicial too):
  AL: "non_judicial", AK: "non_judicial", AR: "non_judicial", AZ: "non_judicial",
  CA: "non_judicial", CO: "non_judicial", DC: "non_judicial", GA: "non_judicial",
  ID: "non_judicial", MD: "non_judicial", MI: "non_judicial", MN: "non_judicial",
  MS: "non_judicial", MO: "non_judicial", MT: "non_judicial", NE: "non_judicial",
  NV: "non_judicial", NH: "non_judicial", NM: "non_judicial", NC: "non_judicial",
  OK: "non_judicial", OR: "non_judicial", RI: "non_judicial", SD: "non_judicial",
  TN: "non_judicial", TX: "non_judicial", UT: "non_judicial", VA: "non_judicial",
  WA: "non_judicial", WV: "non_judicial", WI: "non_judicial", WY: "non_judicial",
  SC: "non_judicial", PA: "non_judicial", MA: "non_judicial",
  // Judicial:
  CT: "judicial", DE: "judicial", FL: "judicial", HI: "judicial", IA: "judicial",
  IL: "judicial", IN: "judicial", KS: "judicial", KY: "judicial", LA: "judicial",
  ME: "judicial", NJ: "judicial", ND: "judicial", NY: "judicial", OH: "judicial",
  PR: "judicial", VT: "judicial",
};

// Fix FFFF2 / XXXX2: a Property Info tab — every property / sale-financial
// field on the lead, each inline editable (display as text, click to edit,
// commit on blur/Enter, revert on Escape). Lead Source and Data Source are
// dropdowns with "Add New"; State is a 50-state picker; Sale Type and Recovery
// Type are dropdowns (Recovery Type auto-derives from state + sale type unless
// overridden). Court Costs and Opening Bid no longer live here.

const SALE_TYPE_OPTIONS = [
  { value: "MTG", label: "Mortgage Foreclosure" },
  { value: "TAX", label: "Tax Sale" },
  { value: "unknown", label: "Unknown" },
];

// Always-offered Data Source presets; org-specific custom values come from the
// data_sources table and are appended after these.
const DATA_SOURCE_PRESETS = [
  "County Tax Sale",
  "Auction.com",
  "Bid4Assets",
  "Courthouse Steps",
  "RealAuction",
  "Manual Entry",
];

const STATE_CODES = Object.keys(US_STATE_NAMES).sort();

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const NOT_SET = "Not Set";
const DISPLAY_SET = "cursor-text rounded-[3px] px-0.5 text-[13px] font-medium text-[#0f1729] hover:bg-petrol-50";
const DISPLAY_UNSET = "cursor-text rounded-[3px] px-0.5 text-[13px] italic text-gray-400 hover:bg-petrol-50";

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
        className={cn(INLINE_INPUT_CLASS, "w-[200px] cursor-pointer")}
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
    <button type="button" onClick={() => setEditing(true)} title="Click To Edit" className={display ? DISPLAY_SET : DISPLAY_UNSET}>
      {display ?? NOT_SET}
    </button>
  );
}

// Fix XXXX2: State is a typed-but-constrained picker — a native select over the
// 50 states (you can type the first letter to jump); no free text. Fix ZZZZ2
// PART 2: the parent handles the commit so it can also re-derive recovery_type.
function InlineStateField({
  initial,
  onCommit,
}: {
  initial: string | null;
  onCommit: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState((initial ?? "").toUpperCase());

  function commit(next: string) {
    setEditing(false);
    if (next === value) return;
    setValue(next);
    onCommit(next || null);
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
            setValue((initial ?? "").toUpperCase());
            setEditing(false);
          }
        }}
        className={cn(INLINE_INPUT_CLASS, "w-[220px] cursor-pointer")}
      >
        <option value="">{NOT_SET}</option>
        {STATE_CODES.map((code) => (
          <option key={code} value={code}>
            {code} — {US_STATE_NAMES[code]}
          </option>
        ))}
      </select>
    );
  }
  return (
    <button type="button" onClick={() => setEditing(true)} title="Click To Edit" className={value ? DISPLAY_SET : DISPLAY_UNSET}>
      {value ? `${value}${US_STATE_NAMES[value] ? ` — ${US_STATE_NAMES[value]}` : ""}` : NOT_SET}
    </button>
  );
}

// Fix KKKKK / ZZZZ2 PART 2: Recovery Type defaults from the state (re-applied on
// every state change) but is also directly editable so the user can override —
// click to pick Judicial / Non Judicial / Unknown. Controlled by the parent.
function recoveryTypeLabel(v: string | null): string {
  if (v === "judicial" || v === "non_judicial") return RECOVERY_TYPE_LABELS[v];
  return "Unknown";
}
function InlineRecoveryTypeField({
  value,
  onCommit,
}: {
  value: string | null;
  onCommit: (value: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const current = value === "judicial" || value === "non_judicial" ? value : "unknown";

  function commit(next: string) {
    setEditing(false);
    if (next === current) return;
    onCommit(next || "unknown");
  }

  if (editing) {
    return (
      <select
        autoFocus
        value={current}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        className={cn(INLINE_INPUT_CLASS, "w-[200px] cursor-pointer")}
      >
        <option value="judicial">{RECOVERY_TYPE_LABELS.judicial}</option>
        <option value="non_judicial">{RECOVERY_TYPE_LABELS.non_judicial}</option>
        <option value="unknown">Unknown</option>
      </select>
    );
  }
  return (
    <button type="button" onClick={() => setEditing(true)} title="Click To Edit" className={DISPLAY_SET}>
      {recoveryTypeLabel(current)}
    </button>
  );
}

function InlineDateField({ leadId, field, initial }: { leadId: string; field: string; initial: string | null }) {
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
    <button type="button" onClick={() => setEditing(true)} title="Click To Edit" className={value ? DISPLAY_SET : DISPLAY_UNSET}>
      {value ? fmtDate(value) : NOT_SET}
    </button>
  );
}

function InlineCurrencyField({
  leadId,
  field,
  initial,
  dashForZero,
}: {
  leadId: string;
  field: string;
  initial: number | null;
  // Fix ZZZZ2 PART 7: show "—" instead of "$0" when this field's zero means
  // "not entered" (Tax / Mortgage Payoff, Opening Bid, …).
  dashForZero?: boolean;
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
  const display =
    value == null ? NOT_SET : dashForZero ? formatCurrencyOrDash(value) : formatCurrency(value);
  return (
    <button type="button" onClick={() => setEditing(true)} title="Click To Edit" className={value != null ? DISPLAY_SET : DISPLAY_UNSET}>
      {display}
    </button>
  );
}

// Fix JJJJ2 / XXXX2: a dropdown of preset + custom values with an "Add New"
// option that lets the user type and persist a new entry. Used for both Data
// Source and Lead Source (each backed by its own table).
const ADD_NEW = "__add_new__";

function InlineListField({
  initial,
  options,
  width,
  onSave,
  onAddNew,
}: {
  initial: string | null;
  options: string[];
  width: string;
  onSave: (value: string | null) => void;
  onAddNew: (name: string) => Promise<string | null>;
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
    onSave(next || null);
  }

  function commitNew() {
    const n = newName.trim();
    setAdding(false);
    setNewName("");
    if (!n) return;
    startTransition(async () => {
      const saved = await onAddNew(n);
      if (saved) {
        setOpts((prev) => (prev.includes(saved) ? prev : [...prev, saved]));
        setValue(saved);
        onSave(saved);
      }
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
        placeholder="New Name"
        className={cn(INLINE_INPUT_CLASS, width)}
      />
    );
  }
  if (editing) {
    return (
      <select
        autoFocus
        value={value}
        onChange={(e) => {
          if (e.target.value === ADD_NEW) {
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
        className={cn(INLINE_INPUT_CLASS, width, "cursor-pointer")}
      >
        <option value="">{NOT_SET}</option>
        {allOpts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={ADD_NEW}>+ Add New…</option>
      </select>
    );
  }
  return (
    <button type="button" onClick={() => setEditing(true)} title="Click To Edit" className={value ? DISPLAY_SET : DISPLAY_UNSET}>
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

// Fix MMMM2: the Liens editing area lives on the Property Info tab.
type LocalLien = LienRow & { _tempId?: string };

function LiensSection({ leadId, initialLiens }: { leadId: string; initialLiens: LienRow[] }) {
  const [liens, setLiens] = useState<LocalLien[]>(initialLiens);
  const [, startTransition] = useTransition();

  function onAddLien() {
    const tempId = `temp-${Date.now()}`;
    setLiens((prev) => [...prev, { id: tempId, _tempId: tempId, lead_id: leadId, name: "", amount: 0, position: prev.length }]);
    startTransition(async () => {
      const res = await addLien(leadId);
      if (res.ok) {
        setLiens((prev) => prev.map((l) => (l.id === tempId ? { ...l, id: res.id, _tempId: undefined } : l)));
      } else {
        setLiens((prev) => prev.filter((l) => l.id !== tempId));
      }
    });
  }
  function onLienName(id: string, name: string) {
    setLiens((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  }
  function commitLienName(id: string, name: string) {
    if (id.startsWith("temp-")) return;
    startTransition(async () => {
      await updateLien(id, leadId, { name });
    });
  }
  function commitLienAmount(id: string, amount: number | null) {
    setLiens((prev) => prev.map((l) => (l.id === id ? { ...l, amount: amount ?? 0 } : l)));
    if (id.startsWith("temp-")) return;
    startTransition(async () => {
      await updateLien(id, leadId, { amount });
    });
  }
  function onRemoveLien(id: string) {
    setLiens((prev) => prev.filter((l) => l.id !== id));
    if (id.startsWith("temp-")) return;
    startTransition(async () => {
      await removeLien(id, leadId);
    });
  }

  return (
    <div className="mt-4">
      <SectionSubheader>Liens</SectionSubheader>
      {liens.length === 0 ? (
        <div className="text-[13px] text-gray-400">No Liens On File.</div>
      ) : (
        <div className="space-y-2">
          {liens.map((lien) => (
            <div key={lien.id} className="flex items-center gap-2">
              <input
                type="text"
                value={lien.name}
                onChange={(e) => onLienName(lien.id, e.target.value)}
                onBlur={(e) => commitLienName(lien.id, e.target.value)}
                placeholder="Lien Name"
                className={cn(INLINE_INPUT_CLASS, "min-w-0 max-w-[300px] flex-1 placeholder:text-gray-400")}
              />
              <CurrencyInput
                value={lien.amount}
                onCommit={(n) => commitLienAmount(lien.id, n)}
                prefix="$"
                align="left"
                className={cn(INLINE_INPUT_CLASS, "inline-flex w-[130px] shrink-0 items-center gap-1")}
              />
              <button
                type="button"
                onClick={() => onRemoveLien(lien.id)}
                className="shrink-0 cursor-pointer rounded-md border border-gray-200 p-[5px] text-gray-400 hover:border-danger hover:text-danger"
                aria-label="Remove Lien"
              >
                <IconMinus size={13} stroke={2} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onAddLien}
        className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded border border-petrol-500 px-2 py-[3px] text-[11px] font-medium text-petrol-500 hover:bg-petrol-50"
      >
        <IconPlus size={12} stroke={2} />
        Add Lien
      </button>
    </div>
  );
}

export function PropertyInfoTab({
  lead,
  dataSources,
  leadSources,
}: {
  lead: LeadDetailWithCounts;
  dataSources: string[];
  leadSources: string[];
}) {
  const id = lead.id;
  const dataSourceOptions = [
    ...DATA_SOURCE_PRESETS,
    ...dataSources.filter((d) => !DATA_SOURCE_PRESETS.includes(d)),
  ];
  // Fix ZZZZ2 PART 2: recovery_type lives in local state so a user-initiated
  // state change can reset it to that state's default, with the change visible
  // immediately. It never auto-updates on load — only on an explicit edit.
  const [recoveryType, setRecoveryType] = useState<string | null>(lead.recovery_type);

  function handleStateChange(next: string | null) {
    void updateLeadField(id, "state", next);
    const code = (next ?? "").toUpperCase();
    const rt = code ? STATE_RECOVERY_DEFAULT[code] ?? null : null;
    if (rt && rt !== recoveryType) {
      setRecoveryType(rt);
      void updateLeadField(id, "recovery_type", rt);
    }
  }
  function handleRecoveryTypeChange(next: string | null) {
    setRecoveryType(next);
    void updateLeadField(id, "recovery_type", next || "unknown");
  }

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
          <InlineTextField leadId={id} field="county" initial={lead.county} placeholder={NOT_SET} displayFormat={toTitleCase} />
        </FieldRow>
        <FieldRow label="State">
          <InlineStateField initial={lead.state} onCommit={handleStateChange} />
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
          <InlineCurrencyField leadId={id} field="opening_bid" initial={lead.opening_bid} dashForZero />
        </FieldRow>
        <FieldRow label="Tax / Mortgage Payoff">
          <InlineCurrencyField leadId={id} field="outstanding_debt" initial={lead.outstanding_debt} dashForZero />
        </FieldRow>
        <FieldRow label="Recovery Type">
          <InlineRecoveryTypeField value={recoveryType} onCommit={handleRecoveryTypeChange} />
        </FieldRow>
        <FieldRow label="Lead Source">
          <InlineListField
            initial={lead.lead_source}
            options={leadSources}
            width="w-[220px]"
            onSave={(v) => {
              void updateLeadField(id, "lead_source", v);
            }}
            onAddNew={async (name) => {
              const res = await addLeadSource(name);
              return res.ok ? res.name : null;
            }}
          />
        </FieldRow>
        <FieldRow label="Data Source">
          <InlineListField
            initial={lead.data_source}
            options={dataSourceOptions}
            width="w-[220px]"
            onSave={(v) => {
              void updateLeadField(id, "data_source", v);
            }}
            onAddNew={async (name) => {
              const res = await addDataSource(name);
              return res.ok ? res.name : null;
            }}
          />
        </FieldRow>
      </div>

      <LiensSection leadId={id} initialLiens={lead.liens} />
    </div>
  );
}
