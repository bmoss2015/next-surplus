import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { syncGmailAccount, syncAllActiveAccounts } from "@/lib/email/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Sync trigger. Two callers:
//   - The OAuth callback fires this once (`?accountAddress=...`) to kick off
//     the initial backfill for the just-connected account.
//   - The cron route hits this (`?all=1`) every couple minutes.
// Both require the INTERNAL_TRIGGER_SECRET header.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-trigger");
  if (!secret || secret !== process.env.INTERNAL_TRIGGER_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const accountId = sp.get("accountId");
  const accountAddress = sp.get("accountAddress");
  const all = sp.get("all") === "1";

  if (all) {
    const results = await syncAllActiveAccounts();
    return NextResponse.json({ results });
  }

  let targetAccountId = accountId;
  if (!targetAccountId && accountAddress) {
    const svc = createServiceClient();
    const { data } = await svc
      .from("channel_accounts")
      .select("id")
      .eq("address", accountAddress)
      .eq("provider", "gmail")
      .maybeSingle();
    targetAccountId = (data?.id as string | undefined) ?? null;
  }
  if (!targetAccountId) {
    return NextResponse.json(
      { error: "accountId or accountAddress required" },
      { status: 400 }
    );
  }

  const result = await syncGmailAccount(targetAccountId);
  return NextResponse.json({ result });
}
