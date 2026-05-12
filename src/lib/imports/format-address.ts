// Fix 11: address + city auto-formatting at import time.
// Pure helpers — no side effects. Used by the import pipeline before writing rows.

// Street-type abbreviations that should be Capitalized (St, Rd, Ln, ...).
const STREET_TYPES = new Set([
  "st",
  "rd",
  "ln",
  "blvd",
  "ave",
  "dr",
  "ct",
  "pl",
]);

// Directional prefixes/suffixes that should be UPPERCASED (N, S, NE, ...).
const DIRECTIONALS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);

function titleCaseWord(word: string): string {
  if (word.length === 0) return word;
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

/** Title Case a free-text value, e.g. "fort mill" -> "Fort Mill". */
export function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((w) => titleCaseWord(w))
    .join(" ");
}

/** Format a city name to Title Case. */
export function formatCity(value: string): string {
  return titleCase(value);
}

/**
 * Format a street address: Title Case the street name, uppercase directional
 * prefixes (N, S, E, W, NE, ...), Capitalize street-type abbreviations
 * (St, Rd, Ln, ...). Numbers are kept as-is.
 * e.g. "123 ne main st" -> "123 NE Main St".
 */
export function formatAddress(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((token) => {
      // Keep tokens that contain digits as-is (house numbers, unit numbers).
      if (/\d/.test(token)) return token;
      const lower = token.toLowerCase();
      if (DIRECTIONALS.has(lower)) return lower.toUpperCase();
      if (STREET_TYPES.has(lower)) return titleCaseWord(token);
      return titleCaseWord(token);
    })
    .join(" ");
}

// Fix 94: address abbreviation expansions used for duplicate-detection only.
// Whole-word matches are expanded so "123 Main St" and "123 main street" hash
// to the same normalized form. These are NOT applied to the stored address.
const MATCH_EXPANSIONS: Record<string, string> = {
  rd: "road",
  st: "street",
  ln: "lane",
  blvd: "boulevard",
  ave: "avenue",
  dr: "drive",
  ct: "court",
  pl: "place",
  n: "north",
  s: "south",
  e: "east",
  w: "west",
};

/**
 * Normalize an address for fuzzy duplicate matching:
 *  1. lowercase the whole address;
 *  2. drop any unit/apartment designator and everything after it (Apt, Suite,
 *     Unit, Ste, Fl, Floor, #) so "123 Main St Apt 4B" and "123 Main St #4B"
 *     both compare as "123 main st";
 *  3. expand common abbreviations as whole words (rd -> road, st -> street, ...);
 *  4. strip punctuation and collapse extra whitespace.
 * Pure helper — never used to format a value that gets persisted.
 */
export function normalizeAddressForMatch(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    // Cut the address at the first unit/apartment marker (or "#"), inclusive.
    .replace(/\s*(?:#|\b(?:apt|apartment|suite|ste|unit|fl|floor)\b).*$/i, "")
    // Strip punctuation -> spaces so abbreviations followed by a comma/period
    // are still treated as whole words.
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => MATCH_EXPANSIONS[word] ?? word)
    .join(" ")
    .trim();
}
