// Periodic cron: for every Plaid-linked bank account still pending Lob
// micro-deposit verification, query Plaid Transactions for the two
// small ACH credits Lob sends and call Lob's /verify when both land.
// Operator-side experience: they click "Connect Bank" once, this loop
// flips the row to verified within a 4-hour window after the second
// deposit posts.
//
// Cron schedule lives in vercel.json (every 4 hours by default). Lob
// micro-deposits typically arrive within 1-2 business days, so this
// cadence catches the second deposit fast without hammering Plaid.
//
// Safety rails baked in (fix BANK-VERIFY-AUDIT, 2026-06-19):
//   1. Merchant-name filter. Only Plaid transactions whose `name` or
//      `merchant_name` contains "LOB" qualify as Lob micro-deposits.
//      Without this we could feed Lob the wrong cent pair from a random
//      sub-$1 credit (interest accrual, reversed fee, etc.) and burn
//      through Lob's 3-attempt verification limit.
//   2. Attempt cap. Lob locks a bank account after 3 failed /verify
//      calls. We stop auto-trying at 2 so the operator always has the
//      third attempt available manually from the Settings UI.
//   3. Per-attempt logging. Every verify call (success or failure)
//      writes verify_attempts + last_verify_error + last_verify_attempt_at
//      back to the row.
//
// Auth: Vercel adds `Authorization: Bearer <CRON_SECRET>` automatically
// to cron requests when CRON_SECRET is set in env. We reject anything
// else.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid/client";
import { lobVerifyBankAccount } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MICRODEPOSIT_AMOUNT = 1.0;
const TRANSACTIONS_LOOKBACK_DAYS = 7;
const AUTO_VERIFY_ATTEMPT_CAP = 2;

type PendingRow = {
  id: string;
  lob_bank_account_id: string;
  plaid_access_token: string;
  plaid_item_id: string | null;
  status: string;
  verify_attempts: number | null;
};

function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function looksLikeLobMicroDeposit(name: string | null, merchant: string | null): boolean {
  const text = `${name ?? ""} ${merchant ?? ""}`.toLowerCase();
  return text.includes("lob");
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isPlaidConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Plaid not configured" },
      { status: 200 }
    );
  }
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("mail_bank_accounts")
    .select("id, lob_bank_account_id, plaid_access_token, plaid_item_id, status, verify_attempts")
    .eq("verified_via", "plaid")
    .neq("status", "verified")
    .not("plaid_access_token", "is", null);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const pending = ((data ?? []) as PendingRow[]).filter(
    (r) =>
      r.plaid_access_token &&
      r.lob_bank_account_id &&
      ((r.verify_attempts ?? 0) < AUTO_VERIFY_ATTEMPT_CAP)
  );
  const results: Array<{ id: string; outcome: string }> = [];

  for (const row of pending) {
    try {
      const txRes = await plaidClient().transactionsGet({
        access_token: row.plaid_access_token,
        start_date: daysAgoISO(TRANSACTIONS_LOOKBACK_DAYS),
        end_date: todayISO(),
        options: { count: 100 },
      });
      const microDeposits = txRes.data.transactions
        .map((t) => ({
          amount: -t.amount,
          name: t.name ?? null,
          merchant: t.merchant_name ?? null,
          date: t.date,
        }))
        .filter(
          (t) =>
            t.amount > 0 &&
            t.amount < MAX_MICRODEPOSIT_AMOUNT &&
            looksLikeLobMicroDeposit(t.name, t.merchant)
        )
        .sort((a, b) => b.date.localeCompare(a.date));
      if (microDeposits.length < 2) {
        results.push({ id: row.id, outcome: "no_deposits_yet" });
        continue;
      }
      const [d1, d2] = microDeposits;
      const cents1 = Math.round(d1.amount * 100);
      const cents2 = Math.round(d2.amount * 100);
      const verifyRes = await lobVerifyBankAccount(row.lob_bank_account_id, {
        kind: "amounts",
        amounts: [cents1, cents2],
      });
      const nowIso = new Date().toISOString();
      const nextAttempts = ((row.verify_attempts ?? 0) as number) + 1;
      if (!verifyRes.ok) {
        await admin
          .from("mail_bank_accounts")
          .update({
            verify_attempts: nextAttempts,
            last_verify_error: verifyRes.error,
            last_verify_attempt_at: nowIso,
          })
          .eq("id", row.id);
        results.push({
          id: row.id,
          outcome: `lob_verify_failed: ${verifyRes.error}`,
        });
        continue;
      }
      await admin
        .from("mail_bank_accounts")
        .update({
          status: "verified",
          verified_at: nowIso,
          verify_attempts: nextAttempts,
          last_verify_error: null,
          last_verify_attempt_at: nowIso,
        })
        .eq("id", row.id);
      results.push({ id: row.id, outcome: "verified" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: row.id, outcome: `error: ${msg}` });
    }
  }
  return NextResponse.json({ ok: true, checked: pending.length, results });
}
