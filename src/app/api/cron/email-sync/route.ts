import { NextRequest, NextResponse } from "next/server";
import { syncAllActiveAccounts } from "@/lib/email/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel Cron hits this every couple minutes.
// Authenticated via the `Authorization: Bearer <CRON_SECRET>` header that
// Vercel sets automatically when CRON_SECRET is configured.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await syncAllActiveAccounts();
  return NextResponse.json({ results });
}
