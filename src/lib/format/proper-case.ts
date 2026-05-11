// Proper Case for user-entered labels:
//   - Capitalize the first and last word
//   - Capitalize all "principal" words
//   - Lowercase short connectors (a, an, the, and, or, but, nor, on, at, to, by,
//     in, of, up, be, is, as, if, so) when they're not the first or last word
//   - Preserve all-uppercase words (DNC, IRS, USPS, etc.) as acronyms
//   - Collapse internal whitespace
const LOWERCASE_CONNECTORS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "on",
  "at",
  "to",
  "by",
  "in",
  "of",
  "up",
  "be",
  "is",
  "as",
  "if",
  "so",
  "for",
]);

function isAcronym(word: string): boolean {
  return word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);
}

export function toProperCase(input: string): string {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  return words
    .map((raw, i) => {
      if (isAcronym(raw)) return raw; // preserve DNC, IRS, etc.
      const lower = raw.toLowerCase();
      const isEdge = i === 0 || i === words.length - 1;
      if (!isEdge && LOWERCASE_CONNECTORS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
