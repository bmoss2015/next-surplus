"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/Drawer";
import { SALE_TYPES, SALE_TYPE_LABELS, type SaleType } from "@/lib/leads/types";
import { createLead } from "../_actions";

export function NewLeadDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("SC");
  const [zip, setZip] = useState("");
  const [county, setCounty] = useState("");
  const [saleType, setSaleType] = useState<SaleType>("TAX");
  const [saleDate, setSaleDate] = useState("");
  const [closingBid, setClosingBid] = useState("");
  const [outstandingDebt, setOutstandingDebt] = useState("");
  const [courtCosts, setCourtCosts] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setAddress("");
    setCity("");
    setStateCode("SC");
    setZip("");
    setCounty("");
    setSaleType("TAX");
    setSaleDate("");
    setClosingBid("");
    setOutstandingDebt("");
    setCourtCosts("");
    setError(null);
  }

  function handleSave() {
    setError(null);
    if (!address.trim() || !city.trim() || !zip.trim()) {
      setError("Address, city, and ZIP are required.");
      return;
    }
    startTransition(async () => {
      const result = await createLead({
        address: address.trim(),
        city: city.trim(),
        state: stateCode,
        zip: zip.trim(),
        county: county.trim() || null,
        sale_type: saleType,
        sale_date: saleDate || null,
        closing_bid: closingBid ? Number(closingBid) : null,
        outstanding_debt: outstandingDebt ? Number(outstandingDebt) : null,
        court_costs: courtCosts ? Number(courtCosts) : null,
      });
      if (result.ok) {
        reset();
        onClose();
        router.push(`/leads/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-surface px-3 py-2 text-[13px] text-ink outline-none placeholder:text-gray-400 focus:border-petrol-500";
  const labelClass =
    "block text-[10px] tracking-[0.5px] font-medium text-gray-500 mb-1";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New Lead"
      description="Manually create a single lead. For batches, use Imports."
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="2847 Magnolia Ave"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-[1fr_70px_100px] gap-2">
          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Charleston"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className={inputClass}
            >
              <option value="SC">SC</option>
              <option value="TN">TN</option>
              <option value="PA">PA</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>ZIP</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="29401"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>County</label>
          <input
            type="text"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="Charleston"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Sale Type</label>
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value as SaleType)}
              className={inputClass}
            >
              {SALE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SALE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Sale Date</label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelClass}>Closing Bid</label>
            <input
              type="number"
              min={0}
              value={closingBid}
              onChange={(e) => setClosingBid(e.target.value)}
              placeholder="142000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Outstanding Debt</label>
            <input
              type="number"
              min={0}
              value={outstandingDebt}
              onChange={(e) => setOutstandingDebt(e.target.value)}
              placeholder="54800"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Court Costs</label>
            <input
              type="number"
              min={0}
              value={courtCosts}
              onChange={(e) => setCourtCosts(e.target.value)}
              placeholder="3000"
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={pending}
            className="rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs text-ink hover:border-petrol-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="rounded-md btn-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving" : "Create Lead"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
