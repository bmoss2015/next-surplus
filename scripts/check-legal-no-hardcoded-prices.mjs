#!/usr/bin/env node
// Fails CI if the privacy or terms page source contains hardcoded
// dollar literals like "$49" or "$69.00".
//
// Rationale: legal pages MUST pull subscription pricing from
// app_pricing_config at render time. A baked-in number in the source
// drifts from the DB the moment pricing changes, which is a contract
// problem (the policy in force diverges from what we actually charge).
//
// The check is intentionally source-level (not HTML-level). If a future
// change introduces a hardcoded literal we want CI to refuse the merge
// before the page renders for users.

import fs from "node:fs/promises";

const TARGETS = [
  "src/app/(legal)/privacy/page.tsx",
  "src/app/(legal)/terms/page.tsx",
];

// Matches "$" followed by digits, with optional cents. We allow Stripe
// privacy policy URLs and similar to pass by anchoring on the "$" + digit
// pattern, which never appears in URLs.
const PRICE_RE = /\$\d+(?:\.\d{1,2})?/g;

let failed = false;
for (const path of TARGETS) {
  const body = await fs.readFile(path, "utf-8");
  const matches = body.match(PRICE_RE);
  if (matches && matches.length > 0) {
    failed = true;
    console.error(
      `[legal-prices] ${path} contains hardcoded price literal(s): ${matches.join(", ")}`
    );
    console.error(
      `[legal-prices] Pull from app_pricing_config via fetchLegalPricing() instead.`
    );
  }
}

if (failed) {
  process.exit(1);
}

console.log("[legal-prices] No hardcoded price literals in legal pages. OK.");
