import "server-only";
import type { LobPricing } from "./types";

// Fetches Lob's published Developer-tier pricing from their public
// llms-full.txt docs export and parses the rates into our LobPricing
// shape. Lob doesn't expose pricing via API, so this scrape is the
// only way to get current published rates programmatically. Runs
// weekly via the /api/cron/lob-pricing-sync cron.
//
// The published-rates page lists lines like:
//   Black & White Letter, First Class: $1.029
//   Color Letter, First Class: $1.189
//   Checks: $1.159
// We match each label with a regex and pick the dollar amount.
// Failures (Lob changed the page format) return null so the cron
// can log + skip without overwriting.

const LOB_DOCS_URL = "https://help.lob.com/llms-full.txt";

// Each entry maps a LobPricing key to a regex that locates the
// matching line in the published doc. The patterns are intentionally
// loose around whitespace + colons so cosmetic edits don't break the
// parser. Cents conversion at the end rounds half-cent values.
const RATE_PATTERNS: Array<{
  key: keyof Omit<LobPricing, "tier_label">;
  pattern: RegExp;
}> = [
  { key: "letter_first_class_bw", pattern: /Black\s*&\s*White\s*Letter,?\s*First\s*Class:?\s*"?\$?(\d+\.\d+)/i },
  { key: "letter_first_class_color", pattern: /Color\s*Letter,?\s*First\s*Class:?\s*"?\$?(\d+\.\d+)/i },
  { key: "letter_standard_bw", pattern: /Black\s*&\s*White\s*Letter,?\s*Standard\s*Class:?\s*"?\$?(\d+\.\d+)/i },
  { key: "letter_standard_color", pattern: /Color\s*Letter,?\s*Standard\s*Class:?\s*"?\$?(\d+\.\d+)/i },
  { key: "letter_extra_page_bw", pattern: /Additional\s*B&W\s*Page:?\s*"?\$?(\d+\.\d+)/i },
  { key: "letter_extra_page_color", pattern: /Additional\s*Color\s*Page:?\s*"?\$?(\d+\.\d+)/i },
  { key: "check_base", pattern: /(?:^|\n|\s)Checks?:?\s*"?\$?(\d+\.\d+)/i },
  { key: "check_extra_attachment_page", pattern: /Check\s*Attachment\s*Page:?\s*"?\$?(\d+\.\d+)/i },
];

export type LobPricingFetchResult =
  | { ok: true; pricing: LobPricing; fetched_at: string }
  | { ok: false; error: string };

function dollarsToCents(s: string): number {
  return Math.round(parseFloat(s) * 100);
}

export async function fetchPublishedLobPricing(): Promise<LobPricingFetchResult> {
  let text = "";
  try {
    const res = await fetch(LOB_DOCS_URL, {
      headers: { Accept: "text/plain" },
      // Don't cache; the cron is the only caller and runs weekly.
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `Lob docs fetch failed: HTTP ${res.status}` };
    }
    text = await res.text();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lob docs fetch unknown error",
    };
  }

  // Required keys — if any can't be located in the doc, we treat the
  // whole fetch as failed rather than write a half-populated row.
  // Both letter_certified rates are optional (Lob shows "—" in the
  // table for certified) and fall back to the first-class rate.
  const partial: Partial<LobPricing> = { tier_label: "Developer (published, auto-synced)" };
  const missing: string[] = [];
  for (const { key, pattern } of RATE_PATTERNS) {
    const m = text.match(pattern);
    if (!m) {
      missing.push(key);
      continue;
    }
    partial[key] = dollarsToCents(m[1]);
  }
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Could not parse Lob rates for: ${missing.join(", ")}. The published page format may have changed.`,
    };
  }
  // Certified mail is NOT available on Lob's Developer tier (the published
  // table shows a dash for Developer and $6.70 for Startup/Growth). The
  // earlier fallback "treat certified as first-class" was wrong — it
  // wrote $1.029 into wholesale and made certified look way cheaper than
  // it actually is. Use $6.70 (Startup tier published rate) as the
  // certified cost since that's what we'd pay the moment we upgrade. No
  // color premium on certified (Lob doesn't differentiate).
  const STARTUP_CERTIFIED_CENTS = 670;
  partial.letter_certified_bw = STARTUP_CERTIFIED_CENTS;
  partial.letter_certified_color = STARTUP_CERTIFIED_CENTS;

  return {
    ok: true,
    pricing: partial as LobPricing,
    fetched_at: new Date().toISOString(),
  };
}

// True when any cent-amount on `current` differs from `published`.
// tier_label is ignored — it's a display string, not a rate.
export function hasPricingDrifted(
  current: LobPricing,
  published: LobPricing
): boolean {
  const keys: Array<keyof Omit<LobPricing, "tier_label">> = [
    "check_base",
    "check_extra_attachment_page",
    "letter_first_class_bw",
    "letter_first_class_color",
    "letter_standard_bw",
    "letter_standard_color",
    "letter_certified_bw",
    "letter_certified_color",
    "letter_extra_page_bw",
    "letter_extra_page_color",
  ];
  return keys.some((k) => current[k] !== published[k]);
}
