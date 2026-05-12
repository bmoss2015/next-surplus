"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconMinus, IconPencil } from "@tabler/icons-react";
import {
  updateLeadField,
  addLien,
  updateLien,
  removeLien,
} from "../../_actions";
import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency } from "@/lib/leads/format";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";
import { SectionSubheader } from "../SectionSubheader";
import { surplusBasisLabel, type SurplusBasis } from "@/lib/leads/active-surplus";

function fmt(value: number | null | undefined): string {
  return formatCurrency(value);
}

type FinKey = "closing_bid" | "opening_bid" | "outstanding_debt" | "court_costs";

type LocalLien = LienRow & { _tempId?: string };

export function SurplusBreakdown({
  leadId,
  closingBid,
  openingBid,
  outstandingDebt,
  courtCosts,
  liens: initialLiens,
  estimatedSurplus,
  sourceSurplus,
  recoveryFeePercent,
  attorneyCost,
}: {
  leadId: string;
  closingBid: number | null;
  openingBid: number | null;
  outstandingDebt: number | null;
  courtCosts: number | null;
  liens: LienRow[];
  estimatedSurplus: number | null;
  sourceSurplus: number | null;
  recoveryFeePercent: number;
  attorneyCost: number;
}) {
  const [fin, setFin] = useState<Record<FinKey, number | null>>({
    closing_bid: closingBid,
    opening_bid: openingBid,
    outstanding_debt: outstandingDebt,
    court_costs: courtCosts,
  });
  const [liens, setLiens] = useState<LocalLien[]>(initialLiens);
  const { confirmedSurplus: confirmed, setConfirmedSurplus: setConfirmed } =
    useConfirmedSurplus();
  const [, startTransition] = useTransition();

  const liensTotal = liens.reduce((sum, l) => sum + (l.amount ?? 0), 0);

  // Optimistic estimated surplus = closing bid - outstanding debt - court costs
  // - sum(liens). DB regenerates the authoritative value on revalidate.
  const liveEstimated = (() => {
    const cb = fin.closing_bid;
    if (cb == null) return null;
    const od = fin.outstanding_debt ?? 0;
    const cc = fin.court_costs ?? 0;
    return cb - od - cc - liensTotal;
  })();
  const liveSurplus = liveEstimated ?? estimatedSurplus;

  // Fix SS / Fix LLL: the active surplus the money math runs on —
  // confirmed (non-zero) > estimated (when a closing bid exists) > source > 0.
  const { value: activeSurplusValue, basis } = ((): {
    value: number;
    basis: SurplusBasis;
  } => {
    if (confirmed != null && confirmed !== 0) return { value: confirmed, basis: "confirmed" };
    if (fin.closing_bid != null) return { value: liveEstimated ?? 0, basis: "estimated" };
    if (sourceSurplus != null) return { value: sourceSurplus, basis: "source" };
    return { value: 0, basis: "none" };
  })();
  const liveFeeAmount = activeSurplusValue * (recoveryFeePercent / 100);
  const liveNetPayout = liveFeeAmount - attorneyCost;

  function commitFin(key: FinKey, n: number | null) {
    if (fin[key] === n) return;
    setFin((prev) => ({ ...prev, [key]: n }));
    startTransition(async () => {
      await updateLeadField(leadId, key, n);
    });
  }

  function commitConfirmed(n: number | null) {
    if (confirmed === n) return;
    setConfirmed(n);
    startTransition(async () => {
      await updateLeadField(leadId, "confirmed_surplus", n);
    });
  }

  function onAddLien() {
    const tempId = `temp-${Date.now()}`;
    setLiens((prev) => [
      ...prev,
      { id: tempId, _tempId: tempId, lead_id: leadId, name: "", amount: 0, position: prev.length },
    ]);
    startTransition(async () => {
      const res = await addLien(leadId);
      if (res.ok) {
        setLiens((prev) =>
          prev.map((l) => (l.id === tempId ? { ...l, id: res.id, _tempId: undefined } : l))
        );
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
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      <h3 className="section-subheader">
        Surplus Breakdown
      </h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <SectionSubheader>Sale Financials</SectionSubheader>
          <MoneyRow
            label="Closing Bid"
            value={fin.closing_bid}
            onCommit={(n) => commitFin("closing_bid", n)}
          />
          <MoneyRow
            label="Opening Bid"
            value={fin.opening_bid}
            onCommit={(n) => commitFin("opening_bid", n)}
          />
          <MoneyRow
            label="Outstanding Debt"
            value={fin.outstanding_debt}
            onCommit={(n) => commitFin("outstanding_debt", n)}
          />
          <MoneyRow
            label="Court Costs And Fees"
            value={fin.court_costs}
            onCommit={(n) => commitFin("court_costs", n)}
          />

          <SectionSubheader className="mt-5">Liens</SectionSubheader>
          {/* Fix LL: the Add Lien button belongs to the lien content — it sits
              directly below the list (or below "No Liens On File"), left
              aligned, not floating in the section header. */}
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
                    className="min-w-0 max-w-[300px] flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[14px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
                  />
                  <CurrencyInput
                    value={lien.amount}
                    onCommit={(n) => commitLienAmount(lien.id, n)}
                    prefix="$"
                    align="left"
                    className="w-[130px] shrink-0"
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

        <div>
          <SectionSubheader>Surplus And Fees</SectionSubheader>
          <Row label="Estimated Surplus" value={fmt(liveSurplus)} />
          {sourceSurplus != null && (
            <div className="grid grid-cols-[150px_1fr] leading-[1.85]">
              <span className={FIELD_LABEL}>Source Surplus</span>
              <span>
                <span className={FIELD_VALUE}>{fmt(sourceSurplus)}</span>
                <span className="ml-1.5 text-[10.5px] text-gray-400">
                  · As Reported By Lead Source
                </span>
              </span>
            </div>
          )}
          <ConfirmedSurplusRow value={confirmed} onCommit={commitConfirmed} />
          <Row label="Total Liens" value={fmt(liensTotal)} />
          <Row
            label="Recovery Fee"
            value={`${recoveryFeePercent}% · ${fmt(liveFeeAmount)}`}
          />
          <Row label="Attorney Cost" value={fmt(attorneyCost)} />
        </div>
      </div>

      {/* Hero Net Payout */}
      <div className="mt-4 grid grid-cols-[150px_1fr] items-center rounded border-l-[3px] border-petrol-500 bg-gradient-to-r from-petrol-50 to-petrol-100 px-3 py-2">
        <span className="text-[13px] font-medium text-petrol-700">
          Est. Net Surplus
        </span>
        <span>
          <span className="block text-[18px] font-medium tracking-tight text-petrol-500">
            {fmt(liveNetPayout)}
          </span>
          <span className="block text-[10.5px] text-petrol-700">
            {surplusBasisLabel(basis)}
          </span>
        </span>
      </div>
    </div>
  );
}

// Field label / value typography (Fix AA): label 13px / 400 / #64748b,
// value 14px / 500 / #0f1729 — both clearly outranked by the SectionSubheader.
const FIELD_LABEL = "text-[13px] font-normal text-[#64748b]";
const FIELD_VALUE = "text-[14px] font-medium text-[#0f1729]";

function MoneyRow({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number | null;
  onCommit: (n: number | null) => void;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>{label}</span>
      <CurrencyInput
        value={value}
        onCommit={onCommit}
        prefix="$"
        align="left"
        placeholder="0"
        className="w-[150px]"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>{label}</span>
      <span className={FIELD_VALUE}>{value}</span>
    </div>
  );
}

// Fix Z: the only manually entered value in this column. Click it to edit;
// blur or Enter saves; shows "Not Yet Confirmed" only while empty.
function ConfirmedSurplusRow({
  value,
  onCommit,
}: {
  value: number | null;
  onCommit: (n: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="grid grid-cols-[150px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>Confirmed Surplus</span>
      {editing ? (
        <CurrencyInput
          value={value}
          onCommit={(n) => {
            onCommit(n);
            setEditing(false);
          }}
          prefix="$"
          align="left"
          placeholder="Not Yet Confirmed"
          autoFocus
          className="w-[160px]"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Edit confirmed surplus"
          className="group -ml-1.5 inline-flex w-fit cursor-text items-center gap-1.5 rounded-md px-1.5 py-[2px] hover:bg-gray-100"
        >
          <span
            className={
              value != null ? FIELD_VALUE : "text-[14px] italic text-gray-400"
            }
          >
            {value != null ? fmt(value) : "Not Yet Confirmed"}
          </span>
          <IconPencil
            size={12}
            stroke={1.75}
            className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </button>
      )}
    </div>
  );
}
