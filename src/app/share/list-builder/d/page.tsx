"use client";

import { useState } from "react";

const STAGES = ["Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed"];
const STATES = ["TX", "NC", "AZ", "GA", "OH", "FL"];
const COUNTIES = ["Travis", "Mecklenburg", "Maricopa", "Fulton", "Cuyahoga", "Harris"];
const SALE_TYPES = ["Tax Sale", "Mortgage Foreclosure"];
const OWNER_STATUS = ["Living", "Deceased"];
const LAST_TOUCHED = ["Never", "30+ Days", "60+ Days", "90+ Days"];

function Card({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[12px] bg-white p-5"
      style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 8px 24px -8px rgba(15,23,41,0.08)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-[-0.005em] text-[#0f1729]">
          {title}
        </h3>
        {count > 0 && (
          <span className="rounded-md bg-[#0f1729] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
            {count}
          </span>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

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

export default function VariantD() {
  const [stage, setStage] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [saleType, setSaleType] = useState<string[]>([]);
  const [ownerStatus, setOwnerStatus] = useState<string[]>([]);
  const [surplusMin, setSurplusMin] = useState("");
  const [surplusMax, setSurplusMax] = useState("");
  const [lastTouched, setLastTouched] = useState("");
  const [hasPhone, setHasPhone] = useState("any");
  const [skipLitigated, setSkipLitigated] = useState(false);
  const [name, setName] = useState("");

  const totalActive =
    stage.length +
    states.length +
    counties.length +
    saleType.length +
    ownerStatus.length +
    (surplusMin || surplusMax ? 1 : 0) +
    (lastTouched ? 1 : 0) +
    (hasPhone !== "any" ? 1 : 0) +
    (skipLitigated ? 1 : 0);
  const leadCount = totalActive === 0 ? 124 : Math.max(124 - totalActive * 15, 12);

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-10">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Variant D · Card Grid · Attio
          </div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#0f1729]">
            Build A Calling List
          </h1>
          <div className="mt-1 text-[12.5px] text-[#6b7280]">
            Every filter is a card. Toggle values across cards in any order.
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
            Matching Now
          </div>
          <div className="text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
            {leadCount} <span className="text-[13px] font-medium text-[#6b7280]">Leads</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Stage" count={stage.length}>
          <MultiChip options={STAGES} value={stage} onChange={setStage} />
        </Card>
        <Card title="State" count={states.length}>
          <MultiChip options={STATES} value={states} onChange={setStates} />
        </Card>
        <Card title="County" count={counties.length}>
          <MultiChip options={COUNTIES} value={counties} onChange={setCounties} />
        </Card>
        <Card title="Sale Type" count={saleType.length}>
          <MultiChip options={SALE_TYPES} value={saleType} onChange={setSaleType} />
        </Card>
        <Card title="Owner Status" count={ownerStatus.length}>
          <MultiChip options={OWNER_STATUS} value={ownerStatus} onChange={setOwnerStatus} />
        </Card>
        <Card title="Surplus Range" count={surplusMin || surplusMax ? 1 : 0}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={surplusMin}
              onChange={(e) => setSurplusMin(e.target.value)}
              placeholder="No min"
              className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
            />
            <span className="text-[12px] text-[#9ca3af]">to</span>
            <input
              type="text"
              value={surplusMax}
              onChange={(e) => setSurplusMax(e.target.value)}
              placeholder="No max"
              className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[12.5px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
            />
          </div>
        </Card>
        <Card title="Last Touched" count={lastTouched ? 1 : 0}>
          <div className="flex flex-wrap gap-1.5">
            {LAST_TOUCHED.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setLastTouched(lastTouched === o ? "" : o)}
                className={[
                  "inline-flex cursor-pointer items-center rounded-md border px-2.5 py-1 text-[12px] font-medium transition",
                  lastTouched === o
                    ? "border-[#0f1729] bg-[#0f1729] text-white"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0f1729]",
                ].join(" ")}
              >
                {o}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Has Phone" count={hasPhone !== "any" ? 1 : 0}>
          <div className="flex gap-1.5">
            {[
              { id: "any", label: "Any" },
              { id: "yes", label: "Yes Only" },
              { id: "no", label: "No Only" },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setHasPhone(o.id)}
                className={[
                  "inline-flex cursor-pointer items-center rounded-md border px-3 py-1 text-[12px] font-medium transition",
                  hasPhone === o.id
                    ? "border-[#0f1729] bg-[#0f1729] text-white"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#0f1729]",
                ].join(" ")}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Card>
        <Card title="Litigation" count={skipLitigated ? 1 : 0}>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-[#374151]">
            <input
              type="checkbox"
              checked={skipLitigated}
              onChange={(e) => setSkipLitigated(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[#13644e]"
            />
            Skip Litigated Leads
          </label>
        </Card>
      </div>

      <div
        className="mt-5 flex items-center gap-2 rounded-[12px] bg-white p-4"
        style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 8px 24px -8px rgba(15,23,41,0.08)" }}
      >
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
  );
}
