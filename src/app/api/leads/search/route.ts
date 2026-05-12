import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeadOption } from "@/lib/leads/lead-options";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const sb = await createClient();

  let query = sb
    .from("leads")
    .select("id, lead_id, address")
    .neq("stage", "lost")
    .eq("archived", false)
    .limit(20);

  if (q) {
    // Strip characters that would break the PostgREST `or` filter grammar
    // (commas, parens, quotes, percent, the `*` wildcard), then match as a
    // contains-substring using PostgREST's `*` wildcard.
    const sanitized = q.replace(/[%*"'(),\\]/g, "").trim();
    if (sanitized) {
      const value = `*${sanitized}*`;
      query = query.or(`lead_id.ilike.${value},address.ilike.${value}`);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as LeadOption[]);
}
