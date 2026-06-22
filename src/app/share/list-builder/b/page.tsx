"use client";

import { useState } from "react";
import { IconChevronDown, IconChevronRight, IconUserCircle } from "@tabler/icons-react";

const STAGES = ["Researched", "First Contact", "Contact Made", "Awaiting Signature", "Signed"];
const STATES = ["TX", "NC", "AZ", "GA", "OH", "FL"];
const COUNTIES = ["Travis", "Mecklenburg", "Maricopa", "Fulton", "Cuyahoga", "Harris"];
const SALE_TYPES = ["Tax Sale", "Mortgage Foreclosure"];
const OWNER_STATUS = ["Living", "Deceased"];
const LAST_TOUCHED = ["Never", "30+ Days", "60+ Days", "90+ Days"];

const SAMPLE_LEADS = [
  { name: "Sarah Pemberton", county: "Travis, TX", surplus: "$48,200", status: "Living" },
  { name: "Marcus Hayes Estate", county: "Mecklenburg, NC", surplus: "$31,640", status: "Deceased" },
  { name: "Linda Chen", county: "Maricopa, AZ", surplus: "$22,915", status: "Living" },
  { name: "Robert Alvarado", county: "Fulton, GA", surplus: "$54,800", status: "Living" },
  { name: "Patricia Ng", county: "Cuyahoga, OH", surplus: "$27,300", status: "Living" },
];

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

function Section({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#f1f2f4] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left hover:bg-[#fbfbfc]"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <IconChevronDown size={14} stroke={2} className="text-[#9ca3af]" />
          ) : (
            <IconChevronRight size={14} stroke={2} className="text-[#9ca3af]" />
          )}
          <span className="text-[13px] font-semibold text-[#0f1729]">{title}</span>
        </div>
        {count > 0 && (
          <span className="rounded-md bg-[#0f1729] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
            {count}
          </span>
        )}
      </button>
      {open && <div className="space-y-3 px-5 pb-4">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11.5px] font-medium text-[#6b7280]">{label}</div>
      {children}
    </div>
  );
}

export default function VariantB() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    lead: true,
    sale: true,
    location: false,
    history: false,
  });
  const [stage, setStage] = useState<string[]>([]);
  const [ownerStatus, setOwnerStatus] = useState<string[]>([]);
  const [hasPhone, setHasPhone] = useState("any");
  const [saleType, setSaleType] = useState<string[]>([]);
  const [surplusMin, setSurplusMin] = useState("");
  const [surplusMax, setSurplusMax] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [lastTouched, setLastTouched] = useState("");
  const [skipLitigated, setSkipLitigated] = useState(false);
  const [name, setName] = useState("");

  const leadCounts = {
    lead: stage.length + ownerStatus.length + (hasPhone !== "any" ? 1 : 0),
    sale: saleType.length + (surplusMin || surplusMax ? 1 : 0),
    location: states.length + counties.length,
    history: (lastTouched ? 1 : 0) + (skipLitigated ? 1 : 0),
  };
  const totalActive = leadCounts.lead + leadCounts.sale + leadCounts.location + leadCounts.history;
  const leadCount = totalActive === 0 ? 124 : Math.max(124 - totalActive * 15, 12);
  const previewLeads = SAMPLE_LEADS.slice(0, Math.min(5, leadCount));

  function toggle(s: string) {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-10">
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Variant B · Two Column With Preview · HubSpot
        </div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          Build A Calling List
        </h1>
        <div className="mt-1 text-[12.5px] text-[#6b7280]">
          Categories collapse on the left. The right column previews who you would dial.
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-5">
        <div
          className="overflow-hidden rounded-[12px] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)" }}
        >
          <Section title="Lead Info" count={leadCounts.lead} open={openSections.lead} onToggle={() => toggle("lead")}>
            <Field label="Stage">
              <MultiChip options={STAGES} value={stage} onChange={setStage} />
            </Field>
            <Field label="Owner Status">
              <MultiChip options={OWNER_STATUS} value={ownerStatus} onChange={setOwnerStatus} />
            </Field>
            <Field label="Has Phone">
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
            </Field>
          </Section>

          <Section title="Sale Info" count={leadCounts.sale} open={openSections.sale} onToggle={() => toggle("sale")}>
            <Field label="Sale Type">
              <MultiChip options={SALE_TYPES} value={saleType} onChange={setSaleType} />
            </Field>
            <Field label="Surplus Range">
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
            </Field>
          </Section>

          <Section title="Location" count={leadCounts.location} open={openSections.location} onToggle={() => toggle("location")}>
            <Field label="State">
              <MultiChip options={STATES} value={states} onChange={setStates} />
            </Field>
            <Field label="County">
              <MultiChip options={COUNTIES} value={counties} onChange={setCounties} />
            </Field>
          </Section>

          <Section title="History" count={leadCounts.history} open={openSections.history} onToggle={() => toggle("history")}>
            <Field label="Last Touched">
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
            </Field>
            <Field label="Litigation">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-[#374151]">
                <input
                  type="checkbox"
                  checked={skipLitigated}
                  onChange={(e) => setSkipLitigated(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#13644e]"
                />
                Skip Litigated Leads
              </label>
            </Field>
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-[12px] bg-white p-5"
            style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)" }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
              Matching Now
            </div>
            <div className="mt-1 text-[32px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
              {leadCount}
            </div>
            <div className="text-[12px] text-[#6b7280]">Leads</div>

            <div className="mt-4 border-t border-[#f1f2f4] pt-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
                First In Queue
              </div>
              <div className="mt-2 space-y-1.5">
                {previewLeads.map((l) => (
                  <div key={l.name} className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f7f8f9] text-[#9ca3af]">
                      <IconUserCircle size={14} stroke={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-[#0f1729]">
                        {l.name}
                      </div>
                      <div className="text-[10.5px] text-[#6b7280]">
                        {l.county} &middot; {l.status}
                      </div>
                    </div>
                    <div className="text-[11.5px] font-semibold tabular-nums text-[#0f1729]">
                      {l.surplus}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="rounded-[12px] bg-white p-5"
            style={{ boxShadow: "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)" }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name This List"
              className="h-10 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#0f1729] outline-none transition focus:border-[#13644e] placeholder:text-[#9ca3af]"
            />
            <button
              type="button"
              disabled={!name.trim()}
              className="mt-2 h-10 w-full cursor-pointer rounded-md bg-gradient-to-r from-[#0a3d4a] to-[#13644e] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.20)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save &amp; Use ({leadCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
