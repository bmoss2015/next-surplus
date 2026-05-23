"use client";

// Owner area client wrapper. Renders the sub-rail + the selected panel.
// Wrapped in SettingsSaveProvider so any inline editable panel can use
// the unified bottom-right save bar pattern.

import { useState } from "react";
import { SubRail, GROUPS } from "./SubRail";
import { CustomerPricingSection } from "./CustomerPricingSection";
import { SettingsSaveProvider } from "@/components/SettingsSaveBar";
import type { CustomerPricingData } from "@/lib/owner/fetch";

export type OwnerData = {
  customerPricing: CustomerPricingData;
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
        </div>
      </div>
    </SettingsSaveProvider>
  );
}
