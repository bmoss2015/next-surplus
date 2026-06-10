// Daily cron: for every Plaid-linked bank account that's still
// pending Lob micro-deposit verification, query Plaid Transactions for
// the two small ACH credits Lob sends and auto-call Lob's verify
// endpoint when we find them. From the operator's POV they clicked
// "Connect Bank" once; this loop flips the row to verified on its own.
//
// Cron schedule lives in vercel.json. Default cadence: every 4 hours.
// Lob micro-deposits typically arrive within 1-2 business days, so we
// don't need to poll faster than that.
//
// Auth: Vercel adds `Authorization: Bearer <CRON_SECRET>` automatically
// to cron requests when CRON_SECRET is set in env. We reject any other
// caller.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { plaidClient, isPlaidConfigured } from "@/lib/plaid/client";
import { lobVerifyBankAccount } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lob micro-deposits land as ACH credits under $1. Filter on this to
// avoid false-positive verifying against random small transactions.
const MAX_MICRODEPOSIT_AMOUNT = 1.0;
// Days back to scan for the deposits. Lob lands them in 1-2 business
// days; 7 covers weekends and any pending-vs-posted lag.
const TRANSACTIONS_LOOKBACK_DAYS = 7;

type PendingRow = {
  id: string;
  lob_bank_account_id: string;
  plaid_access_token: string;
  plaid_item_id: string | null;
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
    .select("id, lob_bank_account_id, plaid_access_token, plaid_item_id, status")
    .eq("verified_via", "plaid")
    .neq("status", "verified")
    .not("plaid_access_token", "is", null);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const pending = ((data ?? []) as Array<PendingRow & { status: string }>).filter(
    (r) => r.plaid_access_token && r.lob_bank_account_id
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
      // Plaid amount sign: positive = money out (debit). Micro-deposits
      // are credits, so their amount is negative. Flip and filter.
      const microDeposits = txRes.data.transactions
        .map((t) => ({ amount: -t.amount, name: t.name, date: t.date }))
        .filter(
          (t) => t.amount > 0 && t.amount < MAX_MICRODEPOSIT_AMOUNT
        )
        .sort((a, b) => b.date.localeCompare(a.date));
      if (microDeposits.length < 2) {
        results.push({ id: row.id, outcome: "no_deposits_yet" });
        continue;
      }
      // Take the two most recent matching deposits.
      const [d1, d2] = microDeposits;
      const cents1 = Math.round(d1.amount * 100);
      const cents2 = Math.round(d2.amount * 100);
      const verifyRes = await lobVerifyBankAccount(row.lob_bank_account_id, [
        cents1,
        cents2,
      ]);
      if (!verifyRes.ok) {
        results.push({ id: row.id, outcome: `lob_verify_failed: ${verifyRes.error}` });
        continue;
      }
      await admin
        .from("mail_bank_accounts")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("id", row.id);
      results.push({ id: row.id, outcome: "verified" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: row.id, outcome: `error: ${msg}` });
    }
  }
  return NextResponse.json({ ok: true, checked: pending.length, results });
}
