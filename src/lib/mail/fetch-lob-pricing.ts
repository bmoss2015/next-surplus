import "server-only";
import type { LobPricing } from "./types";

// Fetches Lob's published Developer-tier pricing from their help center
// pricing-details article (markdown export) and parses each effective-
// date section into our LobPricing shape. The page has the format:
//
//   ## Mail piece unit pricing  ← current rates
//   ### Letters
//     <table>...Developer column = 2nd <td>...
//   ### Checks
//     <table>...
//
//   ## Pricing effective <Month DD, YYYY>  ← future-effective rates
//   ### Letters
//   ### Checks
//
// We parse the current section AND every future-effective section.
// The cron uses the current section to refresh wholesale_pricing_cents
// and the future-effective sections to email ops about upcoming changes
// before they hit our margin.
//
// Source page is stable (GitBook-published, /print-and-mail/ready-to-
// get-started/pricing-details.md). The earlier scraper targeted Lob's
// llms-full.txt corpus, which is volatile because Lob regenerates that
// file whenever they add docs anywhere on the site. This page is one
// human-maintained article and only changes when Lob actually updates
// prices.

const LOB_DOCS_URL =
  "https://help.lob.com/print-and-mail/ready-to-get-started/pricing-details.md";

// Each table row in the source looks like:
//   <tr><td>Black &#x26; White Letter, First Class</td><td>$1.029</td><td>$0.859</td>...
// The Developer price is always the second <td>. We capture (label,
// developerPrice) and look up which LobPricing key each label maps to.
const ROW_REGEX = /<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi;

const LABEL_TO_KEY: Record<string, keyof Omit<LobPricing, "tier_label">> = {
  "Black & White Letter, First Class": "letter_first_class_bw",
  "Color Letter, First Class": "letter_first_class_color",
  "Black & White Letter, Standard Class": "letter_standard_bw",
  "Color Letter, Standard Class": "letter_standard_color",
  "Black & White Additional Page (pdf page)": "letter_extra_page_bw",
  "Color Additional Page (pdf page)": "letter_extra_page_color",
  "Letter over 6 sheet fee": "letter_over_6_sheet_fee",
  "Certified Mail (1st class only)": "letter_certified_bw",
  Checks: "check_base",
  "Check Attachment Page": "check_extra_attachment_page",
};

export type LobPricingSection = {
  effective_date: string | null;
  pricing: LobPricing;
  missing: string[];
};

export type LobPricingFetchResult =
  | {
      ok: true;
      current: LobPricingSection;
      upcoming: LobPricingSection[];
      fetched_at: string;
    }
  | { ok: false; error: string };

function dollarsToCents(s: string): number | null {
  const cleaned = s.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x26;/gi, "&")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSection(
  markdown: string,
  effectiveDate: string | null,
  tierLabel: string
): LobPricingSection {
  const partial: Partial<LobPricing> = { tier_label: tierLabel };
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  ROW_REGEX.lastIndex = 0;
  while ((m = ROW_REGEX.exec(markdown)) !== null) {
    const label = decodeHtmlEntities(m[1]);
    const key = LABEL_TO_KEY[label];
    if (!key) continue;
    const cents = dollarsToCents(m[2]);
    if (cents === null) continue;
    partial[key] = cents;
    seen.add(key);
  }
  if (seen.has("letter_certified_bw") && !seen.has("letter_certified_color")) {
    partial.letter_certified_color = partial.letter_certified_bw;
    seen.add("letter_certified_color");
  }
  const required: Array<keyof Omit<LobPricing, "tier_label">> = [
    "letter_first_class_bw",
    "letter_first_class_color",
    "letter_standard_bw",
    "letter_standard_color",
    "letter_extra_page_bw",
    "letter_extra_page_color",
    "check_base",
    "check_extra_attachment_page",
  ];
  const missing = required.filter((k) => !seen.has(k));
  return {
    effective_date: effectiveDate,
    pricing: partial as LobPricing,
    missing,
  };
}

export async function fetchPublishedLobPricing(): Promise<LobPricingFetchResult> {
  let text = "";
  try {
    const res = await fetch(LOB_DOCS_URL, {
      headers: { Accept: "text/plain, text/markdown" },
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

  const futureHeading = /##\s+Pricing effective\s+([A-Z][a-z]+ \d{1,2},\s*\d{4})/g;
  const headings: Array<{ index: number; date: string }> = [];
  let h: RegExpExecArray | null;
  while ((h = futureHeading.exec(text)) !== null) {
    headings.push({ index: h.index, date: h[1] });
  }

  const currentText = headings.length > 0 ? text.slice(0, headings[0].index) : text;
  const currentSection = parseSection(
    currentText,
    null,
    "Lob Developer (published, auto-synced)"
  );

  const upcoming: LobPricingSection[] = [];
  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : text.length;
    const sectionText = text.slice(start, end);
    upcoming.push(
      parseSection(
        sectionText,
        headings[i].date,
        `Lob Developer (effective ${headings[i].date})`
      )
    );
  }

  if (currentSection.missing.length > 0) {
    return {
      ok: false,
      error: `Could not parse Lob rates for: ${currentSection.missing.join(
        ", "
      )}. The published page format may have changed.`,
    };
  }

  return {
    ok: true,
    current: currentSection,
    upcoming,
    fetched_at: new Date().toISOString(),
  };
}

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
    "letter_over_6_sheet_fee",
  ];
  return keys.some((k) => current[k] !== published[k]);
}

export function pricingDiff(
  before: LobPricing,
  after: LobPricing
): Array<{ key: string; before: number | undefined; after: number | undefined }> {
  const keys: Array<keyof Omit<LobPricing, "tier_label">> = [
    "letter_first_class_bw",
    "letter_first_class_color",
    "letter_standard_bw",
    "letter_standard_color",
    "letter_certified_bw",
    "letter_certified_color",
    "letter_extra_page_bw",
    "letter_extra_page_color",
    "letter_over_6_sheet_fee",
    "check_base",
    "check_extra_attachment_page",
  ];
  const out: Array<{ key: string; before: number | undefined; after: number | undefined }> = [];
  for (const k of keys) {
    const a = before[k];
    const b = after[k];
    if (a !== b) out.push({ key: k, before: a, after: b });
  }
  return out;
}
