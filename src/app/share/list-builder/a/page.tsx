"use client";

import { useState } from "react";

const STAGES = ["Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed"];
const STATES = ["TX", "NC", "AZ", "GA", "OH", "FL"];
const COUNTIES = ["Travis", "Mecklenburg", "Maricopa", "Fulton", "Cuyahoga", "Harris"];
const SALE_TYPES = ["Tax Sale", "Mortgage Foreclosure"];
const OWNER_STATUS = ["Living", "Deceased"];
const LAST_TOUCHED = ["Never", "30+ Days", "60+ Days", "90+ Days"];

function MultiChip({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(active ? value.filter((x) => x !== o) : [...value, o])}
            className={[
              "inline-flex cursor-pointer items-center rounded-md border px-2.5 py-1 text-[12px] font-medium transition",
              active
                ? "border-[#0f1729] bg-[#0f1729] text-white"
                : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0f1729]",
            ].join(" ")}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 border-b border-[#f1f2f4] py-4 last:border-b-0">
      <div className="pt-1 text-[12.5px] font-medium text-[#374151]">{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function VariantA() {
  const [stage, setStage] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [saleType, setSaleType] = useState<string[]>([]);
  const [ownerStatus, setOwnerStatus] = useState<string[]>([]);
  const [surplusMin, setSurplusMin] = useState("");
  const [surplusMax, setSurplusMax] = useState("");
  const [lastTouched, setLastTouched] = useState<string>("");
  const [hasPhone, setHasPhone] = useState<string>("any");
  const [skipLitigated, setSkipLitigated] = useState(false);
  const [name, setName] = useState("");

  const activeCount =
    stage.length +
    states.length +
    counties.length +
    saleType.length +
    ownerStatus.length +
    (surplusMin || surplusMax ? 1 : 0) +
    (lastTouched ? 1 : 0) +
    (hasPhone !== "any" ? 1 : 0) +
    (skipLitigated ? 1 : 0);
  const leadCount = activeCount === 0 ? 124 : Math.max(124 - activeCount * 15, 12);

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Variant A · Stacked Side Panel · Salesforce / Airtable
        </div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          Build A Calling List
        </h1>
        <div className="mt-1 text-[12.5px] text-[#6b7280]">
          Every filter is visible. Leave any row blank to ignore it.
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[12px] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)" }}
      >
        <div className="border-b border-[#f1f2f4] px-6 py-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                Matching Now
              </div>
              <div className="mt-0.5 text-[28px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
                {leadCount} <span className="text-[14px] font-medium text-[#6b7280]">Leads</span>
              </div>
            </div>
            <div className="text-[12px] text-[#6b7280]">
              {activeCount === 0 ? "No filters applied" : `${activeCount} filters active`}
            </div>
          </div>
        </div>

        <div className="px-6 py-2">
          <FilterRow label="Stage">
            <MultiChip options={STAGES} value={stage} onChange={setStage} />
          </FilterRow>
          <FilterRow label="State">
            <MultiChip options={STATES} value={states} onChange={setStates} />
          </FilterRow>
          <FilterRow label="County">
            <MultiChip options={COUNTIES} value={counties} onChange={setCounties} />
          </FilterRow>
          <FilterRow label="Sale Type">
            <MultiChip options={SALE_TYPES} value={saleType} onChange={setSaleType} />
          </FilterRow>
          <FilterRow label="Owner Status">
            <MultiChip options={OWNER_STATUS} value={ownerStatus} onChange={setOwnerStatus} />
          </FilterRow>
          <FilterRow label="Surplus Range">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={surplusMin}
                onChange={(e) => setSurplusMin(e.target.value)}
                placeholder="No min"
                className="h-9 w-32 rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
              />
              <span className="text-[12px] text-[#9ca3af]">to</span>
              <input
                type="text"
                value={surplusMax}
                onChange={(e) => setSurplusMax(e.target.value)}
                placeholder="No max"
                className="h-9 w-32 rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
              />
            </div>
          </FilterRow>
          <FilterRow label="Last Touched">
            <div className="flex flex-wrap gap-1.5">
              {LAST_TOUCHED.map((o) => {
                const active = lastTouched === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setLastTouched(active ? "" : o)}
                    className={[
                      "inline-flex cursor-pointer items-center rounded-md border px-2.5 py-1 text-[12px] font-medium transition",
                      active
                        ? "border-[#0f1729] bg-[#0f1729] text-white"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0f1729]",
                    ].join(" ")}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </FilterRow>
          <FilterRow label="Has Phone">
            <div className="flex gap-1.5">
              {[
                { id: "any", label: "Any" },
                { id: "yes", label: "Yes Only" },
                { id: "no", label: "No Only" },
              ].map((o) => {
                const active = hasPhone === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setHasPhone(o.id)}
                    className={[
                      "inline-flex cursor-pointer items-center rounded-md border px-3 py-1 text-[12px] font-medium transition",
                      active
                        ? "border-[#0f1729] bg-[#0f1729] text-white"
                        : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0f1729]",
                    ].join(" ")}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </FilterRow>
          <FilterRow label="Litigation">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-[#374151]">
              <input
                type="checkbox"
                checked={skipLitigated}
                onChange={(e) => setSkipLitigated(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#13644e]"
              />
              Skip Litigated Leads
            </label>
          </FilterRow>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#f1f2f4] bg-[#fbfbfc] px-6 py-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name This List (e.g. Texas Tax Sales)"
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
