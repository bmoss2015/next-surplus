import { promises as dns } from "node:dns";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight free email-validation endpoint. Does a DNS MX lookup on the
// email's domain — if the domain has at least one MX record, mail will route
// to it. Catches the obvious failures (typos like `@gnail.com`, defunct
// domains, junk TLDs) at zero cost. Doesn't prove the specific mailbox is
// real — that requires SMTP-level probing or a paid service like Bouncer.
export type MxVerifyResult =
  | { ok: true; status: "valid" | "invalid"; reason?: string }
  | { ok: false; error: string };

function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return null;
  return domain;
}

export async function POST(req: NextRequest): Promise<NextResponse<MxVerifyResult>> {
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = (body.email ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Missing or malformed email" }, { status: 400 });
  }

  const domain = emailDomain(email);
  if (!domain || !domain.includes(".")) {
    return NextResponse.json(
      { ok: true, status: "invalid", reason: "Malformed domain" },
      { status: 200 }
    );
  }

  try {
    const records = await dns.resolveMx(domain);
    if (Array.isArray(records) && records.length > 0) {
      return NextResponse.json({ ok: true, status: "valid" });
    }
    return NextResponse.json({
      ok: true,
      status: "invalid",
      reason: "No MX records found",
    });
  } catch (err) {
    const code = (err as { code?: string } | null)?.code ?? "";
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return NextResponse.json({
        ok: true,
        status: "invalid",
        reason: code === "ENOTFOUND" ? "Domain does not exist" : "No MX records",
      });
    }
    return NextResponse.json(
      { ok: false, error: `DNS lookup failed (${code || "unknown"})` },
      { status: 500 }
    );
  }
}
