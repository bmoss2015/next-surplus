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
