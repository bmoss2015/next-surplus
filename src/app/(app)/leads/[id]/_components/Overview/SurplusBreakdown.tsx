"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import { addLien, updateLien, removeLien } from "../../_actions";
import type { LienRow } from "@/lib/leads/fetch-detail";
import { formatCurrency } from "@/lib/leads/format";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useConfirmedSurplus } from "../ConfirmedSurplusContext";
import { SectionSubheader } from "../SectionSubheader";

function fmt(value: number | null | undefined): string {
  return formatCurrency(value);
}

type LocalLien = LienRow & { _tempId?: string };

// Fix IIII2: the surplus numbers (Confirmed / Calculated / Est. Net Surplus)
// live in the metric strip at the top of the page — this section is just the
// Liens inputs and the Fees breakdown (Total Liens, Recovery Fee $, Attorney
// Cost). The recovery-fee dollar amount still tracks the active surplus
// (confirmed when set, otherwise the closing bid − debt − costs − liens value).
export function SurplusBreakdown({
  leadId,
  closingBid,
  outstandingDebt,
  courtCosts,
  liens: initialLiens,
  recoveryFeePercent,
  attorneyCost,
}: {
  leadId: string;
  closingBid: number | null;
  outstandingDebt: number | null;
  courtCosts: number | null;
  liens: LienRow[];
  recoveryFeePercent: number;
  attorneyCost: number;
}) {
  const [liens, setLiens] = useState<LocalLien[]>(initialLiens);
  const { confirmedSurplus: confirmed } = useConfirmedSurplus();
  const [, startTransition] = useTransition();

  const liensTotal = liens.reduce((sum, l) => sum + (l.amount ?? 0), 0);

  const calculatedSurplus =
    closingBid != null
      ? closingBid - (outstandingDebt ?? 0) - (courtCosts ?? 0) - liensTotal
      : null;
  const hasConfirmed = confirmed != null && confirmed !== 0;
  const surplusForMath = hasConfirmed ? (confirmed as number) : calculatedSurplus ?? 0;
  const feeAmount = surplusForMath * (recoveryFeePercent / 100);

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
      <h3 className="section-subheader">Surplus Breakdown</h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
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
          <SectionSubheader>Fees</SectionSubheader>
          <Row label="Total Liens" value={fmt(liensTotal)} />
          <Row
            label="Recovery Fee"
            value={`${recoveryFeePercent}% · ${fmt(feeAmount)}`}
          />
          <Row label="Attorney Cost" value={fmt(attorneyCost)} />
        </div>
      </div>
    </div>
  );
}

// Field label / value typography (Fix AA): label 13px / 400 / #64748b,
// value 14px / 500 / #0f1729 — both clearly outranked by the SectionSubheader.
const FIELD_LABEL = "text-[13px] font-normal text-[#64748b]";
const FIELD_VALUE = "text-[14px] font-medium text-[#0f1729]";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center leading-[1.85]">
      <span className={FIELD_LABEL}>{label}</span>
      <span className={FIELD_VALUE}>{value}</span>
    </div>
  );
}
