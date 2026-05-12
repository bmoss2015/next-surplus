// Fix XXXX2: a state lookup for the lead's recovery (foreclosure) process.
// Drives the auto-populated "Recovery Type" on the Property Info tab; the user
// can still override it per lead.

export type RecoveryType = "judicial" | "non_judicial" | "unknown";

export const RECOVERY_TYPE_LABELS: Record<"judicial" | "non_judicial", string> = {
  judicial: "Judicial",
  non_judicial: "Non Judicial",
};

// Mortgage-foreclosure process by state (the common classification).
const MORTGAGE_BY_STATE: Record<string, "judicial" | "non_judicial"> = {
  AL: "non_judicial", AK: "non_judicial", AZ: "non_judicial", AR: "non_judicial",
  CA: "non_judicial", CO: "non_judicial", CT: "judicial", DE: "judicial",
  DC: "non_judicial", FL: "judicial", GA: "non_judicial", HI: "judicial",
  ID: "non_judicial", IL: "judicial", IN: "judicial", IA: "judicial",
  KS: "judicial", KY: "judicial", LA: "judicial", ME: "judicial",
  MD: "non_judicial", MA: "non_judicial", MI: "non_judicial", MN: "non_judicial",
  MS: "non_judicial", MO: "non_judicial", MT: "non_judicial", NE: "judicial",
  NV: "non_judicial", NH: "non_judicial", NJ: "judicial", NM: "judicial",
  NY: "judicial", NC: "non_judicial", ND: "judicial", OH: "judicial",
  OK: "judicial", OR: "non_judicial", PA: "judicial", RI: "non_judicial",
  SC: "judicial", SD: "judicial", TN: "non_judicial", TX: "non_judicial",
  UT: "non_judicial", VT: "judicial", VA: "non_judicial", WA: "non_judicial",
  WV: "non_judicial", WI: "judicial", WY: "non_judicial",
};

// Tax-sale process overrides where it differs materially from the mortgage
// classification (court-confirmed tax-deed states lean judicial).
const TAX_OVERRIDES: Record<string, "judicial" | "non_judicial"> = {
  CA: "judicial", GA: "judicial", MD: "judicial", MA: "judicial",
  MI: "judicial", TX: "judicial", AZ: "judicial", CO: "judicial",
};

export function recoveryTypeFor(
  state: string | null | undefined,
  saleType: string | null | undefined
): "judicial" | "non_judicial" | null {
  const code = (state ?? "").trim().toUpperCase();
  if (!code) return null;
  if (saleType === "TAX" && TAX_OVERRIDES[code]) return TAX_OVERRIDES[code];
  return MORTGAGE_BY_STATE[code] ?? null;
}
