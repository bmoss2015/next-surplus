// Best-effort parser for the free-form `contacts.value` mailing address
// string. The existing portal stores addresses as joined text like
// "123 Main St, Springfield, IL 62701" or
// "123 Main St, Suite 200, Springfield, IL 62701". Splits on ", ", peels
// off the trailing "ST ZIP" token, joins the leftovers as city, and treats
// the first segment as line1, with optional line2 sandwiched in between.

export type ParsedAddress = {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
};

const STATE_ZIP_RE = /^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i;

export function parseAddressString(value: string): ParsedAddress | null {
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length < 3) return null;

  const tail = parts[parts.length - 1];
  const m = tail.match(STATE_ZIP_RE);
  if (!m) return null;
  const state = m[1].toUpperCase();
  const postal_code = m[2];

  const city = parts[parts.length - 2];
  const remaining = parts.slice(0, parts.length - 2);
  const line1 = remaining[0];
  const line2 = remaining.length > 1 ? remaining.slice(1).join(", ") : null;

  if (!line1 || !city) return null;

  return { line1, line2, city, state, postal_code };
}

// Best-effort recovery parser for legacy address rows where the original
// import didn't insert commas between street/city/state/zip — e.g.
// "1722 N Springfield Ave Chicago IL 60647". Used by the address-repair
// tool in Settings. Strategy:
//   1. If parseAddressString already succeeds, leave the row alone.
//   2. Otherwise pull a trailing ZIP and 2-letter state off the end.
//   3. The token immediately before the state is treated as the city
//      (single-word city heuristic — covers ~70% of US cities). Multi-word
//      cities ("Los Angeles", "New York") will pick up only the last word
//      and need a manual fix via the per-card Edit button.
//   4. Everything before that becomes line1.
// Returns null when even the loose parse can't find a state+zip tail —
// those rows need to be edited manually.

const LOOSE_TAIL_RE = /\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/;

export function smartParseAddress(value: string): ParsedAddress | null {
  // 1. Already structured? Use the strict parser.
  const strict = parseAddressString(value);
  if (strict) return strict;

  const cleaned = value.replace(/\s+/g, " ").trim();
  const tail = cleaned.match(LOOSE_TAIL_RE);
  if (!tail) return null;
  const state = tail[1].toUpperCase();
  const postal_code = tail[2];

  const head = cleaned.slice(0, tail.index).trim();
  if (!head) return null;

  // Last whitespace-delimited token before state is the city.
  const lastSpace = head.lastIndexOf(" ");
  if (lastSpace === -1) return null;
  const city = head.slice(lastSpace + 1);
  const line1 = head.slice(0, lastSpace).trim();
  if (!line1 || !city) return null;

  return { line1, line2: null, city, state, postal_code };
}

// Compose a parsed address back to the canonical "line1, city, ST ZIP"
// storage format used by contacts.value.
export function formatAddressForStorage(p: ParsedAddress): string {
  const tail = `${p.city}, ${p.state} ${p.postal_code}`;
  return [p.line1, p.line2, tail].filter(Boolean).join(", ");
}

export function splitFullName(full: string): {
  first_name: string;
  last_name: string;
} {
  const cleaned = full.replace(/\s*\(.*?\)\s*$/, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0) return { first_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return {
    first_name: parts[0],
    last_name: parts[parts.length - 1],
  };
}
