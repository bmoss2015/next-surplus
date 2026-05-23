"use client";

// Owner area client wrapper. Renders the sub-rail + the selected panel.
// Single panel for now (Customer Pricing) — the Provider Costs panel was
// folded into Customer Pricing's "Your Cost (Lob)" column so the owner
// sees cost + retail + margin in one place.

import { useState } from "react";
import { SubRail, GROUPS } from "./SubRail";
import { CustomerPricingSection } from "./CustomerPricingSection";
import type { CustomerPricingData } from "@/lib/owner/fetch";

export type OwnerData = {
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
      </div>
    </div>
  );
}
