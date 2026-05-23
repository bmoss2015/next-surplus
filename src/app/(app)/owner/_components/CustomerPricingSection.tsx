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

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomerPricingData } from "@/lib/owner/fetch";
import type { LobPricing } from "@/lib/mail/types";
import { updateCustomerPricing } from "@/lib/owner/actions";

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

export function CustomerPricingSection({
  data,
}: {
  data: CustomerPricingData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const allKeys: PriceKey[] = [
    ...LETTER_CLASSES.flatMap((c) => [c.bwKey, c.colorKey]),
    ...EXTRA_PAGE_ROWS.map((r) => r.key),
    ...CHECK_ROWS.map((r) => r.key),
  ];

  const [retails, setRetails] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const k of allKeys) {
      out[k] = centsToDollarsInput(data.customer_mail_pricing_cents[k]);
    }
    return out;
  });

  function setRetail(key: string, value: string) {
    setRetails((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function save() {
    setError(null);
    setSaved(false);
    const built: Partial<LobPricing> = {
      tier_label: data.customer_mail_pricing_cents.tier_label ?? "Standard",
    };
    // Carry forward the certified rows untouched (still in DB, just not
    // edited here). Same for any other key not in the visible set.
    for (const k of Object.keys(
      data.customer_mail_pricing_cents
    ) as Array<keyof LobPricing>) {
      if (k === "tier_label") continue;
      built[k] = data.customer_mail_pricing_cents[k] as number;
    }
    for (const k of allKeys) {
      built[k] = dollarsToCents(retails[k] ?? "0");
    }
    startTransition(async () => {
      const res = await updateCustomerPricing({
        subscription_monthly_cents: data.subscription_monthly_cents,
        customer_mail_pricing_cents: built,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-ink">
            Customer Pricing
          </h1>
          <p className="mt-1 text-[13px] text-gray-600">
            What Lob charges you, what you charge customers, and the margin
            per piece. Edit any retail price and Save.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[12px]" style={{ color: "#067647" }}>
              Saved.
            </span>
          )}
          {error && (
            <span className="text-[12px]" style={{ color: "#b42318" }}>
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="cursor-pointer rounded-md px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
            style={{ background: "#0d4b3a" }}
          >
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Letters card — B&W on the left, Color on the right ---------- */}
      <PriceCard title="Letters">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
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

      {/* Extra pages card ----------------------------------------------- */}
      <PriceCard title="Extra Pages">
        <FlatRowsTable
          rows={EXTRA_PAGE_ROWS}
          data={data}
          retails={retails}
          setRetail={setRetail}
        />
      </PriceCard>

      {/* Checks card ---------------------------------------------------- */}
      <PriceCard title="Checks">
        <FlatRowsTable
          rows={CHECK_ROWS}
          data={data}
          retails={retails}
          setRetail={setRetail}
        />
      </PriceCard>
    </div>
  );
}

function PriceCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mb-5 rounded-lg bg-white"
      style={{ border: "1px solid #ebedf0" }}
    >
      <header
        className="px-5 py-3.5"
        style={{ borderBottom: "1px solid #ebedf0" }}
      >
        <div className="text-[14px] font-semibold text-ink">{title}</div>
        {subtitle && (
          <div className="text-[11.5px] text-gray-500">{subtitle}</div>
        )}
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
                <td className="py-2 px-2 text-right tabular-nums text-gray-600">
                  {fmtMoney(costCents)}
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
              <td className="px-5 py-2.5 text-right tabular-nums text-gray-600">
                {fmtMoney(costCents)}
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
