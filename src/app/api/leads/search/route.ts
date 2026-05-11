import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeadOption } from "@/lib/leads/lead-options";

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
    const sanitized = q.replace(/[%"'()\\]/g, "");
    const value = `%${sanitized}%`;
    query = query.or(`lead_id.ilike.${value},address.ilike.${value}`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []) as LeadOption[]);
}
