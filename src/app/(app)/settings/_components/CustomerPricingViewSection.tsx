"use client";

// Customer-facing pricing view, read-only.
//
// Shows what THIS org pays per piece of mail sent through the platform.
// Layout: B&W on the left, Color on the right, mail classes within each.
// Subscription card and certified rows intentionally omitted — there's
// no subscription product right now, and certified isn't available on
// the underlying Lob plan.

import type { CustomerPricingViewData } from "@/lib/settings/fetch";

type ClassRow = {
  label: string;
  bw: number;
  color: number;
};

function fmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CustomerPricingViewSection({
  data,
}: {
  data: CustomerPricingViewData | null;
}) {
  if (!data) {
    return (
      <div className="mx-auto max-w-[760px] px-8 py-8 text-[13px] text-gray-600">
        Pricing has not been configured yet.
      </div>
    );
  }

  const p = data.customer_mail_pricing_cents;
  const classes: ClassRow[] = [
    { label: "Standard Class", bw: p.letter_standard_bw, color: p.letter_standard_color },
    { label: "First Class", bw: p.letter_first_class_bw, color: p.letter_first_class_color },
  ];

  return (
    <div className="mx-auto max-w-[860px] px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-ink">Pricing</h1>
        <p className="mt-1 text-[13px] text-gray-600">
          What you pay per piece of mail sent through the platform. All
          rates include printing, postage, and envelope.
        </p>
      </div>

      <section
        className="mb-5 rounded-lg bg-white"
        style={{ border: "1px solid #ebedf0" }}
      >
        <header
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <div className="text-[14px] font-semibold text-ink">Letters</div>
        </header>
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <CustomerPriceColumn heading="Black & White" classes={classes} pick="bw" />
          <CustomerPriceColumn heading="Color" classes={classes} pick="color" />
        </div>
      </section>

      <section
        className="mb-5 rounded-lg bg-white"
        style={{ border: "1px solid #ebedf0" }}
      >
        <header
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <div className="text-[14px] font-semibold text-ink">Extra Pages</div>
        </header>
        <FlatRowsView
          rows={[
            { label: "B&W Extra Page", cents: p.letter_extra_page_bw },
            { label: "Color Extra Page", cents: p.letter_extra_page_color },
          ]}
        />
      </section>

      <section
        className="mb-5 rounded-lg bg-white"
        style={{ border: "1px solid #ebedf0" }}
      >
        <header
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <div className="text-[14px] font-semibold text-ink">Checks</div>
        </header>
        <FlatRowsView
          rows={[
            { label: "Check (Base)", cents: p.check_base },
            { label: "Check Attachment Page", cents: p.check_extra_attachment_page },
          ]}
        />
      </section>

      <section
        className="rounded-lg bg-white"
        style={{ border: "1px solid #ebedf0" }}
      >
        <header
          className="px-5 py-3.5"
          style={{ borderBottom: "1px solid #ebedf0" }}
        >
          <div className="text-[14px] font-semibold text-ink">Surcharges</div>
        </header>
        <FlatRowsView
          rows={[
            {
              label: "Letter Over 6 Sheets (USPS Weight Surcharge)",
              cents: p.letter_over_6_sheet_fee ?? 0,
            },
          ]}
        />
      </section>
    </div>
  );
}

function CustomerPriceColumn({
  heading,
  classes,
  pick,
}: {
  heading: string;
  classes: ClassRow[];
  pick: "bw" | "color";
}) {
  return (
    <div className="px-5 py-4">
      <div
        className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "#5b606a" }}
      >
        {heading}
      </div>
      <table className="w-full text-[13px]">
        <tbody>
          {classes.map((c) => (
            <tr key={c.label} style={{ borderBottom: "1px solid #f1f2f4" }}>
              <td className="py-2 text-ink">{c.label}</td>
              <td className="py-2 text-right tabular-nums text-ink">
                {fmt(c[pick])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlatRowsView({
  rows,
}: {
  rows: { label: string; cents: number }[];
}) {
  return (
    <table className="w-full text-[13px]">
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.label}
            style={{ borderBottom: "1px solid #f1f2f4" }}
            className="last:border-b-0"
          >
            <td className="px-5 py-2.5 text-ink">{r.label}</td>
            <td className="px-5 py-2.5 text-right tabular-nums text-ink">
              {fmt(r.cents)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
