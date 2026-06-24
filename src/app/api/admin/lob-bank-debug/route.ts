import { NextResponse, type NextRequest } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { lobGetBankAccount, isLobConfigured } from "@/lib/mail";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-shot diagnostic for the Lob micro-deposit verification flow.
// Returns Lob's authoritative view of a bank account (verified status,
// verification attempts, signatory, account type, dates) alongside the
// portal-side row. Used to debug bank verification failures where we
// see partial / reversed micro-deposits and cannot tell whether Lob
// thinks the account is failed, pending, or successfully verified.
//
// Usage:  GET /api/admin/lob-bank-debug?id=<mail_bank_accounts.id>
//   or:   GET /api/admin/lob-bank-debug?lob_id=bank_xxxxxxxxxxxxxxx
//
// Owner-only. Bare JSON response, no UI.

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  if (!profile.isOwner) {
    return NextResponse.json({ ok: false, error: "Owner only" }, { status: 403 });
  }
  if (!isLobConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Lob not configured in this environment" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const portalId = url.searchParams.get("id");
  const directLobId = url.searchParams.get("lob_id");

  let lobBankId = directLobId;
  let portalRow: Record<string, unknown> | null = null;

  if (portalId) {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("mail_bank_accounts")
      .select(
        "id, lob_bank_account_id, bank_name, account_holder_name, routing_last_four, account_last_four, status, verified_via, verify_attempts, last_verify_error, last_verify_attempt_at, verified_at, created_at"
      )
      .eq("id", portalId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: `Portal row not found for id=${portalId}: ${error?.message ?? "no row"}` },
        { status: 404 }
      );
    }
    portalRow = data as Record<string, unknown>;
    lobBankId = (data.lob_bank_account_id as string | null) ?? null;
  }

  if (!lobBankId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Pass ?id=<portal_id> or ?lob_id=bank_xxx. Portal row has no lob_bank_account_id.",
      },
      { status: 400 }
    );
  }

  const lobRes = await lobGetBankAccount(lobBankId);
  return NextResponse.json({
    ok: true,
    portal_row: portalRow,
    lob_bank_id: lobBankId,
    lob_response: lobRes,
  });
}
