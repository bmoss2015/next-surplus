import { parsePhoneNumberFromString } from "libphonenumber-js";

const DEFAULT_REGION = "US";

// Normalize a phone string to E.164 (+15551234567). Falls back to the raw
// trimmed input when libphonenumber can't parse it — that way invalid /
// partial input isn't silently dropped before the user notices.
export function toE164(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) return trimmed;
  return parsed.number;
}

// Pretty-print a stored phone number for display. E.164 input -> "(555)
// 555-1234"; anything libphonenumber can't parse is returned as-is.
export function formatPhoneUS(input: string | null | undefined): string {
  if (!input) return "";
  const parsed = parsePhoneNumberFromString(input, DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) return input;
  if (parsed.country === "US") return parsed.formatNational();
  return parsed.formatInternational();
}

// Mask for a US phone input field — strips non-digits, caps at 10, and
// formats incrementally as the user types so they see "(555) 555-1234"
// rather than raw digits.
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
