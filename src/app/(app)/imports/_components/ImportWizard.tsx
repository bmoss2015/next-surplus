"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import {
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconX,
  IconSearch,
} from "@tabler/icons-react";
import {
  checkDuplicates,
  importLeads,
  fetchLeadSources,
  addLeadSource,
  fetchSourceMapping,
  saveSourceMapping,
  previewRevertImport,
  revertImport,
  fetchLeadsForReplaceSelect,
  type ImportSourceMode,
} from "../_actions";
import {
  autoMapHeaders,
  normalizeHeader,
  PORTAL_FIELDS,
  REQUIRED_PORTAL_FIELD_KEYS,
  portalFieldLabel,
  OTHER_SOURCE_OPTION,
  DEFAULT_DUPLICATE_RESOLUTION,
  duplicateResolutionLabel,
  relativeFieldKey,
  RELATIVE_COUNT,
  RELATIVE_PHONE_COUNT,
  RELATIVE_EMAIL_COUNT,
  parsePhoneType,
  parseImportFlag,
  normalizePhoneStrict,
  parseImportDate,
  stripCaseNumber,
  padZip,
  stripCountySuffix,
  type IncomingLead,
  type ImportRelative,
  type ImportPhone,
  type ImportSaleType,
  type ImportHistoryRow,
  type DuplicateResolution,
  type ImportRowDecision,
  SELECTABLE_REPLACE_FIELDS,
  REPLACE_FIELD_LABELS,
  type SelectableReplaceField,
} from "../_shared";
import { formatCurrencyOrDash } from "@/lib/leads/format";
import { formatRecoveryType } from "@/lib/leads/recovery-type";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatAddress, formatCity } from "@/lib/imports/format-address";
import { toTitleCase } from "@/lib/leads/format";
import { US_STATE_NAMES } from "@/lib/leads/types";

type Step =
  | "upload"
  | "map" // Page 1: confirm the auto-mapped columns
  | "unrecognized" // Page 2: review the columns we could not auto-map
  | "change_prompt" // optional: "Update Saved Mapping For X?"
  | "preview"
  // Fix VVVV3: a per-replace-row field selection screen, shown only when the
  // dedupe step has at least one row resolved to "Replace existing data".
  | "replace_select";

const DISMISS_VALUE = "__dismiss__";

// Fix NNNN: sentinel <select> value for "Use Lead Source In File" — the default
// lead-source mode, which reads each row's mapped column and leaves the field
// null when the row has no value (no batch fallback).
const USE_FILE_SOURCE = "__use_file_source__";
const USE_FILE_SOURCE_LABEL = "Lead Source In File";

type LeadSourceConfig = {
  mode: ImportSourceMode;
  source: string | null; // concrete source for "fallback" / "force", null for "file"
  mappingKey: string; // key under which this source's column mapping is remembered
};

// Fix P: a CSV row that failed validation on the preview step. `rowNumber` is
// the 1-based position in the file (header row excluded).
type PreviewInvalidRow = {
  rowNumber: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  missing: string[];
};

// Fix 8 / Fix P: normalize a state value to a 2-letter code so the same state
// always groups together (and shows up in the Leads state filter). Full names
// like "Maryland" map to "MD"; 2-letter codes pass through; anything else
// keeps its first two characters as a last resort.
const STATE_NAME_TO_CODE = new Map(
  Object.entries(US_STATE_NAMES).map(([code, name]) => [name.toUpperCase(), code])
);
function normalizeStateCode(raw: string): string {
  const v = (raw ?? "").trim().toUpperCase();
  if (!v) return "";
  if (v.length === 2) return v;
  return STATE_NAME_TO_CODE.get(v) ?? v.slice(0, 2);
}

// Fix E / Fix H: column-mapping lists are chunked so the user never faces a
// wall of 100+ rows. Recognized columns (step 1) page at 15; unrecognized
// columns still needing review (step 2) page at 10.
const RECOGNIZED_PAGE_SIZE = 15;
const UNRECOGNIZED_PAGE_SIZE = 10;
function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): { pageItems: T[]; pageCount: number; currentPage: number; start: number } {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    pageCount,
    currentPage,
    start,
  };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function mappedHeaders(mapping: Record<string, string>): Set<string> {
  return new Set(Object.values(mapping).filter(Boolean));
}

function parseMoney(raw: string): number | null {
  if (!raw) return null;
  // Accounting-style "(75,000.00)" means a negative amount — flag it before
  // stripping the parens so the downstream "<= 0" guard nulls + logs it.
  const negative = /^\s*\(/.test(raw);
  const n = parseFloat(raw.replace(/[$,\s()]/g, ""));
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

function parseSaleType(raw: string): ImportSaleType {
  const v = raw.trim().toLowerCase();
  if (!v) return "unknown";
  // Any value mentioning "tax" -> TAX; "mortgage" / "deed of trust" -> MTG.
  // (Also accept the bare codes a previously-exported file may already carry.)
  if (v === "tax" || v.includes("tax")) return "TAX";
  if (v === "mtg" || v.includes("mortgage") || v.includes("deed of trust")) return "MTG";
  // The sale_type column is an enum (TAX | MTG | unknown), so an unrecognized
  // value can't be stored verbatim — record it as "unknown" and log the value.
  console.warn(`[import] Unrecognized sale type: ${raw}`);
  return "unknown";
}

// "SMITH, JOHN" -> "JOHN SMITH" (Last, First -> First Last); otherwise just
// collapse internal whitespace. Proper Case is applied separately by the caller.
function splitFullName(name: string): string {
  const v = name.trim().replace(/\s+/g, " ");
  if (v.includes(",")) {
    const idx = v.indexOf(",");
    const last = v.slice(0, idx).trim();
    const first = v.slice(idx + 1).trim();
    return [first, last].filter(Boolean).join(" ");
  }
  return v;
}

// Generational / honorific suffixes that may trail a full-name column. The
// normalized form is re-appended after Proper Case so "III" never becomes "Iii".
const NAME_SUFFIXES: Record<string, string> = {
  jr: "Jr",
  sr: "Sr",
  ii: "II",
  iii: "III",
  iv: "IV",
  esq: "Esq",
};
// "JOHN SMITH JR" -> { name: "JOHN SMITH", suffix: "Jr" }. Returns an empty
// suffix when there isn't one (or when stripping it would leave nothing).
function splitNameSuffix(name: string): { name: string; suffix: string } {
  const m = name.trim().match(/^(.*?)[\s,]+(jr|sr|ii|iii|iv|esq)\.?$/i);
  if (!m || !m[1].trim()) return { name: name.trim(), suffix: "" };
  return { name: m[1].trim(), suffix: NAME_SUFFIXES[m[2].toLowerCase()] ?? "" };
}
function combineName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ");
}
// Fix PPPP2 PART 6: imported names arrive in mixed/lower case — Title Case each
// word (also handles hyphenated names).
function properCaseName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
        .join("-")
    )
    .join(" ");
}
function parseAge(raw: string): number | null {
  if (!raw) return null;
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 && n < 130 ? n : null;
}
function isYes(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return (
    v === "y" || v === "yes" || v === "true" || v === "t" || v === "1" || v === "x"
  );
}

function sameMapping(a: Record<string, string>, b: Record<string, string>): boolean {
  const ak = Object.keys(a).filter((k) => a[k]);
  const bk = Object.keys(b).filter((k) => b[k]);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => a[k] === b[k]);
}
function sameList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((x) => bs.has(x));
}

// Which portal field a given CSV header is currently mapped to ("" if none).
function fieldForHeader(mapping: Record<string, string>, header: string): string {
  return Object.keys(mapping).find((k) => mapping[k] === header) ?? "";
}

// ---------------------------------------------------------------------------
// Progress indicator — visible at the top of every step.
// ---------------------------------------------------------------------------

const PROGRESS_STEPS: { key: Step | "map_group"; label: string }[] = [
  { key: "upload", label: "Upload File" },
  { key: "map_group", label: "Map Columns" },
  { key: "preview", label: "Preview And Import" },
];

function progressIndex(step: Step): number {
  if (step === "upload") return 0;
  if (step === "preview" || step === "replace_select") return 2;
  return 1; // map / unrecognized / change_prompt all live in "Map Columns"
}

// Fix VVVV3: format a comparison value for the "Select Fields to Replace"
// screen. Both the existing-lead row (from the DB) and the parsed CSV row
// (IncomingLead) feed into this — the shapes line up for every field except
// currency (DB returns numeric, IncomingLead is already number-or-null).
function fmtReplaceComparison(field: string, value: unknown): string {
  if (value == null || value === "") return "—";
  switch (field) {
    case "closing_bid":
    case "opening_bid":
    case "outstanding_debt":
    case "source_surplus": {
      const n =
        typeof value === "string" ? parseFloat(value) : (value as number);
      return Number.isFinite(n) ? formatCurrencyOrDash(n) : "—";
    }
    case "recovery_type":
      return formatRecoveryType(value as string | null);
    case "sale_type": {
      const sv = String(value).toUpperCase();
      if (sv === "TAX") return "Tax Sale";
      if (sv === "MTG") return "Mortgage Foreclosure";
      return "Unknown";
    }
    case "sale_date": {
      // YYYY-MM-DD or full ISO — pull off the date portion for display.
      const s = String(value).slice(0, 10);
      const d = new Date(s + "T00:00:00");
      if (Number.isNaN(d.getTime())) return s;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    default:
      return String(value);
  }
}

// Shared shell — progress bar always at the top, then framed content (Fix 92).
function Shell({ step, children }: { step: Step; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <ProgressBar step={step} />
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const active = progressIndex(step);
  return (
    <div className="flex items-center gap-2">
      {PROGRESS_STEPS.map((s, i) => {
        const done = i < active;
        const isActive = i === active;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  done && "bg-petrol-500 text-white",
                  isActive && "bg-petrol-700 text-white",
                  !done && !isActive && "bg-gray-150 text-gray-500"
                )}
              >
                {done ? <IconCheck size={11} stroke={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[11.5px] font-medium",
                  isActive ? "text-ink" : "text-gray-500"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <span className="h-px w-8 bg-gray-200" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Searchable portal-field picker (Fix 91). Type to filter the list of portal
// fields; click an option to select it. Optionally offers a "Dismiss" choice
// (used on the unrecognized-columns page).
// ---------------------------------------------------------------------------

function FieldPicker({
  value, // current portalFieldKey ("" = unmapped) or DISMISS_VALUE
  onChange,
  disabledKeys, // portal field keys already taken by another CSV column
  allowDismiss,
}: {
  value: string;
  onChange: (v: string) => void;
  disabledKeys: Set<string>;
  allowDismiss?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Fix J: the menu is portaled to <body> so card/section `overflow-hidden`
  // can't clip it. Track the trigger's viewport rect to anchor it.
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function measure() {
    const r = triggerRef.current?.getBoundingClientRect();
    if (r) setRect({ left: r.left, top: r.bottom + 4, width: r.width });
  }
  function close() {
    setOpen(false);
    setQuery("");
  }
  function openMenu() {
    measure();
    setOpen(true);
    setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    measure();
    function onDocPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      close();
    }
    function onReposition() {
      measure();
    }
    document.addEventListener("mousedown", onDocPointer);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  const currentLabel =
    value === DISMISS_VALUE
      ? "Dismissed (Not Imported)"
      : value
        ? portalFieldLabel(value)
        : "";

  // Filter the portal-field list by the typed query. Match is case insensitive
  // and looks for the text anywhere in the field label, not just at the start —
  // so "relat" surfaces every Relative field and "phone" every phone field.
  // Fix AAAAA PART 5: fields already mapped to another CSV column ("In Use")
  // sink to the bottom so what still needs mapping is on top. (Array#sort is
  // stable, so the original field order is preserved within each group.)
  const q = query.trim().toLowerCase();
  const filtered = (q
    ? PORTAL_FIELDS.filter((f) => f.label.toLowerCase().includes(q))
    : PORTAL_FIELDS
  )
    .slice()
    .sort((a, b) => {
      const aTaken = disabledKeys.has(a.key) && a.key !== value ? 1 : 0;
      const bTaken = disabledKeys.has(b.key) && b.key !== value ? 1 : 0;
      return aTaken - bTaken;
    });

  function pick(v: string) {
    onChange(v);
    close();
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={cn(
          "flex items-center gap-1.5 rounded-md border bg-surface px-2 py-[6px] text-[12px] outline-none",
          open ? "border-petrol-500" : "border-gray-200"
        )}
      >
        <IconSearch size={13} className="shrink-0 text-gray-400" />
        <input
          type="text"
          value={open ? query : currentLabel}
          placeholder="Type To Search Fields"
          onFocus={openMenu}
          onChange={(e) => {
            // Keep the typed text and open the menu without clobbering `query`
            // — routing through openMenu() here would reset it to "".
            const typed = e.target.value;
            if (!open) {
              measure();
              setOpen(true);
            }
            setQuery(typed);
          }}
          className="w-full cursor-pointer bg-transparent text-ink outline-none placeholder:text-gray-400"
        />
        {value && !open && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => onChange("")}
            className="shrink-0 cursor-pointer text-gray-400 hover:text-ink"
          >
            <IconX size={13} />
          </button>
        )}
      </div>
      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: rect.left,
              top: rect.top,
              width: rect.width,
              zIndex: 9999,
            }}
            className="max-h-[260px] overflow-auto rounded-md border border-gray-200 bg-surface shadow-elevated"
          >
            <button
              type="button"
              onClick={() => pick("")}
              className="block w-full cursor-pointer px-3 py-1.5 text-left text-[12px] text-gray-500 hover:bg-gray-50"
            >
              Not Mapped
            </button>
            {allowDismiss && (
              <button
                type="button"
                onClick={() => pick(DISMISS_VALUE)}
                className="block w-full cursor-pointer px-3 py-1.5 text-left text-[12px] text-gray-500 hover:bg-gray-50"
              >
                Dismiss (Do Not Import)
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-gray-400">No Matching Fields</div>
            ) : (
              filtered.map((f) => {
                const taken = disabledKeys.has(f.key) && f.key !== value;
                return (
                  <button
                    key={f.key}
                    type="button"
                    disabled={taken}
                    onClick={() => pick(f.key)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-1.5 text-left text-[12px]",
                      taken
                        ? "cursor-not-allowed text-gray-300"
                        : "cursor-pointer text-ink hover:bg-gray-50",
                      f.key === value && "bg-petrol-300/10 font-medium"
                    )}
                  >
                    <span>
                      {f.label}
                      {f.required && <span className="ml-1 text-danger">*</span>}
                    </span>
                    {taken && (
                      <span className="text-[10px] font-medium text-petrol-500">In Use</span>
                    )}
                    {f.key === value && (
                      <IconCheck size={12} className="text-petrol-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared mapping shell — Page 1 and Page 2 use the SAME layout (Fix 92).
// Header columns: "Your CSV Column" (left) | "Maps To Portal Field" (right).
// ---------------------------------------------------------------------------

function MappingTable({
  columns,
  rawSampleRow,
  mapping,
  onMapColumn,
  allowDismiss,
  missingRequiredKeys = [],
}: {
  columns: string[];
  rawSampleRow: Record<string, string> | undefined;
  mapping: Record<string, string>;
  onMapColumn: (header: string, value: string) => void;
  allowDismiss?: boolean;
  missingRequiredKeys?: string[];
}) {
  const takenKeys = useMemo(
    () => new Set(Object.keys(mapping).filter((k) => mapping[k])),
    [mapping]
  );

  return (
    <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-md border border-gray-200">
      {missingRequiredKeys.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-[#0d6c7d] bg-[#e0f2f7] px-3 py-2 text-[12px] text-[#0a3d4a]">
          <IconAlertTriangle size={13} stroke={2} className="shrink-0" />
          <span>
            Still Needed:{" "}
            {missingRequiredKeys.map((k) => portalFieldLabel(k)).join(", ")}. Map A
            Column To Each Below.
          </span>
        </div>
      )}
      <div className="grid grid-cols-[2fr_1fr_2fr] bg-gray-50 text-[11.5px] font-medium text-gray-500">
        <div className="px-3 py-2">Your CSV Column</div>
        <div className="px-3 py-2" aria-hidden />
        <div className="px-3 py-2">Maps To Portal Field</div>
      </div>
      <div>
        {columns.map((header) => {
          const sample =
            rawSampleRow && rawSampleRow[header] != null
              ? String(rawSampleRow[header]).slice(0, 48)
              : "";
          const current = fieldForHeader(mapping, header);
          const isDismissed = current === DISMISS_VALUE;
          const isMapped = !!current && !isDismissed;
          const needsMapping = !current;
          return (
            <div
              key={header}
              className={cn(
                "grid grid-cols-[2fr_1fr_2fr] items-center gap-2 border-t border-gray-150 px-3 py-2",
                needsMapping && "border-l-2 border-l-[#0d6c7d] bg-[#f0f9ff]"
              )}
            >
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium text-ink">{header}</div>
                {sample && (
                  <div className="truncate text-[11px] text-gray-400">e.g. {sample}</div>
                )}
              </div>
              <div className="flex items-center justify-center text-gray-300" aria-hidden>
                <IconArrowRight size={16} stroke={1.75} />
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <div className="min-w-0 flex-1">
                  <FieldPicker
                    value={current}
                    onChange={(v) => onMapColumn(header, v)}
                    disabledKeys={takenKeys}
                    allowDismiss={allowDismiss}
                  />
                </div>
                {isMapped ? (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-petrol-100 px-1.5 py-[2px] text-[9px] font-medium text-petrol-700">
                    <IconCheck size={9} stroke={3} />
                    Mapped
                  </span>
                ) : isDismissed ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-1.5 py-[2px] text-[9px] font-medium text-gray-500">
                    Dismissed
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-[#e0f2f7] px-1.5 py-[2px] text-[9px] font-medium text-[#0a3d4a]">
                    Needs Mapping
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact Previous / Next pager — sits in the sticky top bar of a paginated
// mapping section. Renders nothing when there's only one page.
function Pager({
  currentPage,
  pageCount,
  onPrev,
  onNext,
}: {
  currentPage: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-1 text-xs text-ink hover:border-petrol-500 disabled:opacity-40"
      >
        Previous
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={currentPage >= pageCount}
        className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-1 text-xs text-ink hover:border-petrol-500 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

// Fix I: live mapping-status banner, pinned at the top of the mapping step so
// the user always sees how many columns are mapped, how many are still
// unrecognized, and — in red — any required portal field that isn't mapped yet.
function MappingStatusBanner({
  mappedCount,
  unrecCount,
  dismissedCount,
  missingRequiredKeys,
}: {
  mappedCount: number;
  unrecCount: number;
  dismissedCount: number;
  missingRequiredKeys: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium">
      <span className="inline-flex items-center gap-1 rounded-full bg-petrol-100 px-2 py-[2px] text-petrol-700">
        <IconCheck size={10} stroke={3} />
        {mappedCount} {mappedCount === 1 ? "Column" : "Columns"} Mapped
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-[2px]",
          unrecCount > 0 ? "bg-[#e0f2f7] text-[#0a3d4a]" : "bg-gray-100 text-gray-500"
        )}
      >
        {unrecCount > 0 && <IconAlertTriangle size={10} stroke={2.5} />}
        {unrecCount} Unrecognized
      </span>
      {dismissedCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-[2px] text-gray-500">
          {dismissedCount} Dismissed
        </span>
      )}
      {missingRequiredKeys.length > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-[2px] text-danger">
          <IconAlertTriangle size={10} stroke={2.5} />
          Required: {missingRequiredKeys.map((k) => portalFieldLabel(k)).join(", ")}{" "}
          {missingRequiredKeys.length === 1 ? "is" : "are"} unrecognized
        </span>
      )}
    </div>
  );
}

// ===========================================================================
// Main wizard
// ===========================================================================

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Fix B: an error banner is useless if it scrolls off the top of a long
  // mapping list. Whenever an error appears, bring it back into view.
  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);

  // ---- upload state ----
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // ---- lead source state ----
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  // Default: read each row's mapped lead-source column; no batch fallback.
  const [leadSource, setLeadSource] = useState<string>(USE_FILE_SOURCE);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSourceName, setOtherSourceName] = useState("");
  // "Apply To All Rows" — force the selected source on every row, ignoring the file.
  const [forceAllRows, setForceAllRows] = useState(false);
  // Resolved on the upload step and reused for the actual import + saved mapping.
  const [sourceConfig, setSourceConfig] = useState<LeadSourceConfig | null>(null);

  // ---- mapping state ----
  // mapping: portalFieldKey -> csvHeader
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<string[]>([]);
  // Fix E / Fix H: both mapping lists (recognized on step 1, unrecognized on
  // step 2) paginate at MAPPING_PAGE_SIZE rows per page.
  const [recPage, setRecPage] = useState(1);
  const [unrecPage, setUnrecPage] = useState(1);
  const [savedMapping, setSavedMapping] = useState<
    { mapping: Record<string, string>; dismissedColumns: string[] } | null
  >(null);
  const [persistMode, setPersistMode] = useState<"save" | "keep-once">("save");

  // ---- preview state ----
  // For each normalized row index: the matching existing lead id (or null).
  const [dupMatches, setDupMatches] = useState<Array<string | null>>([]);
  const [normalized, setNormalized] = useState<IncomingLead[]>([]);
  // Per-row duplicate resolution choice (only relevant when dupMatches[i]).
  const [dupResolution, setDupResolution] = useState<Record<number, DuplicateResolution>>(
    {}
  );
  // Fix VVVV3: replace-select state — populated when the user hits Import on
  // the preview step and any row is set to "Replace existing data".
  // replaceSelections: per-csv-row index → set of field keys the user wants
  // to overwrite. Defaults to every field checked when the screen first
  // opens; user can uncheck individual fields per duplicate.
  // existingValuesByLeadId: snapshot of the existing lead row(s) read once
  // from the server so the comparison UI can show "current vs CSV" without
  // re-querying as the user toggles checkboxes.
  const [replaceSelections, setReplaceSelections] = useState<
    Map<number, Set<SelectableReplaceField>>
  >(new Map());
  const [existingValuesByLeadId, setExistingValuesByLeadId] = useState<
    Record<string, Record<string, unknown>>
  >({});
  // Fix P / Fix R: rows that fail validation on the preview step. Import is
  // blocked while any of these exist — the user must fix the source or remove
  // the offending rows here before importing. Only the valid rows ever import.
  const [invalidRows, setInvalidRows] = useState<PreviewInvalidRow[]>([]);
  // IMPORT SUMMARY: contact rows dropped during preview normalization, by reason.
  const [contactSkipStats, setContactSkipStats] = useState<{
    invalidPhone: number;
    invalidEmail: number;
    duplicate: number;
  }>({ invalidPhone: 0, invalidEmail: 0, duplicate: 0 });
  // Fix R: set after a successful import — drives the centered success popup.
  const [successResult, setSuccessResult] = useState<{
    imported: number;
    skipped: number;
    dedupeReview: number;
    contactsWritten: number;
    contactsSkipped: { invalidPhone: number; invalidEmail: number; duplicate: number };
    notImportedColumns: string[];
    // Fix NNNN3 PART 5: per-lead warnings for non-fatal contact/relative
    // write failures — surfaced in the Import Complete modal.
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    fetchLeadSources()
      .then(setSourceOptions)
      .catch(() => setSourceOptions(["Excess Elite", "Montgomery County", "Manual"]));
  }, []);

  function resetAll() {
    setStep("upload");
    setFile(null);
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setDismissed([]);
    setRecPage(1);
    setUnrecPage(1);
    setSavedMapping(null);
    setPersistMode("save");
    setError(null);
    setDupMatches([]);
    setNormalized([]);
    setDupResolution({});
    setInvalidRows([]);
    setContactSkipStats({ invalidPhone: 0, invalidEmail: 0, duplicate: 0 });
    setSuccessResult(null);
    setShowOtherInput(false);
    setOtherSourceName("");
    setForceAllRows(false);
    setSourceConfig(null);
  }

  // Fix R: drop a single invalid row from the preview so the rest can import.
  function removeInvalidRow(rowNumber: number) {
    setInvalidRows((prev) => prev.filter((r) => r.rowNumber !== rowNumber));
    setError(null);
  }

  // -----------------------------------------------------------------------
  // File parsing
  // -----------------------------------------------------------------------

  function handleFile(f: File) {
    setError(null);
    setFile(f);
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      // BOM + whitespace: drop a UTF-8 BOM from the first header and trim every
      // header name and cell value before any mapping or transform sees them.
      transformHeader: (h) => (h.charCodeAt(0) === 0xFEFF ? h.slice(1) : h).trim(),
      transform: (v) => (typeof v === "string" ? v.trim() : v),
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Parse Error: ${results.errors[0].message}`);
          return;
        }
        // Drop blank columns entirely — anything whose normalized header is "" is
        // not mappable and must not show up in the unrecognized-columns list.
        const hdrs = (results.meta.fields ?? []).filter((h) => h && normalizeHeader(h) !== "");
        setRawRows(results.data);
        setHeaders(hdrs);
        // Fix H: a fresh CSV always starts both mapping lists on page 1.
        setRecPage(1);
        setUnrecPage(1);
      },
      error: (err) => setError(`Parse Error: ${err.message}`),
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  // -----------------------------------------------------------------------
  // Mapping mutation shared by both pages.
  // -----------------------------------------------------------------------

  function mapColumn(header: string, value: string) {
    if (value === DISMISS_VALUE) {
      // Dismiss the column: remove any field it was mapped to, add to dismissed.
      setMapping((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) if (next[k] === header) next[k] = "";
        return next;
      });
      setDismissed((prev) => (prev.includes(header) ? prev : [...prev, header]));
      return;
    }
    // Selecting "" (Not Mapped) or a portal field key.
    setDismissed((prev) => prev.filter((h) => h !== header));
    setMapping((prev) => {
      const next = { ...prev };
      // Detach this header from any field it currently fills.
      for (const k of Object.keys(next)) if (next[k] === header) next[k] = "";
      // Detach the chosen field from any other header.
      if (value) next[value] = header;
      return next;
    });
  }

  // -----------------------------------------------------------------------
  // Step transitions
  // -----------------------------------------------------------------------

  async function resolveLeadSource(): Promise<LeadSourceConfig | null> {
    // Default: read each row's mapped column, leave the field null when blank.
    if (leadSource === USE_FILE_SOURCE) {
      return { mode: "file", source: null, mappingKey: USE_FILE_SOURCE };
    }
    let name: string;
    if (leadSource === OTHER_SOURCE_OPTION) {
      name = otherSourceName.trim();
      if (!name) {
        setError("Enter A Name For The New Lead Source.");
        return null;
      }
      const res = await addLeadSource(name);
      if (!res.ok) {
        setError(res.error);
        return null;
      }
      const updated = await fetchLeadSources();
      setSourceOptions(updated);
      setLeadSource(res.name);
      setShowOtherInput(false);
      setOtherSourceName("");
      name = res.name;
    } else {
      if (!leadSource) {
        setError("Choose A Lead Source.");
        return null;
      }
      name = leadSource;
    }
    // A named source is a fallback for rows the file leaves blank — unless
    // "Apply To All Rows" is on, in which case it overrides the file entirely.
    return { mode: forceAllRows ? "force" : "fallback", source: name, mappingKey: name };
  }

  function startFromUpload() {
    setError(null);
    if (!file || headers.length === 0) {
      setError("Upload A CSV File First.");
      return;
    }
    startTransition(async () => {
      const cfg = await resolveLeadSource();
      if (!cfg) return;
      setSourceConfig(cfg);

      const saved = await fetchSourceMapping(cfg.mappingKey);
      if (saved && Object.keys(saved.mapping).length > 0) {
        const filtered: Record<string, string> = {};
        for (const [k, v] of Object.entries(saved.mapping)) {
          if (headers.includes(v)) filtered[k] = v;
        }
        const filteredDismissed = saved.dismissedColumns.filter((h) => headers.includes(h));
        setMapping(filtered);
        setDismissed(filteredDismissed);
        setSavedMapping({ mapping: filtered, dismissedColumns: filteredDismissed });
        setPersistMode("keep-once");
        // Still show Page 1 so the user can confirm the remembered mapping.
        setStep("map");
        return;
      }

      const auto = autoMapHeaders(headers);
      setMapping(auto);
      setDismissed([]);
      setSavedMapping(null);
      setPersistMode("save");
      setStep("map");
    });
  }

  // Page 1 -> Page 2 (if there are unrecognized columns) or onward.
  function continueFromMap() {
    setError(null);
    for (const key of REQUIRED_PORTAL_FIELD_KEYS) {
      if (!mapping[key]) {
        setError(`Required Field "${portalFieldLabel(key)}" Is Not Mapped To A Column.`);
        return;
      }
    }
    const recognized = mappedHeaders(mapping);
    const unrec = headers.filter((h) => !recognized.has(h) && !dismissed.includes(h));
    if (unrec.length > 0) {
      setUnrecPage(1);
      setStep("unrecognized");
      return;
    }
    afterMappingComplete();
  }

  function afterMappingComplete() {
    setError(null);
    for (const key of REQUIRED_PORTAL_FIELD_KEYS) {
      if (!mapping[key]) {
        setError(`Required Field "${portalFieldLabel(key)}" Is Not Mapped To A Column.`);
        setStep("map");
        return;
      }
    }
    if (
      savedMapping &&
      (!sameMapping(mapping, savedMapping.mapping) ||
        !sameList(dismissed, savedMapping.dismissedColumns))
    ) {
      setStep("change_prompt");
      return;
    }
    proceedToPreview();
  }

  function proceedToPreview() {
    const source = leadSource === OTHER_SOURCE_OPTION ? otherSourceName.trim() : leadSource;
    buildPreview(mapping, source);
  }

  // -----------------------------------------------------------------------
  // Build the preview rows from the current mapping.
  // -----------------------------------------------------------------------

  function buildPreview(useMapping: Record<string, string>, source: string) {
    setError(null);
    for (const key of REQUIRED_PORTAL_FIELD_KEYS) {
      if (!useMapping[key]) {
        setError(`Required Field "${portalFieldLabel(key)}" Is Not Mapped To A Column.`);
        setStep("map");
        return;
      }
    }

    const get = (raw: Record<string, string>, key: string) => {
      const col = useMapping[key];
      return col ? (raw[col] ?? "").trim() : "";
    };

    const rows: IncomingLead[] = [];
    const invalid: PreviewInvalidRow[] = [];
    // IMPORT SUMMARY: contact rows dropped during normalization, by reason.
    const contactSkips = { invalidPhone: 0, invalidEmail: 0, duplicate: 0 };
    let rowNumber = 0;
    for (const raw of rawRows) {
      rowNumber += 1;
      const address = get(raw, "address");
      const city = get(raw, "city");
      const state = normalizeStateCode(get(raw, "state"));
      const zip = padZip(get(raw, "zip"));
      if (!address || !city || !state || !zip) {
        const missing: string[] = [];
        if (!address) missing.push("Address");
        if (!city) missing.push("City");
        if (!state) missing.push("State");
        if (!zip) missing.push("Zip");
        invalid.push({ rowNumber, address, city, state, zip, missing });
        continue;
      }

      const ownerFull = get(raw, "owner_full_name");
      const ownerFirst = get(raw, "owner_first_name");
      const ownerLast = get(raw, "owner_last_name");
      let ownerName: string;
      if (ownerFull) {
        // Strip a trailing Jr/Sr/II–IV/Esq, reorder "Last, First", Proper Case,
        // then re-attach the suffix.
        const { name: ownerCore, suffix: ownerSuffix } = splitNameSuffix(ownerFull);
        ownerName = [properCaseName(splitFullName(ownerCore)), ownerSuffix]
          .filter(Boolean)
          .join(" ");
      } else {
        ownerName = properCaseName(combineName(ownerFirst, ownerLast));
      }

      const phones: ImportPhone[] = [];
      const seenPhones = new Set<string>();
      for (let pm = 1; pm <= 5; pm++) {
        const rawPhone = get(raw, `phone_${pm}`);
        if (!rawPhone) continue;
        const pv = normalizePhoneStrict(rawPhone);
        if (!pv) {
          console.warn(`[import] Invalid phone: ${rawPhone}`);
          contactSkips.invalidPhone += 1;
          continue;
        }
        if (seenPhones.has(pv)) {
          contactSkips.duplicate += 1;
          continue;
        }
        seenPhones.add(pv);
        // DNC and Litigator are two independent CSV columns now — never inferred
        // from each other; an unmapped column reads as "" → false.
        phones.push({
          value: pv,
          phone_type: parsePhoneType(get(raw, `phone_${pm}_type`)),
          is_dnc: parseImportFlag(get(raw, `phone_${pm}_dnc`)),
          is_litigator: parseImportFlag(get(raw, `phone_${pm}_litigator`)),
        });
      }
      const emails: string[] = [];
      const seenEmails = new Set<string>();
      for (const ek of ["email", "email_2", "email_3", "email_4", "email_5"]) {
        const ev = get(raw, ek).toLowerCase();
        if (!ev) continue;
        if (!ev.includes("@")) {
          console.warn(`[import] Invalid email: ${ev}`);
          contactSkips.invalidEmail += 1;
          continue;
        }
        if (seenEmails.has(ev)) {
          contactSkips.duplicate += 1;
          continue;
        }
        seenEmails.add(ev);
        emails.push(ev);
      }
      const mailingAddresses = [get(raw, "mailing_address_1"), get(raw, "mailing_address_2")]
        .map((m) => m.trim())
        .filter(Boolean);
      // Fix C / JJJJJ PART 3: owner mailing address mapped as separate
      // street/city/state/zip columns — compose whatever parts are present into
      // a single line and treat it like any other mapped mailing address (it
      // becomes a contacts row, channel='mailing_address', linked to the imported
      // owner). A partial address (e.g. no street) is still created; warn when
      // the street is missing.
      const ownerMailingStreet = formatAddress(get(raw, "owner_mailing_street"));
      const ownerMailingCity = formatCity(get(raw, "owner_mailing_city"));
      const ownerMailingState = get(raw, "owner_mailing_state").toUpperCase();
      const ownerMailingZip = padZip(get(raw, "owner_mailing_zip"));
      const ownerMailingTail = [
        ownerMailingCity,
        [ownerMailingState, ownerMailingZip].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ");
      const ownerMailing = [ownerMailingStreet, ownerMailingTail]
        .filter(Boolean)
        .join(", ")
        .trim();
      if (ownerMailing) {
        if (!ownerMailingStreet && (ownerMailingCity || ownerMailingState || ownerMailingZip)) {
          console.warn(`[import] row ${rowNumber}: mailing address has no street; importing city/state/zip only.`);
        }
        mailingAddresses.push(ownerMailing);
      }

      // Relatives 1..RELATIVE_COUNT (Excess Elite "RELATIVE N: ..." columns).
      const relatives: ImportRelative[] = [];
      for (let rn = 1; rn <= RELATIVE_COUNT; rn++) {
        const rk = (s: string) => relativeFieldKey(rn, s);
        const rName = properCaseName(
          combineName(get(raw, rk("first_name")), get(raw, rk("last_name")))
        ) || null;
        const rRelationship = get(raw, rk("possible_type")) || null;
        const rAge = parseAge(get(raw, rk("age")));
        const rPhones: ImportPhone[] = [];
        const rSeenPhones = new Set<string>();
        for (let pm = 1; pm <= RELATIVE_PHONE_COUNT; pm++) {
          const rawPhone = get(raw, rk(`phone_${pm}`));
          if (!rawPhone) continue;
          const pv = normalizePhoneStrict(rawPhone);
          if (!pv) {
            console.warn(`[import] Invalid phone: ${rawPhone}`);
            contactSkips.invalidPhone += 1;
            continue;
          }
          if (rSeenPhones.has(pv)) {
            contactSkips.duplicate += 1;
            continue;
          }
          rSeenPhones.add(pv);
          rPhones.push({
            value: pv,
            phone_type: parsePhoneType(get(raw, rk(`phone_${pm}_type`))),
            is_dnc: parseImportFlag(get(raw, rk(`phone_${pm}_dnc`))),
            is_litigator: parseImportFlag(get(raw, rk(`phone_${pm}_litigator`))),
          });
        }
        const rEmails: string[] = [];
        const rSeenEmails = new Set<string>();
        for (let em = 1; em <= RELATIVE_EMAIL_COUNT; em++) {
          const ev = get(raw, rk(`email_${em}`)).toLowerCase();
          if (!ev) continue;
          if (!ev.includes("@")) {
            console.warn(`[import] Invalid email: ${ev}`);
            contactSkips.invalidEmail += 1;
            continue;
          }
          if (rSeenEmails.has(ev)) {
            contactSkips.duplicate += 1;
            continue;
          }
          rSeenEmails.add(ev);
          rEmails.push(ev);
        }
        if (rName || rPhones.length > 0 || rEmails.length > 0) {
          relatives.push({
            full_name: rName,
            relationship: rRelationship,
            age: rAge,
            phones: rPhones,
            emails: rEmails,
          });
        }
      }

      const deceasedRaw = get(raw, "owner_deceased_flag");
      const ownerDeceased = isYes(deceasedRaw);
      const ownerLiving =
        !ownerDeceased &&
        ["n", "no", "false", "0"].includes(deceasedRaw.trim().toLowerCase());

      const rawSaleDate = get(raw, "sale_date");
      const saleDate = parseImportDate(rawSaleDate);
      if (!saleDate && rawSaleDate) console.warn(`[import] Unparseable date: ${rawSaleDate}`);

      const rawSurplus = get(raw, "surplus_amount");
      let sourceSurplus = parseMoney(rawSurplus);
      if (sourceSurplus != null && sourceSurplus <= 0) {
        console.warn(`[import] Invalid surplus: ${rawSurplus}`);
        sourceSurplus = null;
      }

      rows.push({
        address: formatAddress(address),
        city: formatCity(city),
        state,
        zip,
        county: toTitleCase(stripCountySuffix(get(raw, "county"))) || null,
        sale_type: useMapping["sale_type"] ? parseSaleType(get(raw, "sale_type")) : "unknown",
        sale_date: saleDate,
        case_number: stripCaseNumber(get(raw, "case_number")) || null,
        parcel_number: get(raw, "parcel_number") || null,
        closing_bid: parseMoney(get(raw, "closing_bid")),
        opening_bid: parseMoney(get(raw, "opening_bid")),
        attorney_cost: useMapping["attorney_cost"] ? parseMoney(get(raw, "attorney_cost")) : null,
        source_surplus: sourceSurplus,
        lead_source: get(raw, "lead_source") || null,
        owner_full_name: ownerName || null,
        owner_age: parseAge(get(raw, "owner_age")),
        owner_deceased: ownerDeceased,
        owner_living: ownerLiving,
        phones,
        emails,
        mailing_addresses: mailingAddresses,
        relatives,
      });
    }

    if (rows.length === 0 && invalid.length === 0) {
      setError(`No Rows Found In The File.`);
      return;
    }

    setContactSkipStats({ ...contactSkips });

    startTransition(async () => {
      const dupResult =
        rows.length > 0
          ? await checkDuplicates(rows.map((r) => ({ address: r.address, zip: r.zip })))
          : { matches: [] as Array<string | null> };
      setDupMatches(dupResult.matches);
      // Default every detected duplicate to "Update Blank Fields Only".
      const initialRes: Record<number, DuplicateResolution> = {};
      dupResult.matches.forEach((m, i) => {
        if (m) initialRes[i] = DEFAULT_DUPLICATE_RESOLUTION;
      });
      setDupResolution(initialRes);
      setNormalized(rows);
      setInvalidRows(invalid);
      if (source && source !== leadSource) setLeadSource(source);
      setStep("preview");
    });
  }

  // -----------------------------------------------------------------------
  // Run the import
  // -----------------------------------------------------------------------

  const summary = useMemo(() => {
    let newRows = 0;
    let skipped = 0;
    let updatedBlank = 0;
    let replaced = 0;
    normalized.forEach((_, i) => {
      const matchId = dupMatches[i] ?? null;
      if (!matchId) {
        newRows += 1;
        return;
      }
      const res = dupResolution[i] ?? DEFAULT_DUPLICATE_RESOLUTION;
      if (res === "skip") skipped += 1;
      // Fix WWWW3: both replace_all (blind) and replace_selected count as
      // "replaced" for the preview summary.
      else if (res === "replace_all" || res === "replace_selected") replaced += 1;
      else updatedBlank += 1;
    });
    return { newRows, skipped, updatedBlank, replaced };
  }, [normalized, dupMatches, dupResolution]);

  // Fix WWWW3: only "Replace Selected Fields" rows route through the field-
  // selection screen. Blind "Replace All Fields" rows go straight to import.
  function getReplaceRows(): Array<{ index: number; existingLeadId: string }> {
    const out: Array<{ index: number; existingLeadId: string }> = [];
    normalized.forEach((_, i) => {
      const matchId = dupMatches[i] ?? null;
      if (!matchId) return;
      const res = dupResolution[i] ?? DEFAULT_DUPLICATE_RESOLUTION;
      if (res === "replace_selected") out.push({ index: i, existingLeadId: matchId });
    });
    return out;
  }

  // Fix WWWW3: assemble the final ImportRowDecision list. replace_all becomes
  // a blind decision (no selectedFields). replace_selected carries the user's
  // confirmed field set from the field-selection screen. Other actions
  // (insert / skip / update_blank) are unchanged.
  function buildDecisions(
    selections: Map<number, Set<SelectableReplaceField>>
  ): ImportRowDecision[] {
    const out: ImportRowDecision[] = [];
    normalized.forEach((_, i) => {
      const matchId = dupMatches[i] ?? null;
      if (!matchId) {
        out.push({ index: i, action: "insert" });
        return;
      }
      const res = dupResolution[i] ?? DEFAULT_DUPLICATE_RESOLUTION;
      if (res === "replace_selected") {
        const picked = selections.get(i) ?? new Set<SelectableReplaceField>();
        out.push({
          index: i,
          action: "replace_selected",
          existingLeadId: matchId,
          selectedFields: Array.from(picked),
        });
      } else if (res === "replace_all") {
        out.push({ index: i, action: "replace_all", existingLeadId: matchId });
      } else {
        // skip | update_blank
        out.push({ index: i, action: res, existingLeadId: matchId });
      }
    });
    return out;
  }

  function submitImport(decisions: ImportRowDecision[]) {
    if (!file) return;
    const cfg =
      sourceConfig ?? { mode: "file" as ImportSourceMode, source: null, mappingKey: USE_FILE_SOURCE };
    startTransition(async () => {
      const result = await importLeads(
        file.name,
        normalized,
        decisions,
        cfg.mode,
        cfg.source
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (persistMode === "save") {
        await saveSourceMapping(cfg.mappingKey, mapping, dismissed);
      }
      // Fix MMMM: show the success popup with the real insert count from this
      // session, then refresh so the Import History below picks up the new row.
      // Fix XXXX3: the success modal is only rendered as a sibling of the
      // preview step's <Shell>; when submitImport is invoked from the
      // replace_select view (Replace Selected button), step is still
      // "replace_select" and the modal never mounts, so a successful import
      // looks like a no-op. Route back to preview here so the modal renders
      // regardless of which step kicked off the import.
      setStep("preview");
      setSuccessResult({
        imported: result.imported,
        skipped: result.skipped,
        dedupeReview: dupMatches.filter(Boolean).length,
        contactsWritten: result.contactsWritten,
        contactsSkipped: contactSkipStats,
        notImportedColumns: headers.filter((h) => !recognized.has(h)),
        warnings: result.warnings ?? [],
      });
      router.refresh();
    });
  }

  function runImport() {
    if (!file) return;
    // Fix P: never run an import while any row failed validation.
    if (invalidRows.length > 0) {
      setError("Some Rows Have Errors. Fix Or Remove The Highlighted Rows First.");
      return;
    }
    setError(null);

    // Fix VVVV3: if any duplicate row is resolved to "Replace existing data",
    // detour through the field-selection screen first. Fetch the current
    // values for every targeted lead in one round-trip and pre-check every
    // selectable field — the user can uncheck whatever they don't want
    // overwritten before confirming.
    const replaceRows = getReplaceRows();
    if (replaceRows.length > 0) {
      const leadIds = replaceRows.map((r) => r.existingLeadId);
      startTransition(async () => {
        const existing = await fetchLeadsForReplaceSelect(leadIds);
        setExistingValuesByLeadId(existing);
        const initial = new Map<number, Set<SelectableReplaceField>>();
        for (const r of replaceRows) {
          initial.set(r.index, new Set<SelectableReplaceField>(SELECTABLE_REPLACE_FIELDS));
        }
        setReplaceSelections(initial);
        setStep("replace_select");
      });
      return;
    }

    // No replace rows → straight to import.
    submitImport(buildDecisions(new Map()));
  }

  function confirmReplaceSelect() {
    submitImport(buildDecisions(replaceSelections));
  }

  // -----------------------------------------------------------------------
  // Derived
  // -----------------------------------------------------------------------

  const recognized = useMemo(() => mappedHeaders(mapping), [mapping]);
  const recognizedCols = useMemo(
    () => headers.filter((h) => recognized.has(h)),
    [headers, recognized]
  );
  const unrecognizedCols = useMemo(
    () => headers.filter((h) => !recognized.has(h) && !dismissed.includes(h)),
    [headers, recognized, dismissed]
  );
  const sampleRow = rawRows[0];

  // ---- lead source selector (shared) ----
  const usingFileSource = leadSource === USE_FILE_SOURCE;
  const leadSourceLabel = usingFileSource
    ? USE_FILE_SOURCE_LABEL
    : leadSource === OTHER_SOURCE_OPTION
      ? otherSourceName.trim() || "New Source"
      : leadSource;

  const sourceSelector = (
    <div className="flex flex-col items-center gap-2">
      <label className="flex items-center gap-2 text-[12.5px] text-ink">
        Lead Source
        <select
          value={leadSource}
          onChange={(e) => {
            const v = e.target.value;
            setLeadSource(v);
            setShowOtherInput(v === OTHER_SOURCE_OPTION);
            if (v === USE_FILE_SOURCE) setForceAllRows(false);
            setError(null);
          }}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none focus:border-petrol-500"
        >
          <option value={USE_FILE_SOURCE}>Use Lead Source In File</option>
          {sourceOptions.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={OTHER_SOURCE_OPTION}>{OTHER_SOURCE_OPTION}</option>
        </select>
      </label>
      {showOtherInput && (
        <input
          type="text"
          value={otherSourceName}
          onChange={(e) => setOtherSourceName(e.target.value)}
          placeholder="New Source Name"
          className="rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none focus:border-petrol-500"
        />
      )}
      {!usingFileSource && (
        // Fix PPPP3 PART 1: spell out the behaviour so the user doesn't have
        // to infer it from the checkbox name — the subtext under the label
        // explains what happens when the box is left unchecked.
        <div className="flex flex-col gap-0.5">
          <label
            className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-gray-600"
            title="Forces the selected source on every row, ignoring any value in the file"
          >
            <input
              type="checkbox"
              checked={forceAllRows}
              onChange={(e) => setForceAllRows(e.target.checked)}
              className="cursor-pointer"
            />
            Apply this source to all rows in the CSV
          </label>
          <div className="pl-[22px] text-xs text-[#6b7280]">
            If unchecked, rows with their own source value will use that instead.
          </div>
        </div>
      )}
    </div>
  );

  // ===================== UPLOAD =====================
  if (step === "upload") {
    return (
      <Shell step={step}>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="rounded-[10px] border-2 border-dashed border-gray-300 bg-canvas px-8 py-12 text-center"
        >
          <IconUpload size={32} stroke={1.5} className="mx-auto text-gray-400" />
          <div className="mt-3 text-[15px] font-medium text-ink">
            Drop A CSV Here Or Click To Browse
          </div>
          <div className="mt-1 text-[12px] text-gray-500">
            Required Columns: Address, City, State, Zip. Everything Else Is Optional.
          </div>
          {file && (
            <div className="mt-2 text-[12px] text-petrol-500">
              {file.name} · {rawRows.length} Rows · {headers.length} Columns Detected
            </div>
          )}
          <div className="mt-4 flex items-center justify-center">{sourceSelector}</div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <label className="cursor-pointer rounded-md border border-gray-200 bg-surface px-4 py-2 text-xs font-medium text-ink hover:border-petrol-500">
              {file ? "Choose A Different File" : "Browse File"}
              <input type="file" accept=".csv,text/csv" onChange={onFileChange} className="hidden" />
            </label>
            {file && (
              <button
                type="button"
                onClick={startFromUpload}
                disabled={pending}
                className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-4 py-2 text-xs font-medium disabled:opacity-50"
              >
                Continue
                <IconArrowRight size={13} stroke={2} />
              </button>
            )}
          </div>
          {error && (
            <div className="mx-auto mt-4 max-w-md rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
              {error}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  // ===================== PAGE 1: MAP COLUMNS =====================
  if (step === "map") {
    const {
      pageItems: recPageCols,
      pageCount: recPageCount,
      currentPage: recCurrentPage,
      start: recStart,
    } = paginate(recognizedCols, recPage, RECOGNIZED_PAGE_SIZE);
    return (
      <Shell step={step}>
        <h2 className="m-0 text-[14px] font-medium text-ink">Confirm Column Mapping</h2>
        <div className="mt-[2px] text-[11.5px] text-gray-500">
          {file?.name} · {rawRows.length} Rows · {headers.length} Columns · Lead Source:{" "}
          {leadSourceLabel}
        </div>
        <div className="mt-1 text-[11.5px] text-gray-500">
          Search For And Confirm The Portal Field Each CSV Column Maps To. Required Fields
          Are Marked With An Asterisk.
        </div>

        {/* Sticky top bar — status banner (Fix I) + progress + pager + actions. */}
        <div className="sticky top-0 z-20 -mx-5 mt-3 border-b border-gray-150 bg-surface px-5 pb-3 pt-3">
          <div className="mx-auto max-w-[900px]">
            <MappingStatusBanner
              mappedCount={recognizedCols.length}
              unrecCount={unrecognizedCols.length}
              dismissedCount={dismissed.length}
              missingRequiredKeys={REQUIRED_PORTAL_FIELD_KEYS.filter(
                (k) => !mapping[k]
              )}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11.5px] font-medium text-gray-600">
                {recognizedCols.length > 0
                  ? `Showing ${recStart + 1}-${recStart + recPageCols.length} Of ${recognizedCols.length} Recognized Columns`
                  : "0 Recognized Columns"}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Pager
                  currentPage={recCurrentPage}
                  pageCount={recPageCount}
                  onPrev={() => setRecPage((p) => Math.max(1, p - 1))}
                  onNext={() => setRecPage((p) => Math.min(recPageCount, p + 1))}
                />
                <button
                  type="button"
                  onClick={resetAll}
                  className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-xs text-ink hover:border-petrol-500"
                >
                  Start Over
                </button>
                <button
                  type="button"
                  onClick={continueFromMap}
                  disabled={pending}
                  className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {unrecognizedCols.length > 0
                    ? "Review Unrecognized Columns"
                    : "Continue To Preview"}
                  <IconArrowRight size={13} stroke={2} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {recognizedCols.length > 0 ? (
            <MappingTable
              columns={recPageCols}
              rawSampleRow={sampleRow}
              mapping={mapping}
              onMapColumn={mapColumn}
              missingRequiredKeys={REQUIRED_PORTAL_FIELD_KEYS.filter(
                (k) => !mapping[k]
              )}
            />
          ) : (
            <div className="mx-auto max-w-[900px] rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-[12px] text-gray-500">
              No Columns Were Auto Matched. You Will Map Every Column On The Next Page.
            </div>
          )}
        </div>

        {unrecognizedCols.length > 0 && (
          <div className="mx-auto mt-4 flex max-w-[900px] flex-wrap items-center justify-between gap-2 rounded-md border border-[#0d6c7d] bg-[#e0f2f7] px-3 py-2 text-[11.5px] font-medium text-[#0a3d4a]">
            <span>
              {unrecognizedCols.length}{" "}
              {unrecognizedCols.length === 1 ? "Column Is" : "Columns Are"} Not Yet Recognized.
            </span>
            <button
              type="button"
              onClick={() => {
                setUnrecPage(1);
                setStep("unrecognized");
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#0d6c7d] bg-surface px-2.5 py-1 text-xs font-medium text-[#0a3d4a] hover:bg-[#f0f9ff]"
            >
              Jump To Unrecognized
              <IconArrowRight size={12} stroke={2} />
            </button>
          </div>
        )}

        {error && (
          <div className="mx-auto mt-3 max-w-[900px] rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}
      </Shell>
    );
  }

  // ===================== PAGE 2: UNRECOGNIZED COLUMNS =====================
  if (step === "unrecognized") {
    const {
      pageItems: unrecPageCols,
      pageCount: unrecPageCount,
      currentPage: unrecCurrentPage,
      start: unrecStart,
    } = paginate(unrecognizedCols, unrecPage, UNRECOGNIZED_PAGE_SIZE);
    const allReviewed = unrecognizedCols.length === 0;
    // "Dismiss All Remaining" dismisses the current page and every page after
    // it — columns the user already paged past are left alone.
    const dismissAllRemaining = () =>
      setDismissed((prev) =>
        Array.from(
          new Set([...prev, ...unrecognizedCols.slice(unrecStart)])
        )
      );
    const continueToPreview = () => {
      if (unrecognizedCols.length > 0) {
        setError("Map Or Dismiss The Remaining Columns First.");
        return;
      }
      afterMappingComplete();
    };

    return (
      <Shell step={step}>
        <h2 className="m-0 text-[14px] font-medium text-ink">Review Unrecognized Columns</h2>
        <div className="mt-[2px] text-[11.5px] text-gray-500">
          {file?.name} · Lead Source: {leadSourceLabel}
        </div>

        {/* Sticky top bar — status banner (Fix I) + progress, pager, actions. */}
        <div className="sticky top-0 z-20 -mx-5 mt-3 border-b border-gray-150 bg-surface px-5 pb-3 pt-3">
          <div className="mx-auto max-w-[900px]">
            <MappingStatusBanner
              mappedCount={recognizedCols.length}
              unrecCount={unrecognizedCols.length}
              dismissedCount={dismissed.length}
              missingRequiredKeys={REQUIRED_PORTAL_FIELD_KEYS.filter(
                (k) => !mapping[k]
              )}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11.5px] font-medium text-gray-600">
                {allReviewed
                  ? "0 Columns Remaining"
                  : `Showing ${unrecStart + 1}-${unrecStart + unrecPageCols.length} Of ${unrecognizedCols.length} · Page ${unrecCurrentPage} Of ${unrecPageCount} — ${unrecognizedCols.length} Columns Remaining`}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Pager
                  currentPage={unrecCurrentPage}
                  pageCount={unrecPageCount}
                  onPrev={() => setUnrecPage((p) => Math.max(1, p - 1))}
                  onNext={() => setUnrecPage((p) => Math.min(unrecPageCount, p + 1))}
                />
                <button
                  type="button"
                  onClick={dismissAllRemaining}
                  disabled={allReviewed}
                  className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
                >
                  Dismiss All Remaining
                </button>
                <button
                  type="button"
                  onClick={() => setStep("map")}
                  className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-xs text-ink hover:border-petrol-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={continueToPreview}
                  disabled={pending}
                  className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  Continue To Preview
                  <IconArrowRight size={13} stroke={2} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {allReviewed ? (
            <div className="mx-auto max-w-[900px] rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-[12px] text-gray-500">
              All Columns Reviewed. You Can Continue To Preview.
            </div>
          ) : (
            <>
              <MappingTable
                columns={unrecPageCols}
                rawSampleRow={sampleRow}
                mapping={mapping}
                onMapColumn={mapColumn}
                allowDismiss
                missingRequiredKeys={REQUIRED_PORTAL_FIELD_KEYS.filter(
                  (k) => !mapping[k]
                )}
              />
            </>
          )}
        </div>

        {dismissed.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-[900px] flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
            <span>Dismissed:</span>
            {dismissed.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-[2px] text-gray-600"
              >
                {h}
                <button
                  type="button"
                  aria-label={`Restore ${h}`}
                  onClick={() => setDismissed((prev) => prev.filter((x) => x !== h))}
                  className="cursor-pointer text-gray-400 hover:text-ink"
                >
                  <IconX size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-3 max-w-[900px] rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}
      </Shell>
    );
  }

  // ===================== CHANGE PROMPT =====================
  if (step === "change_prompt") {
    const sourceName = leadSourceLabel;
    return (
      <Shell step={step}>
        <h2 className="m-0 text-[14px] font-medium text-ink">
          Update Saved Mapping For {sourceName}?
        </h2>
        <div className="mt-2 text-[12.5px] text-gray-600">
          You Changed The Column Mapping For This Lead Source. Do You Want To Save These
          Changes As The Default For Future Imports From {sourceName}, Or Use Them Only For
          This Import?
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setPersistMode("keep-once");
              proceedToPreview();
            }}
            disabled={pending}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            Keep For This Import Only
          </button>
          <button
            type="button"
            onClick={() => {
              setPersistMode("save");
              proceedToPreview();
            }}
            disabled={pending}
            className="btn-primary cursor-pointer rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          >
            Update Default
          </button>
        </div>
      </Shell>
    );
  }

  // ===================== REPLACE SELECT =====================
  // Fix VVVV3: a per-replace-row field-selection screen. Only reachable when
  // the user resolved at least one duplicate to "Replace existing data" on
  // the dedupe step. Cancel returns to preview; Replace Selected calls
  // confirmReplaceSelect → submitImport with the filtered patch.
  if (step === "replace_select") {
    const rsRows = getReplaceRows();
    const totalChecked = Array.from(replaceSelections.values()).reduce(
      (acc, s) => acc + s.size,
      0
    );
    const canConfirm = !pending && totalChecked > 0;

    function toggleField(rowIndex: number, field: SelectableReplaceField) {
      setReplaceSelections((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(rowIndex) ?? new Set<SelectableReplaceField>());
        if (set.has(field)) set.delete(field);
        else set.add(field);
        next.set(rowIndex, set);
        return next;
      });
    }

    return (
      <Shell step={step}>
        <div className="mb-4">
          <h2 className="m-0 text-[14px] font-medium text-ink">
            Select Fields to Replace
          </h2>
          <div className="mt-[2px] text-[11.5px] text-gray-500">
            Choose which fields to overwrite on the existing lead. Unchecked
            fields will not be changed.
          </div>
        </div>

        <div className="space-y-4">
          {rsRows.map(({ index, existingLeadId }) => {
            const csv = normalized[index];
            const existing = existingValuesByLeadId[existingLeadId] ?? {};
            const selected =
              replaceSelections.get(index) ?? new Set<SelectableReplaceField>();
            return (
              <div
                key={index}
                className="overflow-hidden rounded-md border border-gray-200 bg-surface"
              >
                <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-[12px] font-medium text-ink">
                    {csv.address}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {csv.city}, {csv.state} {csv.zip}
                  </div>
                </div>
                <table className="w-full text-[11.5px]">
                  <thead className="bg-gray-50/50 text-[10.5px] uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        Current Value
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Replace
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        CSV Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SELECTABLE_REPLACE_FIELDS.map((field) => {
                      const curRaw = (existing as Record<string, unknown>)[field];
                      const csvRaw = (csv as unknown as Record<string, unknown>)[
                        field
                      ];
                      const cur = fmtReplaceComparison(field, curRaw);
                      const csvVal = fmtReplaceComparison(field, csvRaw);
                      const noChange = cur === csvVal;
                      return (
                        <tr key={field} className="border-t border-gray-150">
                          <td className="px-3 py-2 text-gray-600">{cur}</td>
                          <td className="px-3 py-2">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selected.has(field)}
                                onChange={() => toggleField(index, field)}
                                className="cursor-pointer"
                              />
                              <span className="text-[11.5px] text-ink">
                                {REPLACE_FIELD_LABELS[field]}
                              </span>
                              {noChange && (
                                <span className="text-[10.5px] italic text-gray-400">
                                  (No change)
                                </span>
                              )}
                            </label>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{csvVal}</td>
                        </tr>
                      );
                    })}
                    {/* Tax / Mortgage Payoff is in the spec's field list but
                        the wizard doesn't import it today — display as a
                        disabled row so the user sees the column exists. */}
                    <tr className="border-t border-gray-150 opacity-60">
                      <td className="px-3 py-2 text-gray-600">
                        {fmtReplaceComparison(
                          "outstanding_debt",
                          (existing as Record<string, unknown>).outstanding_debt
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" disabled />
                          <span className="text-[11.5px] text-gray-500">
                            Tax / Mortgage Payoff
                          </span>
                          <span className="text-[10.5px] italic text-gray-400">
                            (Not in CSV)
                          </span>
                        </label>
                      </td>
                      <td className="px-3 py-2 text-gray-400">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-warn-border bg-warn-bg px-3 py-2 text-[12px] text-warn-strong">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("preview");
            }}
            disabled={pending}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmReplaceSelect}
            disabled={!canConfirm}
            title={
              !canConfirm && totalChecked === 0
                ? "Select at least one field to replace"
                : undefined
            }
            className="btn-primary cursor-pointer rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          >
            {pending ? "Importing" : "Replace Selected"}
          </button>
        </div>
      </Shell>
    );
  }

  // ===================== PREVIEW =====================
  const totalRows = normalized.length;
  const dupCount = dupMatches.filter(Boolean).length;
  const sourceName = leadSourceLabel;
  const importableCount = summary.newRows + summary.updatedBlank + summary.replaced;
  // Fix WWWW3: split replace into two options — blind "Replace All Fields"
  // and selective "Replace Selected Fields" (the latter detours through the
  // field-selection screen).
  const RES_OPTIONS: DuplicateResolution[] = [
    "skip",
    "update_blank",
    "replace_all",
    "replace_selected",
  ];

  const hasRowErrors = invalidRows.length > 0;

  return (
    <>
    <Shell step={step}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-[14px] font-medium text-ink">Preview And Confirm</h2>
          <div className="mt-[2px] text-[11.5px] text-gray-500">
            {totalRows} Rows Ready · {dupCount} Duplicates Detected
            {hasRowErrors && ` · ${invalidRows.length} Need Fixing`} · Lead Source:{" "}
            {sourceName}
          </div>
        </div>
      </div>

      {hasRowErrors && (
        <div className="mb-3 flex items-start gap-1.5 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
          <IconAlertTriangle size={14} stroke={2} className="mt-[1px] shrink-0" />
          <span>
            {invalidRows.length} {invalidRows.length === 1 ? "Row Is" : "Rows Are"} Missing
            Required Values And {invalidRows.length === 1 ? "Is" : "Are"} Highlighted Below.
            Remove {invalidRows.length === 1 ? "It" : "Them"} Here, Or Fix Your Source File.
            The Import Cannot Run Until Every Row Is Valid.
          </span>
        </div>
      )}

      <div className="max-h-[420px] overflow-auto rounded-md border border-gray-200">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Address</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">City</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">State</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Zip</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Owner</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">If Duplicate</th>
            </tr>
          </thead>
          <tbody>
            {invalidRows.map((bad) => (
              <tr key={`bad-${bad.rowNumber}`} className="border-t border-gray-150 bg-petrol-50">
                <td className="border-l-4 border-l-petrol-500 px-3 py-[6px]">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-petrol-700">
                    <IconAlertTriangle size={11} />
                    Row {bad.rowNumber}
                  </span>
                </td>
                <td className="px-3 py-[6px] text-ink">{bad.address || "—"}</td>
                <td className="px-3 py-[6px] text-gray-600">{bad.city || "—"}</td>
                <td className="px-3 py-[6px] text-gray-600">{bad.state || "—"}</td>
                <td className="px-3 py-[6px] text-gray-600">{bad.zip || "—"}</td>
                <td className="px-3 py-[6px] text-gray-400">—</td>
                <td className="px-3 py-[6px] text-gray-400">—</td>
                <td className="px-3 py-[6px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-petrol-700">
                      Missing {bad.missing.join(", ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeInvalidRow(bad.rowNumber)}
                      aria-label={`Remove Row ${bad.rowNumber}`}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 rounded-md border border-gray-200 bg-surface px-1.5 py-[2px] text-[10px] text-gray-600 hover:border-petrol-500"
                    >
                      <IconX size={10} stroke={2} />
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {normalized.slice(0, 200).map((row, idx) => {
              const matchId = dupMatches[idx] ?? null;
              const res = dupResolution[idx] ?? DEFAULT_DUPLICATE_RESOLUTION;
              const willImport = !matchId || res !== "skip";
              return (
                <tr
                  key={idx}
                  className={cn("border-t border-gray-150", !willImport && "opacity-50")}
                >
                  <td className="px-3 py-[6px]">
                    {matchId ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-warn-strong">
                        <IconAlertTriangle size={11} />
                        Duplicate
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-success-strong">
                        <IconCheck size={11} />
                        New
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-[6px] text-ink">{row.address}</td>
                  <td className="px-3 py-[6px] text-gray-500">{row.city}</td>
                  <td className="px-3 py-[6px] text-gray-500">{row.state}</td>
                  <td className="px-3 py-[6px] text-gray-500">{row.zip}</td>
                  <td className="px-3 py-[6px] text-gray-500">{row.owner_full_name || "—"}</td>
                  <td className="px-3 py-[6px] text-gray-500">{row.sale_type}</td>
                  <td className="px-3 py-[6px]">
                    {matchId ? (
                      <select
                        value={res}
                        onChange={(e) =>
                          setDupResolution((prev) => ({
                            ...prev,
                            [idx]: e.target.value as DuplicateResolution,
                          }))
                        }
                        className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[3px] text-[11px] text-ink outline-none focus:border-petrol-500"
                      >
                        {RES_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {duplicateResolutionLabel(o)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {normalized.length > 200 && (
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            Showing First 200 Rows. All {normalized.length} Will Be Processed.
          </div>
        )}
      </div>

      {dupCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-gray-600">
          <span className="text-gray-500">Apply To All Duplicates:</span>
          {RES_OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() =>
                setDupResolution((prev) => {
                  const next = { ...prev };
                  dupMatches.forEach((m, i) => {
                    if (m) next[i] = o;
                  });
                  return next;
                })
              }
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2.5 py-[4px] hover:border-petrol-500"
            >
              {duplicateResolutionLabel(o)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] text-ink">
        {summary.newRows} {summary.newRows === 1 ? "new lead" : "new leads"},{" "}
        {summary.skipped} rows skipped, {summary.updatedBlank} updated blank fields only,{" "}
        {summary.replaced} replaced.
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-warn-border bg-warn-bg px-3 py-2 text-[12px] text-warn-strong">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep("map");
          }}
          disabled={pending}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
        >
          Adjust Column Mapping
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetAll}
            disabled={pending}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            Start Over
          </button>
          <button
            type="button"
            onClick={runImport}
            disabled={pending || importableCount === 0 || hasRowErrors}
            className="btn-primary cursor-pointer rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          >
            {pending
              ? "Importing"
              : hasRowErrors
                ? "Fix Errors To Import"
                : importableCount === 0
                  ? "No Rows To Import"
                  : `Import ${importableCount} ${importableCount === 1 ? "Lead" : "Leads"}`}
          </button>
        </div>
      </div>
    </Shell>
    {successResult && (
      <ImportSuccessModal
        onImportAnother={() => {
          setSuccessResult(null);
          resetAll();
        }}
        onClose={() => setSuccessResult(null)}
      />
    )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Fix R: centered success popup shown after an import completes.
// ---------------------------------------------------------------------------

// Fix BBBB3 PART 12: a deliberately minimal post-import popup — the headline
// count, plus muted lines for skipped / dedupe-flagged only when non-zero, and a
// single "Import Another File" button. The detailed per-import breakdown lives
// on the Import History row below, not here.
function ImportSuccessModal({
  onImportAnother,
  onClose,
}: {
  onImportAnother: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Fix YYYY3: one message for every scenario (new / update / selective
  // replace). No imported/skipped/dedupe counts and no warnings list — just
  // checkmark + "Import Completed" + Import Another File.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative min-w-[420px] max-w-[420px] rounded-xl bg-surface p-8 text-center shadow-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 cursor-pointer text-[#9ca3af] hover:text-[#374151]"
        >
          <IconX size={16} stroke={1.75} />
        </button>
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f4f6]">
          <IconCheck size={24} stroke={2.5} className="text-[#0d6c7d]" />
        </div>
        <h2 className="m-0 mb-6 text-lg font-semibold text-[#0a3d4a]">
          Import Completed
        </h2>
        <button
          type="button"
          onClick={onImportAnother}
          className="w-full cursor-pointer rounded-lg bg-[#0d6c7d] py-2.5 font-medium text-white transition-colors hover:bg-[#0a3d4a]"
        >
          Import Another File
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fix 9: import history table with per-row Revert (available 24h after import).
// ---------------------------------------------------------------------------

const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Fix R: human-friendly import status labels. A finished import reads "Success";
// a reverted one reads "Cancelled".
function statusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Success";
    case "cancelled":
      return "Cancelled";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function ImportHistoryTable({ history }: { history: ImportHistoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; ok: boolean } | null>(
    null
  );

  function onRevert(row: ImportHistoryRow) {
    setMessage(null);
    setBusyId(row.id);
    startTransition(async () => {
      const preview = await previewRevertImport(row.id);
      if (!preview.ok) {
        setMessage({ id: row.id, text: preview.error, ok: false });
        setBusyId(null);
        return;
      }
      const confirmed = window.confirm(
        `This Will Remove ${preview.removable} ${
          preview.removable === 1 ? "Lead" : "Leads"
        }. ${preview.edited} ${
          preview.edited === 1 ? "Lead Was" : "Leads Were"
        } Edited After Import And Will Not Be Removed.`
      );
      if (!confirmed) {
        setBusyId(null);
        return;
      }
      const result = await revertImport(row.id);
      if (result.ok) {
        setMessage({
          id: row.id,
          text: `Removed ${result.removed} ${result.removed === 1 ? "Lead" : "Leads"}${
            result.edited > 0 ? `; Kept ${result.edited} Edited` : ""
          }.`,
          ok: true,
        });
        router.refresh();
      } else {
        setMessage({ id: row.id, text: result.error, ok: false });
      }
      setBusyId(null);
    });
  }

  if (history.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 bg-surface px-4 py-6 text-center text-[12px] text-gray-500">
        No Imports Yet.
      </div>
    );
  }

  // Fix PPPP3 PART 2: explicit column widths via <colgroup> + table-fixed so
  // each th and the matching td below it share the same flex basis instead
  // of being recomputed from content per row. Filename takes the remaining
  // space; everything else is sized to its content. Actions is text-right
  // and its cell content stacks right-aligned (items-end) so the Revert
  // button + any inline success/error message line up against the same
  // right edge as the "Actions" header text.
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
      <table className="w-full table-fixed text-[12.5px]">
        <colgroup>
          <col />
          <col className="w-[180px]" />
          <col className="w-[80px]" />
          <col className="w-[96px]" />
          <col className="w-[88px]" />
          <col className="w-[110px]" />
          <col className="w-[140px]" />
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Filename</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Uploaded</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Imported</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Skipped</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => {
            const withinWindow =
              Date.now() - new Date(row.uploaded_at).getTime() <= REVERT_WINDOW_MS;
            const canRevert =
              withinWindow && row.status !== "cancelled" && row.imported_count > 0;
            const isBusy = pending && busyId === row.id;
            return (
              <tr key={row.id} className="border-t border-gray-150">
                <td className="truncate px-4 py-[10px] text-left text-ink">{row.filename}</td>
                <td className="px-4 py-[10px] text-left text-gray-500">
                  {formatTimestamp(row.uploaded_at)}
                </td>
                <td className="px-4 py-[10px] text-right text-ink">{row.total_rows}</td>
                <td className="px-4 py-[10px] text-right text-success-strong">
                  {row.imported_count}
                </td>
                <td className="px-4 py-[10px] text-right text-warn-strong">
                  {row.skipped_count}
                </td>
                <td className="px-4 py-[10px] text-left text-gray-500">{statusLabel(row.status)}</td>
                <td className="px-4 py-[10px] text-right">
                  <div className="flex flex-col items-end gap-1">
                    {canRevert ? (
                      <button
                        type="button"
                        onClick={() => onRevert(row)}
                        disabled={isBusy}
                        className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2.5 py-[5px] text-[11px] text-ink hover:border-petrol-500 disabled:opacity-50"
                      >
                        {isBusy ? "Reverting" : "Revert"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400">—</span>
                    )}
                    {message?.id === row.id && (
                      <div
                        className={cn(
                          "text-[11px]",
                          message.ok ? "text-success-strong" : "text-danger"
                        )}
                      >
                        {message.text}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
