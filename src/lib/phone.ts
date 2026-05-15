import { parsePhoneNumberFromString } from "libphonenumber-js";

const DEFAULT_REGION = "US";

export function toE164(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export function formatPhoneUS(input: string | null | undefined): string {
  if (!input) return "";
  const parsed = parsePhoneNumberFromString(input, DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) return input;
  if (parsed.country === "US") return parsed.formatNational();
  return parsed.formatInternational();
}
