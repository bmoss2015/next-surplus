"use client";

// Owner area client wrapper. Renders the sub-rail + the selected panel.
// Wrapped in SettingsSaveProvider so any inline editable panel can use
// the unified bottom-right save bar pattern.

import { useState } from "react";
import { SubRail, GROUPS } from "./SubRail";
import { CustomerPricingSection } from "./CustomerPricingSection";
import { OwnerReportsSection } from "./OwnerReportsSection";
import { ProviderCostsSection } from "./ProviderCostsSection";
import { TelnyxPricingSection } from "@/app/(app)/settings/_components/TelnyxPricingSection";
import { SettingsSaveProvider } from "@/components/SettingsSaveBar";
import type {
  CustomerPricingData,
  ProviderCostsData,
} from "@/lib/owner/fetch";
import type { MailReportData, MailReportRange } from "@/lib/mail/reports";
import type { TelnyxPricingSettings } from "@/lib/settings/fetch";

export type OwnerData = {
  customerPricing: CustomerPricingData;
  providerCosts: ProviderCostsData;
  report: MailReportData & { range: MailReportRange };
  telnyxPricing: TelnyxPricingSettings | null;
};

export function OwnerView({ data }: { data: OwnerData }) {
  const [active, setActive] = useState<string>(GROUPS[0].items[0].key);

  return (
    <SettingsSaveProvider>
      <div className="flex w-full">
        <SubRail active={active} onSelect={setActive} />
        <div className="min-w-0 flex-1">
          {active === "customer-pricing" && (
            <CustomerPricingSection data={data.customerPricing} />
          )}
          {active === "provider-costs" && (
            <ProviderCostsSection data={data.providerCosts} />
          )}
          {active === "reports" && (
            <OwnerReportsSection data={data.report} />
          )}
          {active === "dialer-pricing" && data.telnyxPricing && (
            <TelnyxPricingSection initial={data.telnyxPricing} />
          )}
          {active === "dialer-reports" && (
            <PlaceholderReports />
          )}
        </div>
      </div>
    </SettingsSaveProvider>
  );
}

function PlaceholderReports() {
  return (
    <div className="mx-auto max-w-[960px] px-8 pt-10">
      <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.026em] text-[#0a0d14]">Power Dialer Reports</h1>
      <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
        Volume, margin, and per-customer Power Dialer usage. Lands once SMS sending and outbound calls have real activity to summarize.
      </p>
      <div
        className="mt-8 rounded-[14px] border border-[#ebedf0] bg-white px-8 py-16 text-center"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Coming Soon</div>
        <div className="mt-2 text-[15px] text-[#5b606a]">Reports appear here after the first month of Power Dialer activity.</div>
      </div>
    </div>
  );
}
