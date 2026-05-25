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
      // Plain-English reason(s) the address was flagged. Empty array
      // when the address is fully deliverable. Sourced from Lob's
      // deliverability_analysis.dpv_footnotes + heuristics on the
      // deliverability bucket. Surfaced in the click-to-fix popover.
      issues: string[];
      // True when Lob suggested an address that differs from the
      // input (different street name, ZIP, abbreviation, etc.).
      // Drives the "Use Lob's version" button in the popover.
      has_suggestion: boolean;
    }
  | {
      ok: false;
      error: string;
    };

// Map Lob's dpv_footnote codes to plain-English issues the customer
// can understand. Footnote codes are documented at:
// https://docs.lob.com/#tag/US-Verifications
function explainFootnotes(codes: string[]): string[] {
  const map: Record<string, string> = {
    AA: "ZIP+4 matched a primary record.",
    A1: "USPS has no exact record of this address.",
    BB: "Address fully matched USPS records.",
    CC: "Apartment/unit number doesn't match USPS records.",
    F1: "Address matched to a military / diplomatic post.",
    G1: "Address matched to a general delivery.",
    IA: "Address has an informational error.",
    M1: "Street number is missing.",
    M3: "Street number is invalid for this street.",
    N1: "High-rise address is missing an apartment or suite.",
    P1: "PO Box / Rural Route / HC Box info is missing or invalid.",
    P3: "Private mailbox (PMB) designator is missing or invalid.",
    R1: "Building exists but no apartment number matched.",
    R7: "Carrier route is rural / unknown.",
    RR: "Address is a Commercial Mail Receiving Agency (CMRA).",
    TA: "Primary number matched after dropping trailing letter.",
    U1: "Single-ZIP address — no further matching possible.",
  };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of codes) {
    const msg = map[c];
    if (msg && !seen.has(msg)) {
      seen.add(msg);
      out.push(msg);
    }
  }
  return out;
}

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
      issues: [],
      has_suggestion: false,
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
      deliverability_analysis?: {
        dpv_confirmation?: string;
        dpv_footnotes?: string[];
        ews_match?: boolean;
        lacs_indicator?: string;
      };
    };
    const deliverability =
      (json.deliverability as AddressVerifyResult["deliverability" & "ok"]["deliverability"]) ??
      "undeliverable";
    const zip = json.components?.zip_code_plus_4
      ? `${json.components.zip_code}-${json.components.zip_code_plus_4}`
      : (json.components?.zip_code ?? input.postal_code);
    // The provider sometimes returns documentation/tutorial text in
    // primary_line (e.g. "SET primary_line TO 'deliverable' AND
    // zip_code to '11111' to simulate..."). That text is for
    // developers reading provider docs, NOT for end users. Detect
    // it and fall back to the original input so the customer never
    // sees provider-internal hint copy.
    const looksLikeProviderHint = (s: string | undefined) => {
      if (!s) return false;
      const lower = s.toLowerCase();
      return (
        lower.includes("set primary_line") ||
        lower.includes("simulate an address") ||
        lower.includes("us-verification-test-environment") ||
        lower.includes("lob.com") ||
        lower.includes("see https://")
      );
    };

    // Use the provider value only when it's a non-empty, non-junk
    // string. Empty / hint / whitespace-only -> fall back to input.
    // Without this guard, an undeliverable address with empty
    // components in the response would produce a half-blank
    // "corrected" address that re-verification then rejects.
    const pickField = (
      providerValue: string | undefined | null,
      inputValue: string,
      treatAsHint = false
    ): string => {
      const v = (providerValue ?? "").trim();
      if (!v) return inputValue;
      if (treatAsHint && looksLikeProviderHint(v)) return inputValue;
      return v;
    };
    const pickOptionalField = (
      providerValue: string | undefined | null,
      inputValue: string | null
    ): string | null => {
      const v = (providerValue ?? "").trim();
      if (!v) return inputValue;
      if (looksLikeProviderHint(v)) return inputValue;
      return v;
    };

    const normalizedLine1 = pickField(json.primary_line, input.line1, true);
    const normalizedLine2 = pickOptionalField(
      json.secondary_line,
      input.line2 ?? null
    );
    const normalizedCity = pickField(json.components?.city, input.city);
    const normalizedState = pickField(json.components?.state, input.state);
    const normalizedZip = pickField(zip, input.postal_code);

    // Surface a meaningful "we changed something" signal so the popover
    // shows the "Use corrected version" button only when the
    // corrected address is materially different AND complete. A
    // suggestion with empty parts is never offered — that's a
    // half-corrected address that would just fail again on submit.
    const norm = (s: string | null | undefined) =>
      (s ?? "").trim().toLowerCase();
    const correctedIsComplete = Boolean(
      normalizedLine1 &&
        normalizedCity &&
        normalizedState &&
        normalizedZip
    );
    const correctedDiffersFromInput =
      norm(normalizedLine1) !== norm(input.line1) ||
      norm(normalizedLine2) !== norm(input.line2) ||
      norm(normalizedCity) !== norm(input.city) ||
      norm(normalizedState) !== norm(input.state) ||
      norm(normalizedZip) !== norm(input.postal_code);
    const hasSuggestion = correctedIsComplete && correctedDiffersFromInput;

    // Map Lob's footnote codes to plain English, plus tack on a
    // catch-all deliverability message so the popover always says
    // something even when Lob doesn't return footnotes.
    const issues = explainFootnotes(
      json.deliverability_analysis?.dpv_footnotes ?? []
    );
    if (issues.length === 0) {
      if (deliverability === "undeliverable") {
        issues.push("USPS has no record of this address as deliverable.");
      } else if (deliverability === "deliverable_missing_unit") {
        issues.push("Apartment or suite number is missing.");
      } else if (deliverability === "deliverable_incorrect_unit") {
        issues.push("Apartment or suite number doesn't match USPS records.");
      } else if (deliverability === "deliverable_unnecessary_unit") {
        issues.push("The unit number provided isn't necessary for this address.");
      }
    }

    return {
      ok: true,
      deliverability: deliverability as
        | "deliverable"
        | "deliverable_unnecessary_unit"
        | "deliverable_incorrect_unit"
        | "deliverable_missing_unit"
        | "undeliverable",
      normalized: {
        line1: normalizedLine1,
        line2: normalizedLine2,
        city: normalizedCity,
        state: normalizedState,
        postal_code: normalizedZip,
      },
      test_mode: isTest,
      issues,
      has_suggestion: hasSuggestion,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Address verification failed. Try again.",
    };
  }
}
