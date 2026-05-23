"use client";

// Owner area client wrapper. Holds the active-panel state and renders the
// sub-rail + the selected panel. Mirrors how SettingsPreviewJsx works,
// just slimmer since there's only one panel for now. Add new panels here
// + in SubRail.GROUPS.

import { useState } from "react";
import { SubRail, GROUPS } from "./SubRail";
import { ProviderCostsSection } from "./ProviderCostsSection";
import type { ProviderCostsData } from "@/lib/owner/fetch";

export type OwnerData = {
  providerCosts: ProviderCostsData;
};

export function OwnerView({ data }: { data: OwnerData }) {
  const [active, setActive] = useState<string>(GROUPS[0].items[0].key);

  return (
    <div className="flex w-full">
      <SubRail active={active} onSelect={setActive} />
      <div className="min-w-0 flex-1">
        {active === "provider-costs" && (
          <ProviderCostsSection data={data.providerCosts} />
        )}
      </div>
    </div>
  );
}
