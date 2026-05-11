"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Papa from "papaparse";
import {
  IconUpload,
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconX,
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
} from "../_actions";
import {
  autoMapHeaders,
  PORTAL_FIELDS,
  PORTAL_FIELD_KEYS,
  REQUIRED_PORTAL_FIELD_KEYS,
  portalFieldLabel,
  OTHER_SOURCE_OPTION,
  type IncomingLead,
  type ImportSaleType,
  type ImportHistoryRow,
} from "../_shared";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { formatAddress, formatCity } from "@/lib/imports/format-address";

type Step =
  | "upload"
  | "auto_map" // Step 1: Confirmed Mapping (auto-matched + overridable)
  | "unrecognized" // Step 2: bucket of unmatched columns, 10 at a time
  | "change_prompt" // Step 4: "Update Saved Mapping For X?"
  | "preview";

const NOT_MAPPED = ""; // sentinel select value
const UNRECOGNIZED_PAGE_SIZE = 10;

// All header values currently assigned to a portal field (so we can grey them
// out of other dropdowns / know which columns are "recognized").
function mappedHeaders(mapping: Record<string, string>): Set<string> {
  return new Set(Object.values(mapping).filter(Boolean));
}

function parseMoney(raw: string): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseSaleType(raw: string): ImportSaleType {
  const v = raw.trim().toUpperCase();
  if (v.startsWith("M")) return "MTG";
  if (v.startsWith("T")) return "TAX";
  return "unknown";
}

function splitFullName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function combineName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(" ");
}

// Compare two mappings/dismissed-lists for change detection.
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

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ---- upload state ----
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // ---- lead source state ----
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [leadSource, setLeadSource] = useState<string>("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherSourceName, setOtherSourceName] = useState("");

  // ---- mapping state ----
  // mapping: portalFieldKey -> csvHeader ("" = Not Mapped)
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [unrecPage, setUnrecPage] = useState(0);
  // Count of unrecognized columns when the user first reached Step 2, so the
  // "X Of Y" progress denominator stays stable as they map/dismiss them.
  const [unrecTotal, setUnrecTotal] = useState(0);
  // Snapshot of the saved mapping for this source (null if there was none).
  const [savedMapping, setSavedMapping] = useState<
    { mapping: Record<string, string>; dismissedColumns: string[] } | null
  >(null);
  // 'save' = persist mapping for this source after import; 'keep-once' = don't.
  const [persistMode, setPersistMode] = useState<"save" | "keep-once">("save");

  // ---- preview state ----
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set());
  const [normalized, setNormalized] = useState<IncomingLead[]>([]);
  const [skipDupes, setSkipDupes] = useState(true);

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
    setUnrecPage(0);
    setSavedMapping(null);
    setPersistMode("save");
    setError(null);
    setDuplicates(new Set());
    setNormalized([]);
    setShowOtherInput(false);
    setOtherSourceName("");
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
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Parse Error: ${results.errors[0].message}`);
          return;
        }
        const data = results.data;
        const hdrs = (results.meta.fields ?? []).filter((h) => h && h.trim());
        setRawRows(data);
        setHeaders(hdrs);
      },
      error: (err) => {
        setError(`Parse Error: ${err.message}`);
      },
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
  // Step transitions
  // -----------------------------------------------------------------------

  async function resolveLeadSource(): Promise<string | null> {
    if (leadSource === OTHER_SOURCE_OPTION) {
      const name = otherSourceName.trim();
      if (!name) {
        setError("Enter A Name For The New Lead Source.");
        return null;
      }
      const res = await addLeadSource(name);
      if (!res.ok) {
        setError(res.error);
        return null;
      }
      // Refresh the option list and switch the selection to the new source.
      const updated = await fetchLeadSources();
      setSourceOptions(updated);
      setLeadSource(res.name);
      setShowOtherInput(false);
      setOtherSourceName("");
      return res.name;
    }
    if (!leadSource) {
      setError("Choose A Lead Source.");
      return null;
    }
    return leadSource;
  }

  function startFromUpload() {
    setError(null);
    if (!file || headers.length === 0) {
      setError("Upload A CSV File First.");
      return;
    }
    startTransition(async () => {
      const source = await resolveLeadSource();
      if (!source) return;

      const saved = await fetchSourceMapping(source);
      if (saved && Object.keys(saved.mapping).length > 0) {
        // Keep only saved mappings whose CSV header still exists in this file.
        const filtered: Record<string, string> = {};
        for (const [k, v] of Object.entries(saved.mapping)) {
          if (headers.includes(v)) filtered[k] = v;
        }
        setMapping(filtered);
        setDismissed(saved.dismissedColumns.filter((h) => headers.includes(h)));
        setSavedMapping({
          mapping: filtered,
          dismissedColumns: saved.dismissedColumns.filter((h) => headers.includes(h)),
        });
        setPersistMode("keep-once"); // don't overwrite unless the user edits + confirms
        // Step 3: skip steps 1 & 2 — go straight to preview.
        buildPreview(filtered, source);
        return;
      }

      // No saved mapping: auto-map (Step 1).
      const auto = autoMapHeaders(headers);
      setMapping(auto);
      setDismissed([]);
      setSavedMapping(null);
      setPersistMode("save");
      setStep("auto_map");
    });
  }

  // Continue from Step 1 -> Step 2 (if there are unrecognized cols) or onward.
  function continueFromAutoMap() {
    setError(null);
    // Required fields must be mapped.
    for (const key of REQUIRED_PORTAL_FIELD_KEYS) {
      if (!mapping[key]) {
        setError(`Required Field "${portalFieldLabel(key)}" Is Not Mapped To A Column.`);
        return;
      }
    }
    const recognized = mappedHeaders(mapping);
    const unrec = headers.filter((h) => !recognized.has(h) && !dismissed.includes(h));
    if (unrec.length > 0) {
      setUnrecTotal(unrec.length);
      setUnrecPage(0);
      setStep("unrecognized");
      return;
    }
    afterMappingComplete();
  }

  // Called once the user has finished both mapping steps.
  function afterMappingComplete() {
    setError(null);
    // Re-check required (a dismissed column can't be required, but be safe).
    for (const key of REQUIRED_PORTAL_FIELD_KEYS) {
      if (!mapping[key]) {
        setError(`Required Field "${portalFieldLabel(key)}" Is Not Mapped To A Column.`);
        setStep("auto_map");
        return;
      }
    }
    // Step 4: if a saved mapping existed and the user changed something, prompt.
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
    startTransition(async () => {
      const source = leadSource === OTHER_SOURCE_OPTION ? otherSourceName.trim() : leadSource;
      buildPreview(mapping, source);
    });
  }

  // -----------------------------------------------------------------------
  // Build the preview rows from the current mapping.
  // -----------------------------------------------------------------------

  function buildPreview(useMapping: Record<string, string>, source: string) {
    setError(null);
    for (const key of REQUIRED_PORTAL_FIELD_KEYS) {
      if (!useMapping[key]) {
        setError(`Required Field "${portalFieldLabel(key)}" Is Not Mapped To A Column.`);
        setStep("auto_map");
        return;
      }
    }

    const get = (raw: Record<string, string>, key: string) => {
      const col = useMapping[key];
      return col ? (raw[col] ?? "").trim() : "";
    };

    const rows: IncomingLead[] = [];
    let missingRequired = 0;
    for (const raw of rawRows) {
      const address = get(raw, "address");
      const city = get(raw, "city");
      const stateRaw = get(raw, "state").toUpperCase();
      const state = stateRaw.length > 2 ? stateRaw.slice(0, 2) : stateRaw;
      const zip = get(raw, "zip");
      if (!address || !city || !state || !zip) {
        missingRequired += 1;
        continue;
      }

      const ownerFull = get(raw, "owner_full_name");
      const ownerFirst = get(raw, "owner_first_name");
      const ownerLast = get(raw, "owner_last_name");
      let ownerName: string;
      if (ownerFull) {
        ownerName = splitFullName(ownerFull);
      } else {
        ownerName = combineName(ownerFirst, ownerLast);
      }

      const phones = [get(raw, "phone_1"), get(raw, "phone_2"), get(raw, "phone_3")]
        .map((p) => p.trim())
        .filter(Boolean);
      const email = get(raw, "email");

      rows.push({
        address: formatAddress(address),
        city: formatCity(city),
        state,
        zip,
        county: get(raw, "county") || null,
        sale_type: useMapping["sale_type"] ? parseSaleType(get(raw, "sale_type")) : "unknown",
        sale_date: get(raw, "sale_date") || null,
        closing_bid: parseMoney(get(raw, "closing_bid")),
        opening_bid: parseMoney(get(raw, "opening_bid")),
        confirmed_surplus: parseMoney(get(raw, "surplus_amount")),
        lead_source: get(raw, "lead_source") || null,
        owner_full_name: ownerName || null,
        phones,
        email: email || null,
      });
    }

    if (rows.length === 0) {
      setError(
        missingRequired > 0
          ? `Every Row Is Missing One Of The Required Fields (Address, City, State, Zip).`
          : `No Rows Found In The File.`
      );
      return;
    }

    startTransition(async () => {
      const dupResult = await checkDuplicates(rows.map((r) => ({ address: r.address, zip: r.zip })));
      setDuplicates(dupResult.duplicates);
      setNormalized(rows);
      // Stash the resolved source so the import + persistence use it.
      if (source && source !== leadSource) setLeadSource(source);
      if (missingRequired > 0) {
        setError(
          `${missingRequired} ${missingRequired === 1 ? "Row Was" : "Rows Were"} Skipped For Missing Required Values.`
        );
      }
      setStep("preview");
    });
  }

  // -----------------------------------------------------------------------
  // Run the import
  // -----------------------------------------------------------------------

  function runImport() {
    if (!file) return;
    setError(null);
    const indices: number[] = [];
    normalized.forEach((row, i) => {
      const key = `${row.address.toLowerCase()}|${row.zip}`;
      if (skipDupes && duplicates.has(key)) return;
      indices.push(i);
    });
    const source = leadSource === OTHER_SOURCE_OPTION ? otherSourceName.trim() : leadSource;
    startTransition(async () => {
      const result = await importLeads(file.name, normalized, indices, source);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (persistMode === "save") {
        await saveSourceMapping(source, mapping, dismissed);
      }
      router.push("/leads");
    });
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const recognized = useMemo(() => mappedHeaders(mapping), [mapping]);
  const unrecognizedCols = useMemo(
    () => headers.filter((h) => !recognized.has(h) && !dismissed.includes(h)),
    [headers, recognized, dismissed]
  );

  // ---- lead source selector (shared) ----
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
            setError(null);
          }}
          className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none focus:border-petrol-500"
        >
          <option value="">Choose A Source</option>
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
    </div>
  );

  // ===================== UPLOAD =====================
  if (step === "upload") {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-[10px] border-2 border-dashed border-gray-300 bg-surface px-8 py-12 text-center"
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
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              className="hidden"
            />
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
    );
  }

  // ===================== STEP 1: AUTO MAP =====================
  if (step === "auto_map") {
    return (
      <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
        <h2 className="m-0 text-[14px] font-medium text-ink">Confirm Column Mapping</h2>
        <div className="mt-[2px] text-[11px] text-gray-500">
          {file?.name} · {rawRows.length} Rows · {headers.length} Columns · Lead Source:{" "}
          {leadSource}
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          We Auto Matched These Columns. Override Any Of Them Or Set To Not Mapped.
        </div>

        <div className="mt-4 space-y-2">
          {PORTAL_FIELDS.map((f) => {
            const current = mapping[f.key] ?? "";
            const isAuto = !!current;
            return (
              <div
                key={f.key}
                className="grid grid-cols-[200px_1fr] items-center gap-3"
              >
                <div className="text-[12.5px] text-ink">
                  {f.label}
                  {f.required && (
                    <span className="ml-1 text-danger" title="Required">
                      *
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={current}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none focus:border-petrol-500"
                  >
                    <option value={NOT_MAPPED}>Not Mapped</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {isAuto && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-success-strong">
                      <IconCheck size={11} />
                      Matched
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {unrecognizedCols.length > 0 && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            {unrecognizedCols.length}{" "}
            {unrecognizedCols.length === 1 ? "Column Is" : "Columns Are"} Not Yet
            Recognized. You Will Review Them Next.
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={resetAll}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500"
          >
            Start Over
          </button>
          <button
            type="button"
            onClick={continueFromAutoMap}
            disabled={pending}
            className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          >
            {unrecognizedCols.length > 0 ? "Review Unrecognized Columns" : "Continue To Preview"}
            <IconArrowRight size={13} stroke={2} />
          </button>
        </div>
      </div>
    );
  }

  // ===================== STEP 2: UNRECOGNIZED =====================
  if (step === "unrecognized") {
    // unrecognizedCols shrinks every time the user maps or dismisses one, so
    // the next page-worth surfaces from the front automatically. unrecTotal is
    // frozen on entry so the progress indicator ("14 Of 23") stays stable.
    const remaining = unrecognizedCols.length;
    const total = Math.max(unrecTotal, remaining);
    const reviewed = total - remaining;
    const pageCols = unrecognizedCols.slice(0, UNRECOGNIZED_PAGE_SIZE);

    const mapCol = (header: string, fieldKey: string) => {
      setMapping((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next)) {
          if (next[k] === header) next[k] = "";
        }
        if (fieldKey) next[fieldKey] = header;
        return next;
      });
    };
    const dismissCol = (header: string) => {
      setDismissed((prev) => (prev.includes(header) ? prev : [...prev, header]));
    };
    const dismissAllRemaining = () => {
      setDismissed((prev) => {
        const set = new Set(prev);
        for (const h of unrecognizedCols) set.add(h);
        return Array.from(set);
      });
    };

    return (
      <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
        <h2 className="m-0 text-[14px] font-medium text-ink">Unrecognized Columns</h2>
        <div className="mt-[2px] text-[11px] text-gray-500">
          {reviewed} Of {total} Reviewed · {remaining}{" "}
          {remaining === 1 ? "Column" : "Columns"} Left · Showing Up To{" "}
          {UNRECOGNIZED_PAGE_SIZE} At A Time
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          For Each Column, Map It To A Portal Field Or Dismiss It. Dismissed Columns Are
          Remembered For This Lead Source.
        </div>

        {pageCols.length === 0 ? (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-[12px] text-gray-500">
            All Columns Reviewed.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {pageCols.map((header, i) => {
              const assignedTo =
                Object.keys(mapping).find((k) => mapping[k] === header) ?? "";
              const sample =
                rawRows[0] && rawRows[0][header] != null
                  ? String(rawRows[0][header]).slice(0, 40)
                  : "";
              return (
                <div
                  key={header}
                  className="grid grid-cols-[1fr_220px_auto] items-center gap-3 rounded-md border border-gray-150 px-3 py-2"
                >
                  <div className="text-[12.5px] font-medium text-ink">
                    <span className="text-[11px] text-gray-400">
                      {reviewed + i + 1} Of {total}
                    </span>
                    <div>{header}</div>
                    {sample && (
                      <div className="text-[11px] text-gray-400">e.g. {sample}</div>
                    )}
                  </div>
                  <select
                    value={assignedTo}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__dismissed__") dismissCol(header);
                      else mapCol(header, v);
                    }}
                    className="cursor-pointer rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12px] text-ink outline-none focus:border-petrol-500"
                  >
                    <option value="">Choose A Field</option>
                    {PORTAL_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                    <option value="__dismissed__">Dismiss</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => dismissCol(header)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-surface px-2.5 py-[6px] text-[11px] text-ink hover:border-petrol-500"
                  >
                    <IconX size={12} />
                    Dismiss
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-between gap-2">
          <button
            type="button"
            onClick={dismissAllRemaining}
            disabled={remaining === 0}
            className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            Dismiss All Remaining
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("auto_map")}
              className="cursor-pointer rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (unrecognizedCols.length > 0) {
                  setError("Map Or Dismiss The Remaining Columns First.");
                  return;
                }
                afterMappingComplete();
              }}
              disabled={pending}
              className="btn-primary inline-flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
            >
              Continue To Preview
              <IconArrowRight size={13} stroke={2} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== STEP 4: CHANGE PROMPT =====================
  if (step === "change_prompt") {
    const sourceName = leadSource === OTHER_SOURCE_OPTION ? otherSourceName.trim() : leadSource;
    return (
      <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
        <h2 className="m-0 text-[14px] font-medium text-ink">
          Update Saved Mapping For {sourceName}?
        </h2>
        <div className="mt-2 text-[12.5px] text-gray-600">
          You Changed The Column Mapping For This Lead Source. Do You Want To Save These
          Changes As The Default For Future Imports From {sourceName}, Or Use Them Only
          For This Import?
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
      </div>
    );
  }

  // ===================== PREVIEW =====================
  const dupCount = duplicates.size;
  const totalRows = normalized.length;
  const importableCount = skipDupes ? totalRows - dupCount : totalRows;
  const sourceName = leadSource === OTHER_SOURCE_OPTION ? otherSourceName.trim() : leadSource;

  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="m-0 text-[14px] font-medium text-ink">Preview And Confirm</h2>
          <div className="mt-[2px] text-[11px] text-gray-500">
            {totalRows} Rows Ready · {dupCount} Likely Duplicates · {importableCount} Will
            Be Imported · Lead Source: {sourceName}
          </div>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-ink">
          <input
            type="checkbox"
            checked={skipDupes}
            onChange={(e) => setSkipDupes(e.target.checked)}
            className="cursor-pointer accent-petrol-500"
          />
          Skip Duplicates
        </label>
      </div>

      <div className="max-h-[400px] overflow-auto rounded-md border border-gray-200">
        <table className="w-full text-[12px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Address</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">City</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">State</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Zip</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Owner</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Closing Bid</th>
            </tr>
          </thead>
          <tbody>
            {normalized.slice(0, 100).map((row, idx) => {
              const isDupe = duplicates.has(`${row.address.toLowerCase()}|${row.zip}`);
              const willImport = !skipDupes || !isDupe;
              return (
                <tr
                  key={idx}
                  className={cn("border-t border-gray-150", !willImport && "opacity-50")}
                >
                  <td className="px-3 py-[6px]">
                    {isDupe ? (
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
                  <td className="px-3 py-[6px] text-right text-ink">
                    {row.closing_bid != null ? `$${row.closing_bid.toLocaleString()}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {normalized.length > 100 && (
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
            Showing First 100 Rows. All {normalized.length} Will Be Processed.
          </div>
        )}
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
            // Editing the mapping: re-enter Step 1, pre-filled with current
            // mapping. If it differs from the saved default, Step 4 will prompt.
            setStep("auto_map");
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
            disabled={pending || importableCount === 0}
            className="btn-primary cursor-pointer rounded-md px-3 py-2 text-xs font-medium disabled:opacity-50"
          >
            {pending
              ? "Importing"
              : `Import ${importableCount} ${importableCount === 1 ? "Lead" : "Leads"}`}
          </button>
        </div>
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

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-surface shadow-card">
      <table className="w-full text-[12.5px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Filename</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Uploaded</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Imported</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Skipped</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Errors</th>
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
                <td className="px-4 py-[10px] text-ink">{row.filename}</td>
                <td className="px-4 py-[10px] text-gray-500">
                  {formatTimestamp(row.uploaded_at)}
                </td>
                <td className="px-4 py-[10px] text-right text-ink">{row.total_rows}</td>
                <td className="px-4 py-[10px] text-right text-success-strong">
                  {row.imported_count}
                </td>
                <td className="px-4 py-[10px] text-right text-warn-strong">
                  {row.skipped_count}
                </td>
                <td className="px-4 py-[10px] text-right text-danger">{row.error_count}</td>
                <td className="px-4 py-[10px] capitalize text-gray-500">{row.status}</td>
                <td className="px-4 py-[10px] text-right">
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
                        "mt-1 text-[11px]",
                        message.ok ? "text-success-strong" : "text-danger"
                      )}
                    >
                      {message.text}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
