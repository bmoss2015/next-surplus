import "server-only";
import type { SendLetterInput, SendResult } from "./types";

// Click2Mail Mailing Online Pro REST API client. Letters route here because
// per-piece pricing is cheaper than Lob ($0.57 vs $0.81 for a 1-page letter).
// Checks do NOT route here — Click2Mail does not offer a check product.
//
// Auth: HTTP Basic with API_USERNAME:API_PASSWORD. Production base URL is
// https://api.click2mail.com/molpro. Sandbox is https://sandbox.click2mail.com/molpro.
//
// Document model: upload an HTML body as a "document", then create a "job"
// linked to a document + an "addressList". For v1 we keep one address per
// job — batching is handled by our orchestrator firing N parallel calls.

const C2M_BASE_URL =
  process.env.CLICK2MAIL_BASE_URL ?? "https://api.click2mail.com/molpro";
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
// productionTime is "Proof" when NODE_ENV !== "production" — C2M accepts the
// job and runs validation, but never prints or mails, and never charges.
function mailClassParams(mc: SendLetterInput["mail_class"], color: boolean) {
  const colorValue = color ? "Full Color" : "Black and White";
  const productionTime = process.env.NODE_ENV === "production" ? "Next Day" : "Proof";
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
        error: `Click2Mail document upload failed: ${docRes.status} ${await docRes.text()}`,
      };
    }
    const docJson = (await docRes.json()) as { id?: string };
    const documentId = docJson.id;
    if (!documentId) {
      return { ok: false, error: "Click2Mail document upload returned no id" };
    }

    // 2. Create an addressList with the single recipient. We embed the from
    // address in the document body since Click2Mail's window envelope shows
    // the recipient block from the address list.
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
        error: `Click2Mail address list create failed: ${addrRes.status} ${await addrRes.text()}`,
      };
    }
    const addrJson = (await addrRes.json()) as { id?: string };
    const addressListId = addrJson.id;
    if (!addressListId) {
      return { ok: false, error: "Click2Mail address list returned no id" };
    }

    // 3. Submit the job with our chosen mail class.
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
        error: `Click2Mail submitJob failed: ${jobRes.status} ${await jobRes.text()}`,
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

    return {
      ok: true,
      provider: "click2mail",
      provider_id: String(jobJson.id),
      tracking_number: null, // populated by webhook once USPS picks it up
      tracking_url: jobJson.jobStatusURL ?? null,
      cost_cents:
        typeof jobJson.totalCost === "number"
          ? Math.round(jobJson.totalCost * 100)
          : null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Click2Mail unknown error",
    };
  }
}
