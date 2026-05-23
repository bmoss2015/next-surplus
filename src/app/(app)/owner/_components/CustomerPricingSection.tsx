"use client";

// Owner Customer Pricing panel.
//
// One screen showing every mail product. Three columns of truth per row:
// what Lob charges you, what you charge the customer, and the resulting
// margin. Grouped by product family (Letters | Extra Pages | Checks) so
// the B&W-vs-Color and First-Class-vs-Standard-vs-Certified variations
// stack visually instead of cramming into one flat list.
//
// Subscription field intentionally not exposed yet. Bree is launching
// pay-per-piece only (matching Excess Elite's model). Subscription tier
// is a later add-on. The database column stays in place for that future.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomerPricingData } from "@/lib/owner/fetch";
import type { LobPricing } from "@/lib/mail/types";
import { updateCustomerPricing } from "@/lib/owner/actions";

type PriceKey = keyof Omit<LobPricing, "tier_label">;

function fmtMoney(cents: number | null | undefined, places = 3): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(places)}`;
}

function centsToDollarsInput(c: number): string {
  return (c / 100).toFixed(2);
}

function dollarsToCents(s: string): number {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

type RowSpec = {
  key: PriceKey;
  label: string;
};

const LETTER_ROWS: Array<{ heading: string; rows: RowSpec[] }> = [
  {
    heading: "First Class",
    rows: [
      { key: "letter_first_class_bw", label: "B&W" },
      { key: "letter_first_class_color", label: "Color" },
    ],
  },
  {
    heading: "Standard Class",
    rows: [
      { key: "letter_standard_bw", label: "B&W" },
      { key: "letter_standard_color", label: "Color" },
    ],
  },
  {
    heading: "Certified",
    rows: [
      { key: "letter_certified_bw", label: "B&W" },
      { key: "letter_certified_color", label: "Color" },
    ],
  },
];

const EXTRA_PAGE_ROWS: RowSpec[] = [
  { key: "letter_extra_page_bw", label: "B&W extra page" },
  { key: "letter_extra_page_color", label: "Color extra page" },
];

const CHECK_ROWS: RowSpec[] = [
  { key: "check_base", label: "Check (base)" },
  { key: "check_extra_attachment_page", label: "Check attachment page" },
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

  // Inputs hold the retail price (what you charge customers) as a
  // dollars-with-decimals string so the user can type "1.25" naturally.
  // Lob cost and margin are computed live from the cost data and never
  // typed in.
  const [retails, setRetails] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const r of [
      ...LETTER_ROWS.flatMap((g) => g.rows),
      ...EXTRA_PAGE_ROWS,
      ...CHECK_ROWS,
    ]) {
      out[r.key] = centsToDollarsInput(data.customer_mail_pricing_cents[r.key]);
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
    for (const r of [
      ...LETTER_ROWS.flatMap((g) => g.rows),
      ...EXTRA_PAGE_ROWS,
      ...CHECK_ROWS,
    ]) {
      built[r.key] = dollarsToCents(retails[r.key] ?? "0");
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

  // Quick-math helpers for the ROI footer.
  const bwFcCustomerCents = dollarsToCents(retails.letter_first_class_bw ?? "0");
  const bwFcLobCents =
    data.wholesale_pricing_cents?.letter_first_class_bw ?? 0;
  const bwFcMarginCents = bwFcCustomerCents - bwFcLobCents;

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

      {/* Letters card --------------------------------------------------- */}
      <PriceCard title="Letters">
        <PriceTable>
          {LETTER_ROWS.map((group) => (
            <PriceGroupRows
              key={group.heading}
              groupLabel={group.heading}
              rows={group.rows}
              data={data}
              retails={retails}
              setRetail={setRetail}
            />
          ))}
        </PriceTable>
      </PriceCard>

      {/* Extra pages card ----------------------------------------------- */}
      <PriceCard title="Extra Pages" subtitle="Added per extra page beyond the first page of a letter.">
        <PriceTable>
          <PriceGroupRows
            rows={EXTRA_PAGE_ROWS}
            data={data}
            retails={retails}
            setRetail={setRetail}
          />
        </PriceTable>
      </PriceCard>

      {/* Checks card ---------------------------------------------------- */}
      <PriceCard title="Checks" subtitle="Lob check products. Attachment page applies when the check is mailed with an enclosed letter.">
        <PriceTable>
          <PriceGroupRows
            rows={CHECK_ROWS}
            data={data}
            retails={retails}
            setRetail={setRetail}
          />
        </PriceTable>
      </PriceCard>

      {/* Quick math footer --------------------------------------------- */}
      <div
        className="mt-6 rounded-lg px-5 py-4 text-[12.5px]"
        style={{
          border: "1px solid #ebedf0",
          background: "#f6f7f9",
          color: "#1a1d24",
        }}
      >
        <div className="mb-2 text-[13px] font-semibold">Quick math</div>
        <div className="text-[12.5px] text-gray-700">
          B&amp;W First Class letter: you pay Lob{" "}
          <span className="font-mono">{fmtMoney(bwFcLobCents)}</span>, customer
          pays you{" "}
          <span className="font-mono">
            {fmtMoney(bwFcCustomerCents, 2)}
          </span>
          , your margin is{" "}
          <span
            className="font-mono"
            style={{ color: bwFcMarginCents < 0 ? "#b42318" : "#067647" }}
          >
            {fmtMoney(bwFcMarginCents)}
          </span>{" "}
          per piece.
        </div>
        <div className="mt-1 text-[12.5px] text-gray-700">
          At 50 letters per customer per month:{" "}
          <span className="font-mono">
            {fmtMoney(bwFcMarginCents * 50, 2)}
          </span>{" "}
          margin per customer. At 5 customers, that's{" "}
          <span className="font-mono">
            {fmtMoney(bwFcMarginCents * 50 * 5, 2)}
          </span>{" "}
          / month from B&amp;W First Class letters alone.
        </div>
      </div>
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

function PriceTable({ children }: { children: React.ReactNode }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr
          className="text-left text-[11px] uppercase tracking-wider text-gray-500"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <th className="px-5 py-2 font-medium">Product</th>
          <th className="px-5 py-2 text-right font-medium">Your Cost (Lob)</th>
          <th className="px-5 py-2 text-right font-medium">Customer Pays</th>
          <th className="px-5 py-2 text-right font-medium">Margin</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function PriceGroupRows({
  groupLabel,
  rows,
  data,
  retails,
  setRetail,
}: {
  groupLabel?: string;
  rows: RowSpec[];
  data: CustomerPricingData;
  retails: Record<string, string>;
  setRetail: (key: string, value: string) => void;
}) {
  return (
    <>
      {groupLabel && (
        <tr>
          <td
            colSpan={4}
            className="px-5 pt-3 pb-1 text-[11px] uppercase tracking-wider"
            style={{ color: "#5b606a", fontWeight: 600 }}
          >
            {groupLabel}
          </td>
        </tr>
      )}
      {rows.map((r) => {
        const costCents = data.wholesale_pricing_cents?.[r.key];
        const retailCents = dollarsToCents(retails[r.key] ?? "0");
        const margin =
          typeof costCents === "number" ? retailCents - costCents : null;
        const isLoss = margin !== null && margin < 0;
        return (
          <tr
            key={r.key}
            style={{ borderBottom: "1px solid #f1f2f4" }}
          >
            <td className="px-5 py-2.5 text-ink" style={{ paddingLeft: 32 }}>
              {r.label}
            </td>
            <td className="px-5 py-2.5 text-right font-mono text-gray-600">
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
                  className="w-[88px] rounded-md px-2 py-1 text-right font-mono text-[13px] text-ink focus:outline-none"
                  style={{ border: "1px solid #ebedf0" }}
                />
              </div>
            </td>
            <td
              className="px-5 py-2.5 text-right font-mono"
              style={{
                color: margin == null ? "#9298a3" : isLoss ? "#b42318" : "#067647",
              }}
            >
              {margin == null ? "—" : fmtMoney(margin)}
            </td>
          </tr>
        );
      })}
    </>
  );
}
