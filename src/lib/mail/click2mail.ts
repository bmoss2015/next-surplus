import "server-only";
import type { SendLetterInput, SendResult, LobPricing } from "./types";

function letterCustomerCharge(
  mc: SendLetterInput["mail_class"],
  color: boolean,
  pricing: LobPricing | undefined
): number | null {
  if (!pricing) return null;
  if (mc === "standard") return color ? pricing.letter_standard_color : pricing.letter_standard_bw;
  if (mc === "certified") return color ? pricing.letter_certified_color : pricing.letter_certified_bw;
  return color ? pricing.letter_first_class_color : pricing.letter_first_class_bw;
}

// Click2Mail Mailing Online Pro REST API client. Letters route here.
// Checks do NOT route here — Click2Mail does not offer a check product.
//
// Auth: HTTP Basic with API_USERNAME:API_PASSWORD.
// Production base URL: https://rest.click2mail.com/molpro       (default)
// Staging base URL:    https://stage-rest.click2mail.com/molpro
//
// Default is PROD because staging at C2M requires a separately-registered
// sandbox account (the prod creds 401 against stage-rest). Real mail is
// gated by MAIL_LIVE=true AND NODE_ENV=production — when either is
// missing, productionTime is forced to "Proof", which C2M accepts and
// validates but never prints and never charges. Dev + Vercel preview
// deployments never set MAIL_LIVE, so they're free to exercise the full
// API path safely.
//
// (The older api.click2mail.com / sandbox.click2mail.com hostnames were
// retired by C2M — they no longer resolve. If you hit "fetch failed",
// check the host first.)
//
// Document model: upload an HTML body as a "document", then create a "job"
// linked to a document + an "addressList". For v1 we keep one address per
// job — batching is handled by our orchestrator firing N parallel calls.

const C2M_BASE_URL =
  process.env.CLICK2MAIL_BASE_URL ?? "https://rest.click2mail.com/molpro";
const C2M_USERNAME = process.env.CLICK2MAIL_USERNAME ?? "";
const C2M_PASSWORD = process.env.CLICK2MAIL_PASSWORD ?? "";

export function isClick2MailConfigured(): boolean {
  return Boolean(C2M_USERNAME && C2M_PASSWORD);
}

function authHeader(): string {
  const basic = Buffer.from(`${C2M_USERNAME}:${C2M_PASSWORD}`).toString(
    "base64"
  );
  return `Basic ${basic}`;
}

// Maps our internal class names to Click2Mail's productionTime + envelope/
// printOption tuples. Their REST API expects a `documentClass` + `productionTime`
// rather than a single "class" field.
//
// productionTime gating — "Next Day" only when MAIL_LIVE === "true" AND
// NODE_ENV === "production". Otherwise "Proof", where C2M accepts the job
// and runs validation but never prints or mails and never charges. The
// double check is intentional: MAIL_LIVE must be explicitly opted into in
// Vercel prod env, so accidentally running `next start` against staging
// data can't print real mail.
function mailClassParams(mc: SendLetterInput["mail_class"], color: boolean) {
  const colorValue = color ? "Full Color" : "Black and White";
  const isLive =
    process.env.NODE_ENV === "production" && process.env.MAIL_LIVE === "true";
  const productionTime = isLive ? "Next Day" : "Proof";
  switch (mc) {
    case "standard":
      return { documentClass: "Letter 8.5 x 11", productionTime, layout: "Address on Separate Page", envelope: "#10 Single Window", color: colorValue, mailClass: "Standard Class" };
    case "certified":
      return { documentClass: "Letter 8.5 x 11", productionTime, layout: "Address on Separate Page", envelope: "#10 Single Window", color: colorValue, mailClass: "Certified" };
    case "first_class":
    default:
      return { documentClass: "Letter 8.5 x 11", productionTime, layout: "Address on Separate Page", envelope: "#10 Single Window", color: colorValue, mailClass: "First Class" };
  }
}

// Shared steps 2+3 of the C2M job flow: create a one-recipient addressList,
// submit a job referencing the given documentId. Called by both the HTML
// path (click2mailSendLetter) and the multi-document path
// (click2mailSendFromDocumentId).
async function createAddressListAndSubmitJob(
  documentId: string,
  input: Pick<
    SendLetterInput,
    "to" | "mail_class" | "color" | "correlation_id" | "customer_pricing"
  >
): Promise<SendResult> {
  const addrRes = await fetch(`${C2M_BASE_URL}/addressLists`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      addressListName: `mail-job-${input.correlation_id}`,
      addressMappingId: 1,
      addresses: [
        {
          firstName: input.to.name,
          organization: "",
          address1: input.to.line1,
          address2: input.to.line2 ?? "",
          city: input.to.city,
          state: input.to.state,
          zip: input.to.postal_code,
          country: input.to.country ?? "US",
        },
      ],
    }),
  });
  if (!addrRes.ok) {
    return {
      ok: false,
      error:
        addrRes.status === 422
          ? "This address can't be delivered to. Update the recipient address and try again."
          : addrRes.status >= 500
            ? "The mail service is having problems right now. Please try again in a few minutes."
            : "The send couldn't be completed. Please try again, or contact support if this keeps happening.",
    };
  }
  const addrJson = (await addrRes.json()) as { id?: string };
  const addressListId = addrJson.id;
  if (!addressListId) {
    return { ok: false, error: "Click2Mail address list returned no id" };
  }

  const params = mailClassParams(input.mail_class, input.color === true);
  const jobRes = await fetch(`${C2M_BASE_URL}/jobs/submitJob`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      documentClass: params.documentClass,
      layout: params.layout,
      productionTime: params.productionTime,
      envelope: params.envelope,
      color: params.color,
      paperType: "White 24#",
      mailClass: params.mailClass,
      documentId,
      addressId: addressListId,
      jobName: `mail-job-${input.correlation_id}`,
    }),
  });
  if (!jobRes.ok) {
    return {
      ok: false,
      error:
        jobRes.status >= 500
          ? "The mail service is having problems right now. Please try again in a few minutes."
          : "The send couldn't be completed. Please try again, or contact support if this keeps happening.",
    };
  }
  const jobJson = (await jobRes.json()) as {
    id?: string;
    totalCost?: number;
    jobStatusURL?: string;
  };
  if (!jobJson.id) {
    return { ok: false, error: "Click2Mail submitJob returned no id" };
  }

  // cost_cents = what we charge the customer (from customer_pricing
  // schedule). provider_cost_cents = what C2M billed us, which they
  // return as totalCost on the submitJob response.
  const provider_cost_cents =
    typeof jobJson.totalCost === "number"
      ? Math.round(jobJson.totalCost * 100)
      : null;
  const cost_cents = letterCustomerCharge(
    input.mail_class,
    input.color === true,
    input.customer_pricing
  );
  return {
    ok: true,
    provider: "click2mail",
    provider_id: String(jobJson.id),
    tracking_number: null,
    tracking_url: jobJson.jobStatusURL ?? null,
    cost_cents,
    provider_cost_cents,
  };
}

// Multi-document path. Uploads N files (mix of .docx / .pdf) to C2M's
// /documents/create2 endpoint, which merges them server-side into a single
// document and returns one documentId. Use for templates that combine a
// Word cover letter with PDF attachments. Files are merged in array order.
export async function click2mailCreateMergedDocument(
  correlationId: string,
  files: Array<{ name: string; buffer: Buffer; contentType: string }>
): Promise<{ ok: true; documentId: string } | { ok: false; error: string }> {
  if (!isClick2MailConfigured()) {
    return { ok: false, error: "Click2Mail is not configured (missing CLICK2MAIL_USERNAME/PASSWORD)" };
  }
  if (files.length === 0) {
    return { ok: false, error: "At least one file is required" };
  }
  try {
    const fd = new FormData();
    fd.append("documentName", `mail-job-${correlationId}`);
    fd.append("documentClass", "Letter 8.5 x 11");
    for (const f of files) {
      fd.append(
        "file",
        new Blob([f.buffer], { type: f.contentType }),
        f.name
      );
    }
    const res = await fetch(`${C2M_BASE_URL}/documents/create2`, {
      method: "POST",
      headers: { Authorization: authHeader(), Accept: "application/json" },
      body: fd,
    });
    if (!res.ok) {
      return {
        ok: false,
        error:
          res.status >= 500
            ? "The mail service is having problems right now. Please try again in a few minutes."
            : "Could not prepare the document for sending. Please try again.",
      };
    }
    const json = (await res.json()) as { id?: string };
    if (!json.id) {
      return { ok: false, error: "Click2Mail create2 returned no id" };
    }
    return { ok: true, documentId: String(json.id) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Click2Mail unknown error",
    };
  }
}

// Submits a C2M job using a pre-built documentId — used by the multi-doc
// path after click2mailCreateMergedDocument has returned an id.
export async function click2mailSendFromDocumentId(
  documentId: string,
  input: Pick<
    SendLetterInput,
    "to" | "mail_class" | "color" | "correlation_id" | "customer_pricing"
  >
): Promise<SendResult> {
  if (!isClick2MailConfigured()) {
    return { ok: false, error: "Click2Mail is not configured (missing CLICK2MAIL_USERNAME/PASSWORD)" };
  }
  try {
    return await createAddressListAndSubmitJob(documentId, input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Click2Mail unknown error",
    };
  }
}

export async function click2mailSendLetter(
  input: SendLetterInput
): Promise<SendResult> {
  if (!isClick2MailConfigured()) {
    return { ok: false, error: "Click2Mail is not configured (missing CLICK2MAIL_USERNAME/PASSWORD)" };
  }

  try {
    // 1. Upload the HTML body as a document.
    const docRes = await fetch(`${C2M_BASE_URL}/documents`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        documentName: `mail-job-${input.correlation_id}`,
        documentFormat: "HTML",
        documentContent: Buffer.from(input.body_html).toString("base64"),
      }),
    });
    if (!docRes.ok) {
      return {
        ok: false,
        error:
          docRes.status >= 500
            ? "The mail service is having problems right now. Please try again in a few minutes."
            : "Could not upload the letter content. Please try again.",
      };
    }
    const docJson = (await docRes.json()) as { id?: string };
    const documentId = docJson.id;
    if (!documentId) {
      return { ok: false, error: "Click2Mail document upload returned no id" };
    }

    return await createAddressListAndSubmitJob(documentId, input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Click2Mail unknown error",
    };
  }
}
