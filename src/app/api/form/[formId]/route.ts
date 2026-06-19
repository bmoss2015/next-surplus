import { NextResponse } from "next/server";
import { submitWebForm } from "@/lib/web-forms/submit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ORIGINS = new Set([
  "https://mossequitypartners.com",
  "https://www.mossequitypartners.com",
  "https://app.nextsurplus.com",
  "https://staging.nextsurplus.com",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow =
    origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".vercel.app"))
      ? origin
      : "https://mossequitypartners.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ formId: string }> }
) {
  const headers = corsHeaders(req.headers.get("origin"));
  const { formId } = await ctx.params;

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400, headers }
    );
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? null;

  const honeypotKey =
    typeof payload.honeypotField === "string"
      ? (payload.honeypotField as string)
      : "website_url";

  const result = await submitWebForm({
    formId,
    firstName: String(payload.firstName ?? payload.first_name ?? "").trim(),
    lastName: String(payload.lastName ?? payload.last_name ?? "").trim(),
    email: String(payload.email ?? "").trim(),
    phone: payload.phone ? String(payload.phone).trim() : null,
    state: payload.state ? String(payload.state).trim() : null,
    smsConsentService: Boolean(
      payload.smsConsentService ?? payload.sms_consent_service ?? false
    ),
    smsConsentMarketing: Boolean(
      payload.smsConsentMarketing ?? payload.sms_consent_marketing ?? false
    ),
    honeypot:
      typeof payload[honeypotKey] === "string"
        ? (payload[honeypotKey] as string)
        : null,
    ipAddress,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400, headers });
  }
  return NextResponse.json(result, { status: 200, headers });
}
