import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Suggestion returned to the ComposeBox To-field autocomplete. Ranked roughly
// by relevance: contacts on the current lead first, then anyone else in the
// org's known people, then any email seen in past messages.
export type ContactSuggestion = {
  name: string;
  email: string;
  role: string | null;
  source: "lead" | "org" | "recent";
};

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const leadId = req.nextUrl.searchParams.get("leadId") ?? null;
  if (raw.length < 1) return NextResponse.json([]);

  // PostgREST ilike pattern — strip glob/escape chars that would break it.
  const safe = raw.replace(/[%_\\]/g, "");
  const pattern = `%${safe}%`;

  const sb = await createClient();
  const out: ContactSuggestion[] = [];
  const seenEmails = new Set<string>();

  function add(item: ContactSuggestion) {
    const key = item.email.toLowerCase();
    if (seenEmails.has(key)) return;
    seenEmails.add(key);
    out.push(item);
  }

  // 1. Owners (via contacts with channel='email') — boost the current lead.
  {
    const { data } = await sb
      .from("contacts")
      .select("value, owners!inner(full_name, is_primary, lead_id)")
      .eq("channel", "email")
      .or(`value.ilike.${pattern}`)
      .limit(20);
    type Row = {
      value: string;
      owners?: {
        full_name: string;
        is_primary: boolean;
        lead_id: string;
      } | { full_name: string; is_primary: boolean; lead_id: string }[] | null;
    };
    const leadRows: ContactSuggestion[] = [];
    const orgRows: ContactSuggestion[] = [];
    for (const r of (data ?? []) as Row[]) {
      const owner = Array.isArray(r.owners) ? r.owners[0] : r.owners;
      if (!owner) continue;
      const item: ContactSuggestion = {
        name: owner.full_name,
        email: r.value,
        role: owner.is_primary ? "Primary Owner" : "Owner",
        source: leadId && owner.lead_id === leadId ? "lead" : "org",
      };
      if (item.source === "lead") leadRows.push(item);
      else orgRows.push(item);
    }
    leadRows.forEach(add);
    orgRows.forEach(add);
  }

  // 2. Owners again, this time matching by name (not email).
  {
    const { data } = await sb
      .from("owners")
      .select("full_name, is_primary, lead_id, contacts!inner(value, channel)")
      .ilike("full_name", pattern)
      .eq("contacts.channel", "email")
      .limit(20);
    type Row = {
      full_name: string;
      is_primary: boolean;
      lead_id: string;
      contacts?: { value: string }[];
    };
    for (const r of (data ?? []) as Row[]) {
      for (const c of r.contacts ?? []) {
        add({
          name: r.full_name,
          email: c.value,
          role: r.is_primary ? "Primary Owner" : "Owner",
          source: leadId && r.lead_id === leadId ? "lead" : "org",
        });
      }
    }
  }

  // 3. Relatives (single email column on each row — multi-email columns
  // exist but the canonical address lives in `email`).
  {
    const { data } = await sb
      .from("relatives")
      .select("full_name, relationship, email, lead_id")
      .not("email", "is", null)
      .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(20);
    type Row = {
      full_name: string;
      relationship: string | null;
      email: string;
      lead_id: string;
    };
    for (const r of (data ?? []) as Row[]) {
      add({
        name: r.full_name,
        email: r.email,
        role: r.relationship ?? "Relative",
        source: leadId && r.lead_id === leadId ? "lead" : "org",
      });
    }
  }

  // 4. Lead parties (Other Contacts).
  {
    const { data } = await sb
      .from("lead_parties")
      .select("name, role, custom_role_label, email, lead_id")
      .not("email", "is", null)
      .or(`name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(20);
    type Row = {
      name: string;
      role: string;
      custom_role_label: string | null;
      email: string;
      lead_id: string;
    };
    for (const r of (data ?? []) as Row[]) {
      add({
        name: r.name,
        email: r.email,
        role: r.role === "other" ? r.custom_role_label ?? "Other" : r.role,
        source: leadId && r.lead_id === leadId ? "lead" : "org",
      });
    }
  }

  // 5. Attorneys.
  {
    const { data } = await sb
      .from("attorneys")
      .select("name, email")
      .not("email", "is", null)
      .or(`name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(10);
    for (const r of (data ?? []) as { name: string; email: string }[]) {
      add({ name: r.name, email: r.email, role: "Attorney", source: "org" });
    }
  }

  // 6. Recent message addresses (anything we've sent to or received from).
  {
    const { data } = await sb
      .from("messages")
      .select("from_address, from_name, to_addresses")
      .or(`from_address.ilike.${pattern},from_name.ilike.${pattern}`)
      .order("sent_at", { ascending: false })
      .limit(40);
    type Row = {
      from_address: string;
      from_name: string | null;
      to_addresses: string[] | null;
    };
    for (const r of (data ?? []) as Row[]) {
      if (r.from_address && r.from_address.toLowerCase().includes(safe.toLowerCase())) {
        add({
          name: r.from_name ?? r.from_address,
          email: r.from_address,
          role: null,
          source: "recent",
        });
      }
    }
  }

  // Cap final suggestions list.
  return NextResponse.json(out.slice(0, 12));
}
