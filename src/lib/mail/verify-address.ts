import "server-only";

// Pre-send US address verification via Lob's /v1/us_verifications endpoint.
// Costs ~$0.20 per verification on Developer tier and catches the
// undeliverable-address case before we ever submit a job to C2M or Lob
// for printing. Returning early on undeliverable means we don't waste
// the per-piece print + postage charge on mail that USPS would just
// return.
//
// The Send Mail modal calls this server action right before enabling
// the Send button so the user gets immediate feedback on whether the
// address will deliver. If Lob is not configured, the gate becomes a
// no-op (returns ok with a "not configured" note) so dev environments
// can still send.

const LOB_BASE_URL = process.env.LOB_BASE_URL ?? "https://api.lob.com/v1";
const LOB_API_KEY = process.env.LOB_API_KEY ?? "";

export type AddressVerifyInput = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
};

export type AddressVerifyResult =
  | {
      ok: true;
      // "deliverable" or "deliverable_unnecessary_unit" passes.
      // "deliverable_incorrect_unit" or "deliverable_missing_unit" warns.
      // "undeliverable" blocks the send.
      deliverability:
        | "deliverable"
        | "deliverable_unnecessary_unit"
        | "deliverable_incorrect_unit"
        | "deliverable_missing_unit"
        | "undeliverable";
      // The normalized address Lob suggests we use. May differ from
      // input on capitalization, abbreviation, or ZIP+4. Always prefer
      // the normalized form for the actual send.
      normalized: {
        line1: string;
        line2: string | null;
        city: string;
        state: string;
        postal_code: string;
      };
      // True when Lob is configured but using test keys (which return
      // a placeholder response per Lob policy). UI should hint that
      // verification is non-functional in dev.
      test_mode: boolean;
    }
  | {
      ok: false;
      error: string;
    };

export async function verifyAddress(
  input: AddressVerifyInput
): Promise<AddressVerifyResult> {
  if (!LOB_API_KEY) {
    // No Lob key configured. Be permissive in this case so dev can
    // continue without verification, but flag the gap.
    return {
      ok: true,
      deliverability: "deliverable",
      normalized: {
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        postal_code: input.postal_code,
      },
      test_mode: true,
    };
  }
  const isTest = LOB_API_KEY.startsWith("test_");
  try {
    const res = await fetch(`${LOB_BASE_URL}/us_verifications`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${LOB_API_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        primary_line: input.line1,
        secondary_line: input.line2 ?? undefined,
        city: input.city,
        state: input.state,
        zip_code: input.postal_code,
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Lob verify failed: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`,
      };
    }
    const json = (await res.json()) as {
      deliverability?: string;
      primary_line?: string;
      secondary_line?: string;
      components?: {
        city?: string;
        state?: string;
        zip_code?: string;
        zip_code_plus_4?: string;
      };
    };
    const deliverability =
      (json.deliverability as AddressVerifyResult["deliverability" & "ok"]["deliverability"]) ??
      "undeliverable";
    const zip = json.components?.zip_code_plus_4
      ? `${json.components.zip_code}-${json.components.zip_code_plus_4}`
      : (json.components?.zip_code ?? input.postal_code);
    return {
      ok: true,
      deliverability: deliverability as
        | "deliverable"
        | "deliverable_unnecessary_unit"
        | "deliverable_incorrect_unit"
        | "deliverable_missing_unit"
        | "undeliverable",
      normalized: {
        line1: json.primary_line ?? input.line1,
        line2: (json.secondary_line as string | undefined) ?? input.line2 ?? null,
        city: json.components?.city ?? input.city,
        state: json.components?.state ?? input.state,
        postal_code: zip,
      },
      test_mode: isTest,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Lob verify unknown error",
    };
  }
}
