// Display formatting for US phone numbers: a clean 10-digit value renders as
// "(301) 343-4182". Anything else — a partial number, an extension, an already
// oddly formatted string, blank — is returned unchanged so the output is never
// mangled. Read mode only: editable inputs should hold the raw digits.
export function formatPhone(raw: string | null | undefined): string {
  const value = raw ?? "";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
