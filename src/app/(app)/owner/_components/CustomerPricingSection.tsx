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

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomerPricingData } from "@/lib/owner/fetch";
import type { LobPricing } from "@/lib/mail/types";
import {
  updateCustomerPricing,
  setPreflightVerifyEnabled,
} from "@/lib/owner/actions";
import { useSaveBarSection } from "@/components/SettingsSaveBar";

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
    <div className="mx-auto max-w-[1100px] px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink">
          Customer Pricing
        </h1>
        <p className="mt-1 text-[13px] text-gray-600">
          What Lob charges you, what you charge customers, and the margin
          per piece. Edit any retail price; changes save via the bar at
          the bottom-right.
        </p>
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

      {/* Surcharges card ------------------------------------------------ */}
      <PriceCard title="Surcharges">
        <FlatRowsTable
          rows={SURCHARGE_ROWS}
          data={data}
          retails={retails}
          setRetail={setRetail}
        />
      </PriceCard>

      {/* Address Verification toggle ------------------------------------ */}
      <PreflightToggle initialEnabled={data.preflight_verify_enabled} />
    </div>
  );
}

function PreflightToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setErr(null);
    startTransition(async () => {
      const res = await setPreflightVerifyEnabled({ enabled: next });
      if (!res.ok) {
        setErr(res.error);
        setEnabled(!next);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section
      className="mb-5 rounded-lg bg-white"
      style={{ border: "1px solid #ebedf0" }}
    >
      <header
        className="px-5 py-3.5"
        style={{ borderBottom: "1px solid #ebedf0" }}
      >
        <div className="text-[14px] font-semibold text-ink">
          Address Verification
        </div>
        <div className="text-[11.5px] text-gray-500">
          Pre-flight verification calls Lob to check the recipient address
          before send. Each call costs ~$0.05 on Lob Developer tier. The
          retail rates above bake this cost in, so leaving it on doesn't
          eat your margin.
        </div>
      </header>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="text-[13px] text-ink">
          {enabled ? (
            <>
              <span className="font-medium">On.</span> Bad addresses surface
              as inline pills before the customer clicks Send.
            </>
          ) : (
            <>
              <span className="font-medium">Off.</span> Verification runs at
              Lob send time only; bad addresses show as a friendly error
              after click.
            </>
          )}
          {err && (
            <div
              className="mt-1 text-[11.5px]"
              style={{ color: "#b42318" }}
            >
              {err}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="cursor-pointer rounded-full transition-colors disabled:opacity-60"
          style={{
            width: 44,
            height: 24,
            background: enabled ? "#0d4b3a" : "#cbd5d1",
            position: "relative",
          }}
          aria-label="Toggle pre-flight verification"
        >
          <span
            className="absolute top-[3px] rounded-full bg-white transition-all"
            style={{
              left: enabled ? 23 : 3,
              width: 18,
              height: 18,
            }}
          />
        </button>
      </div>
    </section>
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
