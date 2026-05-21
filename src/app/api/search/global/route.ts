import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

// Global search — fans out across leads / attorneys / members / templates and
// returns up to 5 hits per category. Backs the TopNav search bar.

type Group =
  | "leads"
  | "attorneys"
  | "members"
  | "email_templates"
  | "sms_templates"
  | "research_templates";

type Result = {
  group: Group;
  groupLabel: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Strip characters that would break the PostgREST `or` filter grammar.
  const sanitized = q.replace(/[%*"'(),\\]/g, "").trim();
  if (!sanitized) return NextResponse.json([]);
  const v = `*${sanitized}*`;

  const sb = await createClient();
  const results: Result[] = [];

  // Leads — match across every searchable column. The address, city, state,
  // zip, county are separate columns on `leads`, so "Suwanee" only finds
  // leads if we explicitly query `city` (not just `address`).
  const { data: leads } = await sb
    .from("leads")
    .select("id, lead_id, address, city, state, zip, county, case_number, owners(full_name, is_primary)")
    .or(
      [
        `lead_id.ilike.${v}`,
        `address.ilike.${v}`,
        `city.ilike.${v}`,
        `state.ilike.${v}`,
        `zip.ilike.${v}`,
        `county.ilike.${v}`,
        `case_number.ilike.${v}`,
      ].join(",")
    )
    .eq("archived", false)
    .limit(8);
  for (const r of leads ?? []) {
    const owners = ((r as { owners?: Array<{ full_name: string; is_primary: boolean }> }).owners) ?? [];
    const owner = owners.find((o) => o.is_primary)?.full_name ?? owners[0]?.full_name ?? null;
    const city = (r as { city?: string | null }).city;
    const state = (r as { state?: string | null }).state;
    const zip = (r as { zip?: string | null }).zip;
    const place = [city, state].filter(Boolean).join(", ");
    const subtitleParts = [r.lead_id as string, place || null, zip || null, owner].filter(Boolean);
    results.push({
      group: "leads",
      groupLabel: "Leads",
      id: r.id as string,
      title: (r.address as string) || place || (r.lead_id as string),
      subtitle: subtitleParts.join(" · ") || null,
      href: `/leads/${r.id}`,
    });
  }

  // Owners — separate query for owner name matches (search.owners is harder via PostgREST joins)
  const { data: leadsByOwner } = await sb
    .from("owners")
    .select("full_name, leads(id, lead_id, address, city, state, zip)")
    .ilike("full_name", v)
    .limit(5);
  for (const o of leadsByOwner ?? []) {
    const leadRow = (o as { leads?: { id: string; lead_id: string; address: string; city: string | null; state: string | null; zip: string | null } | null }).leads;
    if (!leadRow) continue;
    // Skip if already in results
    if (results.find((r) => r.group === "leads" && r.id === leadRow.id)) continue;
    const place = [leadRow.city, leadRow.state].filter(Boolean).join(", ");
    results.push({
      group: "leads",
      groupLabel: "Leads",
      id: leadRow.id,
      title: leadRow.address || place || leadRow.lead_id,
      subtitle: [leadRow.lead_id, place || null, (o as { full_name: string }).full_name].filter(Boolean).join(" · "),
      href: `/leads/${leadRow.id}`,
    });
  }

  // Attorneys
  const { data: attorneys } = await sb
    .from("attorneys")
    .select("id, name, email")
    .or(`name.ilike.${v},email.ilike.${v}`)
    .limit(5);
  for (const a of attorneys ?? []) {
    results.push({
      group: "attorneys",
      groupLabel: "Attorneys",
      id: a.id as string,
      title: a.name as string,
      subtitle: (a.email as string | null) ?? null,
      href: `/settings#attorneys`,
    });
  }

  // Team members
  const { data: members } = await sb
    .from("profiles")
    .select("id, full_name, email")
    .or(`full_name.ilike.${v},email.ilike.${v}`)
    .eq("deactivated", false)
    .limit(5);
  for (const m of members ?? []) {
    results.push({
      group: "members",
      groupLabel: "Members",
      id: m.id as string,
      title: (m.full_name as string) || (m.email as string) || "Member",
      subtitle: (m.email as string | null) ?? null,
      href: `/settings#team`,
    });
  }

  // Templates (email / sms via the templates table, research via its own)
  const { data: tpls } = await sb
    .from("templates")
    .select("id, name, channel, subject")
    .or(`name.ilike.${v},subject.ilike.${v}`)
    .limit(5);
  for (const t of tpls ?? []) {
    const isEmail = (t.channel as string) === "email";
    results.push({
      group: isEmail ? "email_templates" : "sms_templates",
      groupLabel: isEmail ? "Email Templates" : "SMS Templates",
      id: t.id as string,
      title: t.name as string,
      subtitle: (t.subject as string | null) ?? null,
      href: isEmail ? "/settings#email-templates" : "/settings#sms-templates",
    });
  }

  const { data: research } = await sb
    .from("research_templates")
    .select("id, name, state, sale_type")
    .ilike("name", v)
    .limit(5);
  for (const r of research ?? []) {
    results.push({
      group: "research_templates",
      groupLabel: "Research Templates",
      id: r.id as string,
      title: r.name as string,
      subtitle: [r.state, r.sale_type].filter(Boolean).join(" · ") || null,
      href: "/settings#research-templates",
    });
  }

  return NextResponse.json(results);
}
