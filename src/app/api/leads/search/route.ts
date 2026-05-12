import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeadOption } from "@/lib/leads/lead-options";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const sb = await createClient();

  let query = sb
    .from("leads")
    .select("id, lead_id, address, owners(full_name, is_primary)")
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

  // Fix FFF Patch: flatten the primary owner's name onto each row so the search
  // dropdown can show "Lead ID · Address · Owner". The extra `owner` field is
  // harmless to existing consumers that only read id/lead_id/address.
  const rows = (data ?? []).map((r) => {
    const owners = (r.owners ?? []) as Array<{
      full_name: string;
      is_primary: boolean;
    }>;
    const owner =
      owners.find((o) => o.is_primary)?.full_name ?? owners[0]?.full_name ?? null;
    return { id: r.id, lead_id: r.lead_id, address: r.address, owner };
  });

  return NextResponse.json(rows as Array<LeadOption & { owner: string | null }>);
}
