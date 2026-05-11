"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import {
  updateLeadField,
  addLien,
  updateLien,
  removeLien,
} from "../../_actions";
import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency } from "@/lib/leads/format";
import { CurrencyInput } from "@/components/CurrencyInput";

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
  confirmedSurplus,
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
  confirmedSurplus: number | null;
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
  const [confirmed, setConfirmed] = useState<number | null>(confirmedSurplus);
  const [, startTransition] = useTransition();

  const liensTotal = liens.reduce((sum, l) => sum + (l.amount ?? 0), 0);

  // Optimistic estimated surplus = closing bid - outstanding debt - court costs
  // - sum(liens). DB regenerates the authoritative value on revalidate.
  const liveSurplus = (() => {
    const cb = fin.closing_bid;
    if (cb == null) return estimatedSurplus;
    const od = fin.outstanding_debt ?? 0;
    const cc = fin.court_costs ?? 0;
    return cb - od - cc - liensTotal;
  })();

  const surplusForFee = liveSurplus ?? 0;
  const liveFeeAmount = surplusForFee * (recoveryFeePercent / 100);
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
      <h3 className="m-0 mb-4 text-[14px] font-medium tracking-tight text-ink">
        Surplus Breakdown
      </h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-2 text-[10px] tracking-[0.5px] font-medium text-gray-500">
            Sale Financials
          </div>
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

          <div className="mt-4 mb-2 flex items-center justify-between">
            <div className="text-[10px] tracking-[0.5px] font-medium text-gray-500">
              Liens
            </div>
            <button
              type="button"
              onClick={onAddLien}
              className="inline-flex cursor-pointer items-center gap-1 rounded border border-petrol-500 px-2 py-[2px] text-[11px] font-medium text-petrol-500 hover:bg-petrol-50"
            >
              <IconPlus size={12} stroke={2} />
              Add Lien
            </button>
          </div>
          {liens.length === 0 ? (
            <div className="text-[12px] text-gray-400">No Liens On File.</div>
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
                    className="min-w-0 flex-1 rounded-md border border-gray-200 bg-surface px-2 py-[6px] text-[12.5px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500"
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
        </div>

        <div>
          <div className="mb-2 text-[10px] tracking-[0.5px] font-medium text-gray-500">
            Surplus And Fees
          </div>
          <Row label="Estimated Surplus" value={fmt(liveSurplus)} strong />
          <div className="grid grid-cols-[150px_1fr] items-center text-[12.5px] leading-[1.85]">
            <span className="text-gray-500">Confirmed Surplus</span>
            <div className="flex items-center gap-2">
              <CurrencyInput
                value={confirmed}
                onCommit={commitConfirmed}
                prefix="$"
                align="left"
                placeholder="Not Yet Confirmed"
                className="w-[150px]"
              />
              {confirmed == null && (
                <span className="text-[11px] text-gray-400">Not Yet Confirmed</span>
              )}
            </div>
          </div>
          <Row label="Total Liens" value={fmt(liensTotal)} />
          <div className="grid grid-cols-[150px_1fr] items-center text-[12.5px] leading-[1.85]">
            <span className="text-gray-500">Recovery Fee</span>
            <span className="text-gray-500">
              {recoveryFeePercent}% · {fmt(liveFeeAmount)}
            </span>
          </div>
          <Row label="Attorney Cost" value={fmt(attorneyCost)} />
        </div>
      </div>

      {/* Hero Net Payout */}
      <div className="mt-4 grid grid-cols-[150px_1fr] items-center rounded border-l-[3px] border-petrol-500 bg-gradient-to-r from-petrol-50 to-petrol-100 px-3 py-2">
        <span className="text-[13px] font-medium text-petrol-700">
          Est. Net To You
        </span>
        <span className="text-[18px] font-medium tracking-tight text-petrol-500">
          {fmt(liveNetPayout)}
        </span>
      </div>
    </div>
  );
}

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
    <div className="grid grid-cols-[150px_1fr] items-center text-[12.5px] leading-[1.85]">
      <span className="text-gray-500">{label}</span>
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

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] text-[12.5px] leading-[1.85]">
      <span className="text-gray-500">{label}</span>
      <span className={strong ? "font-medium text-ink" : "text-ink"}>{value}</span>
    </div>
  );
}
