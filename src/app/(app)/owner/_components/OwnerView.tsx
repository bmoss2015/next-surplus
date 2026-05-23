"use client";

// Owner area client wrapper. Holds the active-panel state and renders the
// sub-rail + the selected panel. Mirrors how SettingsPreviewJsx works,
// just slimmer since there are only a few panels.

import { useState } from "react";
import { SubRail, GROUPS } from "./SubRail";
import { ProviderCostsSection } from "./ProviderCostsSection";
import { CustomerPricingSection } from "./CustomerPricingSection";
import type { ProviderCostsData, CustomerPricingData } from "@/lib/owner/fetch";

export type OwnerData = {
  providerCosts: ProviderCostsData;
  customerPricing: CustomerPricingData;
};

export function OwnerView({ data }: { data: OwnerData }) {
  const [active, setActive] = useState<string>(GROUPS[0].items[0].key);

  return (
    <div className="flex w-full">
      <SubRail active={active} onSelect={setActive} />
      <div className="min-w-0 flex-1">
        {active === "customer-pricing" && (
          <CustomerPricingSection data={data.customerPricing} />
        )}
        {active === "provider-costs" && (
          <ProviderCostsSection data={data.providerCosts} />
        )}
      </div>
    </div>
  );
}
