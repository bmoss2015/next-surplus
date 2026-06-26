"use client";

// Owner Customer Pricing panel.
//
// Layout per Bree's spec: B&W on the left, Color on the right. Mail
// classes (Standard, First Class) listed within each color. Sort order
// is cheapest-to-most-expensive: Standard before First Class. Certified
// is hidden entirely until the Lob Startup plan is active (Developer
// tier doesn't support certified).
//
// No subscription card. No Quick Math footer. Just price grids.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerPricingData } from "@/lib/owner/fetch";
import type { LobPricing } from "@/lib/mail/types";
import { updateCustomerPricing } from "@/lib/owner/actions";
import { useSaveBarSection } from "@/Components/SettingsSaveBar";

type PriceKey = keyof Omit<LobPricing, "tier_label">;

function fmtMoney(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function centsToDollarsInput(c: number): string {
  return (c / 100).toFixed(2);
}

function dollarsToCents(s: string): number {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

type LetterClassRow = {
  label: string;
  bwKey: PriceKey;
  colorKey: PriceKey;
};

// Cheapest first per Bree's preference (Standard postage < First Class).
const LETTER_CLASSES: LetterClassRow[] = [
  {
    label: "Standard Class",
    bwKey: "letter_standard_bw",
    colorKey: "letter_standard_color",
  },
  {
    label: "First Class",
    bwKey: "letter_first_class_bw",
    colorKey: "letter_first_class_color",
  },
];

const EXTRA_PAGE_ROWS: { label: string; key: PriceKey }[] = [
  { label: "B&W Extra Page", key: "letter_extra_page_bw" },
  { label: "Color Extra Page", key: "letter_extra_page_color" },
];

const CHECK_ROWS: { label: string; key: PriceKey }[] = [
  { label: "Check (Base)", key: "check_base" },
  { label: "Check Attachment Page", key: "check_extra_attachment_page" },
];

const SURCHARGE_ROWS: { label: string; key: PriceKey }[] = [
  {
    label: "Letter Over 6 Sheets (USPS Weight Surcharge)",
    key: "letter_over_6_sheet_fee" as PriceKey,
  },
];

export function CustomerPricingSection({
  data,
}: {
  data: CustomerPricingData;
}) {
  const router = useRouter();

  const allKeys: PriceKey[] = [
    ...LETTER_CLASSES.flatMap((c) => [c.bwKey, c.colorKey]),
    ...EXTRA_PAGE_ROWS.map((r) => r.key),
    ...CHECK_ROWS.map((r) => r.key),
    ...SURCHARGE_ROWS.map((r) => r.key),
  ];

  const initialRetails = (() => {
    const out: Record<string, string> = {};
    for (const k of allKeys) {
      const v = data.customer_mail_pricing_cents[k];
      out[k] = centsToDollarsInput(typeof v === "number" ? v : 0);
    }
    return out;
  })();
  const [retails, setRetails] = useState<Record<string, string>>(initialRetails);

  function setRetail(key: string, value: string) {
    setRetails((prev) => ({ ...prev, [key]: value }));
  }

  // Dirty when any input no longer matches the initial value.
  const isDirty = allKeys.some(
    (k) => (retails[k] ?? "") !== (initialRetails[k] ?? "")
  );

  const save = useCallback(async () => {
    const built: Partial<LobPricing> = {
      tier_label: data.customer_mail_pricing_cents.tier_label ?? "Standard",
    };
    for (const k of Object.keys(
      data.customer_mail_pricing_cents
    ) as Array<keyof LobPricing>) {
      if (k === "tier_label") continue;
      built[k] = data.customer_mail_pricing_cents[k] as number;
    }
    for (const k of allKeys) {
      built[k] = dollarsToCents(retails[k] ?? "0");
    }
    const res = await updateCustomerPricing({
      subscription_monthly_cents: data.subscription_monthly_cents,
      customer_mail_pricing_cents: built,
    });
    if (!res.ok) return { ok: false as const, error: res.error };
    router.refresh();
    return { ok: true as const };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retails, data]);

  const discard = useCallback(() => {
    setRetails(initialRetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useSaveBarSection("owner-customer-pricing", { isDirty, save, discard });

  return (
    <div className="mx-auto w-full max-w-[960px] px-8 pb-32 pt-10">
      <div>
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.026em] text-[#0a0d14]">
          Customer Pricing
        </h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-[#5b606a]">
          What Lob charges, what customers are charged, and the margin per piece. Edit any customer price. Changes save automatically.
        </p>
      </div>

      <PriceCard eyebrow="Letters" title="Black &amp; White vs Color" intro="Cheapest postage class first.">
        <div className="grid grid-cols-2 divide-x divide-[#f1f2f4]">
          <ClassGrid
            heading="Black &amp; White"
            classes={LETTER_CLASSES}
            keySelector={(c) => c.bwKey}
            data={data}
            retails={retails}
            setRetail={setRetail}
          />
          <ClassGrid
            heading="Color"
            classes={LETTER_CLASSES}
            keySelector={(c) => c.colorKey}
            data={data}
            retails={retails}
            setRetail={setRetail}
          />
        </div>
      </PriceCard>

      <PriceCard eyebrow="Letters" title="Extra Pages" intro="Per additional page when a letter exceeds the standard page count.">
        <FlatRowsTable
          rows={EXTRA_PAGE_ROWS}
          data={data}
          retails={retails}
          setRetail={setRetail}
        />
      </PriceCard>

      <PriceCard eyebrow="Checks" title="Check Mailing" intro="Per check sent through the platform.">
        <FlatRowsTable
          rows={CHECK_ROWS}
          data={data}
          retails={retails}
          setRetail={setRetail}
        />
      </PriceCard>

      <PriceCard eyebrow="Surcharges" title="Weight And Special Handling" intro="Added when conditions trigger them.">
        <FlatRowsTable
          rows={SURCHARGE_ROWS}
          data={data}
          retails={retails}
          setRetail={setRetail}
        />
      </PriceCard>
    </div>
  );
}

function PriceCard({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <header
        className="border-b border-[#f1f2f4] px-7 py-5"
      >
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#0d4b3a]">{eyebrow}</div>
        <div className="mt-1.5 text-[17px] font-semibold tracking-[-0.018em] text-[#0a0d14]" dangerouslySetInnerHTML={{ __html: title }} />
        {intro && <div className="mt-1 text-[12.5px] text-[#5b606a]">{intro}</div>}
      </header>
      {children}
    </section>
  );
}

function ClassGrid({
  heading,
  classes,
  keySelector,
  data,
  retails,
  setRetail,
}: {
  heading: string;
  classes: LetterClassRow[];
  keySelector: (c: LetterClassRow) => PriceKey;
  data: CustomerPricingData;
  retails: Record<string, string>;
  setRetail: (key: string, value: string) => void;
}) {
  return (
    <div className="px-5 py-4">
      <div
        className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "#5b606a" }}
        dangerouslySetInnerHTML={{ __html: heading }}
      />
      <table className="w-full text-[13px]">
        <thead>
          <tr
            className="text-left text-[10.5px] uppercase tracking-wider text-gray-500"
            style={{ borderBottom: "1px solid #f1f2f4" }}
          >
            <th className="py-1.5 pr-2 font-medium">Class</th>
            <th className="py-1.5 px-2 text-right font-medium">Your Cost</th>
            <th className="py-1.5 px-2 text-right font-medium">Customer</th>
            <th className="py-1.5 pl-2 text-right font-medium">Margin</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((c) => {
            const k = keySelector(c);
            const costCents = data.wholesale_pricing_cents?.[k];
            const retailCents = dollarsToCents(retails[k] ?? "0");
            const margin =
              typeof costCents === "number" ? retailCents - costCents : null;
            const isLoss = margin !== null && margin < 0;
            return (
              <tr key={k} style={{ borderBottom: "1px solid #f1f2f4" }}>
                <td className="py-2 pr-2 text-ink">{c.label}</td>
                <td className="py-2 px-2 text-right">
                  <span className="inline-flex items-center rounded-[5px] bg-[#f1f2f4] px-2 py-1 text-[12px] tabular-nums text-[#0a0d14]">
                    {fmtMoney(costCents)}
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    <span className="text-[12px] text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={retails[k] ?? ""}
                      onChange={(e) => setRetail(k, e.target.value)}
                      className="w-[80px] rounded-md px-2 py-1 text-right tabular-nums text-[13px] text-ink focus:outline-none"
                      style={{ border: "1px solid #ebedf0" }}
                    />
                  </div>
                </td>
                <td
                  className="py-2 pl-2 text-right tabular-nums"
                  style={{
                    color:
                      margin == null ? "#9298a3" : isLoss ? "#b42318" : "#067647",
                  }}
                >
                  {margin == null ? "—" : fmtMoney(margin)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FlatRowsTable({
  rows,
  data,
  retails,
  setRetail,
}: {
  rows: { label: string; key: PriceKey }[];
  data: CustomerPricingData;
  retails: Record<string, string>;
  setRetail: (key: string, value: string) => void;
}) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr
          className="text-left text-[11px] uppercase tracking-wider text-gray-500"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <th className="px-5 py-2 font-medium">Product</th>
          <th className="px-5 py-2 text-right font-medium">Your Cost</th>
          <th className="px-5 py-2 text-right font-medium">Customer Pays</th>
          <th className="px-5 py-2 text-right font-medium">Margin</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const costCents = data.wholesale_pricing_cents?.[r.key];
          const retailCents = dollarsToCents(retails[r.key] ?? "0");
          const margin =
            typeof costCents === "number" ? retailCents - costCents : null;
          const isLoss = margin !== null && margin < 0;
          return (
            <tr key={r.key} style={{ borderBottom: "1px solid #f1f2f4" }}>
              <td className="px-5 py-2.5 text-ink">{r.label}</td>
              <td className="px-5 py-2.5 text-right">
                <span className="inline-flex items-center rounded-[5px] bg-[#f1f2f4] px-2 py-1 text-[12px] tabular-nums text-[#0a0d14]">
                  {fmtMoney(costCents)}
                </span>
              </td>
              <td className="px-5 py-2.5 text-right">
                <div className="inline-flex items-center gap-1">
                  <span className="text-[12px] text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={retails[r.key] ?? ""}
                    onChange={(e) => setRetail(r.key, e.target.value)}
                    className="w-[88px] rounded-md px-2 py-1 text-right tabular-nums text-[13px] text-ink focus:outline-none"
                    style={{ border: "1px solid #ebedf0" }}
                  />
                </div>
              </td>
              <td
                className="px-5 py-2.5 text-right tabular-nums"
                style={{
                  color:
                    margin == null ? "#9298a3" : isLoss ? "#b42318" : "#067647",
                }}
              >
                {margin == null ? "—" : fmtMoney(margin)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
