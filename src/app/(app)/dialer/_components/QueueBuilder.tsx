"use client";

import { useMemo, useState } from "react";
import { Phone, X, ArrowDownUp } from "lucide-react";
import type { DialerLead } from "../_mock/data";
import { CALLER_IDS } from "../_mock/data";
import { STAGE_LABELS, type Stage, stateName } from "@/lib/leads/types";
import { StagePill } from "@/components/StagePill";

const STAGE_OPTIONS: Stage[] = [
  "new_leads",
  "qualifying",
  "outreach",
  "in_conversation",
];

const STATE_OPTIONS = ["GA", "SC", "TN", "PA", "OH", "NY"];

type OwnerFilter = "any" | "Living" | "Deceased";
type SurplusBucket = "any" | "lt25" | "25-100" | "100-250" | "gt250";

const SURPLUS_LABELS: Record<SurplusBucket, string> = {
  any: "Any Amount",
  lt25: "Under $25K",
  "25-100": "$25K to $100K",
  "100-250": "$100K to $250K",
  gt250: "Over $250K",
};

function inBucket(surplus: number, b: SurplusBucket) {
  if (b === "any") return true;
  if (b === "lt25") return surplus < 25000;
  if (b === "25-100") return surplus >= 25000 && surplus < 100000;
  if (b === "100-250") return surplus >= 100000 && surplus < 250000;
  return surplus >= 250000;
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export function QueueBuilder({
  leads,
  dialableNumberCount,
  onStart,
}: {
  leads: DialerLead[];
  dialableNumberCount: (lead: DialerLead) => number;
  onStart: (leadIds: string[], callerIdId: string) => void;
}) {
  const [stages, setStages] = useState<Set<Stage>>(new Set(STAGE_OPTIONS));
  const [states, setStates] = useState<Set<string>>(new Set(STATE_OPTIONS));
  const [owner, setOwner] = useState<OwnerFilter>("any");
  const [activity, setActivity] = useState<"any" | "7d" | "14d" | "30d">("any");
  const [surplus, setSurplus] = useState<SurplusBucket>("any");

  const [numberSelection, setNumberSelection] = useState<
    "auto" | "perlead" | "all"
  >("auto");
  const [callerIdId, setCallerIdId] = useState<string>("auto");
  const [mode] = useState<"power">("power");

  const matches = useMemo(() => {
    return leads.filter((l) => {
      if (!stages.has(l.stage)) return false;
      if (!states.has(l.state)) return false;
      if (owner !== "any" && l.ownerStatus !== owner) return false;
      if (!inBucket(l.estimatedSurplus, surplus)) return false;
      if (activity === "7d" && l.daysSinceContact > 7) return false;
      if (activity === "14d" && l.daysSinceContact > 14) return false;
      if (activity === "30d" && l.daysSinceContact > 30) return false;
      return true;
    });
  }, [leads, stages, states, owner, activity, surplus]);

  const dialable = matches.filter((l) => dialableNumberCount(l) > 0);

  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const queueLeads = dialable.filter((l) => !removed.has(l.id));

  function toggleStage(s: Stage) {
    setStages((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleState(s: string) {
    setStates((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function remove(id: string) {
    setRemoved((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function start() {
    if (queueLeads.length === 0) return;
    onStart(queueLeads.map((l) => l.id), callerIdId);
  }

  return (
    <div className="px-7 py-6">
      <div className="mb-[22px] flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
            Build Dial Queue
          </h1>
          <div className="mt-1 text-[13px] text-gray-500">
            Filter leads, confirm the order, then start dialing.
          </div>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={queueLeads.length === 0}
          className="btn btn-primary inline-flex h-9 items-center gap-2 rounded-md px-4 text-[13px] font-medium"
        >
          <Phone size={14} strokeWidth={2} />
          Dial These Leads
        </button>
      </div>

      <div className="space-y-4">
        <Card title="Filters">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Stage">
              <div className="flex flex-wrap gap-1.5">
                {STAGE_OPTIONS.map((s) => (
                  <ChipToggle
                    key={s}
                    active={stages.has(s)}
                    onClick={() => toggleStage(s)}
                  >
                    {STAGE_LABELS[s]}
                  </ChipToggle>
                ))}
              </div>
            </Field>

            <Field label="State">
              <div className="flex flex-wrap gap-1.5">
                {STATE_OPTIONS.map((s) => (
                  <ChipToggle
                    key={s}
                    active={states.has(s)}
                    onClick={() => toggleState(s)}
                  >
                    {s}
                  </ChipToggle>
                ))}
              </div>
            </Field>

            <Field label="Owner Status">
              <Select
                value={owner}
                onChange={(v) => setOwner(v as OwnerFilter)}
                options={[
                  { value: "any", label: "Any Status" },
                  { value: "Living", label: "Living" },
                  { value: "Deceased", label: "Deceased" },
                ]}
              />
            </Field>

            <Field label="Activity">
              <Select
                value={activity}
                onChange={(v) => setActivity(v as typeof activity)}
                options={[
                  { value: "any", label: "Any Time" },
                  { value: "7d", label: "Contacted Within 7 Days" },
                  { value: "14d", label: "Contacted Within 14 Days" },
                  { value: "30d", label: "Contacted Within 30 Days" },
                ]}
              />
            </Field>

            <Field label="Surplus Range">
              <Select
                value={surplus}
                onChange={(v) => setSurplus(v as SurplusBucket)}
                options={(
                  ["any", "lt25", "25-100", "100-250", "gt250"] as SurplusBucket[]
                ).map((b) => ({ value: b, label: SURPLUS_LABELS[b] }))}
              />
            </Field>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 text-[12.5px] text-gray-500">
            <span>
              <span className="font-medium text-ink">{matches.length}</span> Leads
              Match,{" "}
              <span className="font-medium text-ink">{dialable.length}</span> Have
              Phone Numbers
            </span>
          </div>
        </Card>

        <Card title="Queue Configuration">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Number Selection">
              <Select
                value={numberSelection}
                onChange={(v) => setNumberSelection(v as typeof numberSelection)}
                options={[
                  { value: "auto", label: "Auto (Match Lead State)" },
                  { value: "perlead", label: "Choose Per Lead" },
                  { value: "all", label: "Dial All Numbers" },
                ]}
              />
            </Field>
            <Field label="Caller ID">
              <Select
                value={callerIdId}
                onChange={(v) => setCallerIdId(v)}
                options={[
                  { value: "auto", label: "Auto (Match Lead State)" },
                  ...CALLER_IDS.map((c) => ({
                    value: c.id,
                    label: `${c.formatted} ${c.state}`,
                  })),
                ]}
              />
            </Field>
            <Field label="Dialing Mode">
              <Select
                value={mode}
                onChange={() => undefined}
                options={[
                  { value: "power", label: "Power Dial (Single Line)" },
                ]}
              />
            </Field>
          </div>
        </Card>

        <Card
          title={`Queue Preview · ${queueLeads.length} Leads`}
          right={
            queueLeads.length > 0 ? (
              <button
                type="button"
                onClick={start}
                className="btn btn-primary inline-flex h-8 items-center gap-2 rounded-md px-3 text-[12px] font-medium"
              >
                Start Dialing
              </button>
            ) : null
          }
        >
          {queueLeads.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-200 px-6 py-8 text-center text-[12.5px] text-gray-500">
              No leads match the current filters. Loosen filters or restore
              removed leads to build a queue.
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-200">
              <table className="w-full text-[12.5px]">
                <thead className="bg-gray-50 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-10">#</th>
                    <th className="px-3 py-2 text-left font-medium">Lead</th>
                    <th className="px-3 py-2 text-left font-medium">State</th>
                    <th className="px-3 py-2 text-left font-medium">Stage</th>
                    <th className="px-3 py-2 text-left font-medium">Contact</th>
                    <th className="px-3 py-2 text-left font-medium">Number</th>
                    <th className="px-3 py-2 text-right font-medium">Surplus</th>
                    <th className="px-3 py-2 text-right font-medium w-10" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {queueLeads.map((lead, idx) => {
                    let primaryContact = lead.contacts[0];
                    let primaryNumber = primaryContact.numbers.find(
                      (n) => n.status === "active"
                    );
                    if (!primaryNumber) {
                      for (const ct of lead.contacts) {
                        const n = ct.numbers.find((x) => x.status === "active");
                        if (n) {
                          primaryContact = ct;
                          primaryNumber = n;
                          break;
                        }
                      }
                    }
                    return (
                      <tr
                        key={lead.id}
                        className="border-t border-gray-150 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2.5 text-ink">
                          <div className="font-medium">{lead.ownerName}</div>
                          <div className="text-[11px] text-gray-500">
                            {lead.leadId}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">
                          {stateName(lead.state)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StagePill stage={lead.stage} />
                        </td>
                        <td className="px-3 py-2.5 text-ink">
                          <div>{primaryContact.name}</div>
                          <div className="text-[11px] text-gray-500">
                            {primaryContact.role}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-ink">
                          {primaryNumber?.formatted ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-ink">
                          {fmtMoney(lead.estimatedSurplus)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => remove(lead.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-ink"
                            aria-label="Remove From Queue"
                            title="Remove From Queue"
                          >
                            <X size={14} strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {removed.size > 0 && (
            <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
              <span>
                <ArrowDownUp size={12} className="mr-1.5 inline" />
                {removed.size} Removed From Queue
              </span>
              <button
                type="button"
                onClick={() => setRemoved(new Set())}
                className="text-petrol-500 hover:underline"
              >
                Restore All
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-surface">
      <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
        <h2 className="m-0 text-[13.5px] font-medium tracking-tight text-ink">
          {title}
        </h2>
        {right}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.4px] text-gray-500">
        {label}
      </div>
      {children}
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 w-full rounded-md border border-gray-200 bg-surface px-2.5 text-[12.5px] text-ink outline-none focus:border-petrol-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ChipToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded border border-petrol-500 bg-surface px-2.5 py-1 text-[11.5px] font-medium text-petrol-500"
          : "rounded border border-gray-200 bg-surface px-2.5 py-1 text-[11.5px] text-gray-500 hover:border-gray-300 hover:text-ink"
      }
    >
      {children}
    </button>
  );
}
