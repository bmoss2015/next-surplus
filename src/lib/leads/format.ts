import type { LeadRow } from "./types";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Fix 29 — the one money formatter. Always thousands-separated, no cents.
// $400300 -> "$400,300", $35000 -> "$35,000".
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return CURRENCY.format(value);
}

// Fix XXXX2 — for "reference" fields (Tax / Mortgage Payoff, Total Liens, …)
// where a stored 0 means "not entered" rather than a real $0: show a dash.
export function formatCurrencyOrDash(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  return CURRENCY.format(value);
}

// Fix 28 — title-case a free-text place name (county, city) at read time,
// regardless of how it was stored ("YORK" / "york county" -> "York County").
export function toTitleCase(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c: string) => "Mc" + c.toUpperCase());
}

// Fix DDDDD — the one full-address display formatter: "3574 Magnolia Ave,
// Charleston, SC 29205" (comma after street, comma after city, then state zip).
// Skips empty parts so partial addresses still read correctly.
export function formatFullAddress(
  address: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  zip: string | null | undefined
): string {
  const stateZip = [state, zip].map((p) => (p ?? "").trim()).filter(Boolean).join(" ");
  return [address, city, stateZip]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

export function daysSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function primaryOwner(lead: LeadRow): string {
  const primary = lead.owners.find((o) => o.is_primary) ?? lead.owners[0];
  return primary?.full_name ?? "—";
}

export function ownerStatusOf(lead: LeadRow): string {
  const primary = lead.owners.find((o) => o.is_primary) ?? lead.owners[0];
  return primary?.status ?? "unknown";
}
