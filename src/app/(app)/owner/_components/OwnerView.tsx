"use client";

// Owner area client wrapper. Renders the sub-rail + the selected panel.
// Wrapped in SettingsSaveProvider so any inline editable panel can use
// the unified bottom-right save bar pattern.

import { useState } from "react";
import { SubRail, GROUPS } from "./SubRail";
import { CustomerPricingSection } from "./CustomerPricingSection";
import { OwnerReportsSection } from "./OwnerReportsSection";
import { SettingsSaveProvider } from "@/components/SettingsSaveBar";
import type { CustomerPricingData } from "@/lib/owner/fetch";
import type { MailReportData, MailReportRange } from "@/lib/mail/reports";

export type OwnerData = {
  customerPricing: CustomerPricingData;
  report: MailReportData & { range: MailReportRange };
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
          {active === "reports" && (
            <OwnerReportsSection data={data.report} />
          )}
        </div>
      </div>
    </SettingsSaveProvider>
  );
}
