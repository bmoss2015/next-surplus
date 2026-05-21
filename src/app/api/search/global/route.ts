import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

// Global search — fans out across every searchable surface in the portal
// and returns up to N hits per category. Backs the topbar search bar.
//
// Every section runs as its own Supabase query inside Promise.allSettled so
// one failing query (missing column, RLS denial, table not on this env) can't
// take down the rest of the search.

type Result = {
  group: string;
  groupLabel: string;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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
  const leadIdSet = new Set<string>();
  const results: Result[] = [];
  const leadCache = new Map<string, { lead_id: string; address: string; city: string | null; state: string | null; zip: string | null }>();

  function placeLine(city?: string | null, state?: string | null, zip?: string | null): string {
    const place = [city, state].filter(Boolean).join(", ");
    return [place || null, zip || null].filter(Boolean).join(" · ");
  }

  function leadHref(id: string): string {
    return `/leads/${id}`;
  }

  function pushLead(
    leadId: string,
    leadInfo: { lead_id: string; address: string; city: string | null; state: string | null; zip: string | null },
    matchHint: string | null
  ) {
    if (leadIdSet.has(leadId)) return;
    leadIdSet.add(leadId);
    const place = placeLine(leadInfo.city, leadInfo.state, leadInfo.zip);
    const subtitleParts = [leadInfo.lead_id, place || null, matchHint].filter(Boolean);
    results.push({
      group: "leads",
      groupLabel: "Leads",
      id: leadId,
      title: leadInfo.address || place || leadInfo.lead_id,
      subtitle: subtitleParts.join(" · ") || null,
      href: leadHref(leadId),
    });
  }

  // Helper: hydrate lead info for an array of lead_ids (uses cache).
  async function hydrateLeads(ids: string[]): Promise<void> {
    const missing = ids.filter((id) => id && !leadCache.has(id));
    if (missing.length === 0) return;
    const { data } = await sb
      .from("leads")
      .select("id, lead_id, address, city, state, zip")
      .in("id", missing);
    for (const r of data ?? []) {
      leadCache.set(r.id as string, {
        lead_id: r.lead_id as string,
        address: r.address as string,
        city: r.city as string | null,
        state: r.state as string | null,
        zip: r.zip as string | null,
      });
    }
  }

  // ─── DIRECT LEAD QUERIES ──────────────────────────────────────────────

  // 1) Leads — match against every lead-level column.
  const leadsQ = sb
    .from("leads")
    .select("id, lead_id, address, city, state, zip, county, case_number")
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
    .limit(10);

  // 2) Owners — name match → lead.
  const ownersQ = sb
    .from("owners")
    .select("full_name, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .ilike("full_name", v)
    .limit(8);

  // 3) Contacts (phone/email values) — match the value → lead.
  const contactsQ = sb
    .from("contacts")
    .select("value, channel, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .ilike("value", v)
    .limit(8);

  // 4) Relatives — match full_name, phone (1-5), email (1-5), street, city → lead.
  const relativesQ = sb
    .from("relatives")
    .select("id, full_name, phone, phone_2, phone_3, phone_4, phone_5, email, email_2, email_3, email_4, email_5, street, city, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or(
      [
        `full_name.ilike.${v}`,
        `phone.ilike.${v}`,
        `phone_2.ilike.${v}`,
        `phone_3.ilike.${v}`,
        `phone_4.ilike.${v}`,
        `phone_5.ilike.${v}`,
        `email.ilike.${v}`,
        `email_2.ilike.${v}`,
        `email_3.ilike.${v}`,
        `email_4.ilike.${v}`,
        `email_5.ilike.${v}`,
        `street.ilike.${v}`,
        `city.ilike.${v}`,
      ].join(",")
    )
    .limit(8);

  // 5) Lead parties (other contacts) — name, organization, email, phone, custom_role_label, notes.
  const partiesQ = sb
    .from("lead_parties")
    .select("id, name, organization, email, phone, custom_role_label, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or(
      [
        `name.ilike.${v}`,
        `organization.ilike.${v}`,
        `email.ilike.${v}`,
        `phone.ilike.${v}`,
        `custom_role_label.ilike.${v}`,
      ].join(",")
    )
    .limit(8);

  // 6) Tasks — title, description, notes.
  const tasksQ = sb
    .from("tasks")
    .select("id, title, description, notes, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or(
      [`title.ilike.${v}`, `description.ilike.${v}`, `notes.ilike.${v}`].join(",")
    )
    .limit(8);

  // 7) Documents — filename, custom_name, notes.
  const docsQ = sb
    .from("documents")
    .select("id, filename, custom_name, notes, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or([`filename.ilike.${v}`, `custom_name.ilike.${v}`, `notes.ilike.${v}`].join(","))
    .limit(8);

  // 8) Mail jobs — recipient name + address.
  const mailJobsQ = sb
    .from("mail_jobs")
    .select("id, recipient_name, recipient_address_line1, recipient_city, recipient_state, recipient_postal_code, status, sent_at, lead_id")
    .or(
      [
        `recipient_name.ilike.${v}`,
        `recipient_address_line1.ilike.${v}`,
        `recipient_city.ilike.${v}`,
        `recipient_state.ilike.${v}`,
        `recipient_postal_code.ilike.${v}`,
      ].join(",")
    )
    .limit(6);

  // 9) Liens — name (the lien holder), bound to lead.
  const liensQ = sb
    .from("liens")
    .select("id, name, amount, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .ilike("name", v)
    .limit(6);

  // ─── NON-LEAD SURFACES ─────────────────────────────────────────────────

  // 10) Attorneys — name, email, phone, notes.
  const attorneysQ = sb
    .from("attorneys")
    .select("id, name, email, phone, notes")
    .or(
      [`name.ilike.${v}`, `email.ilike.${v}`, `phone.ilike.${v}`, `notes.ilike.${v}`].join(",")
    )
    .limit(5);

  // 11) Members.
  const membersQ = sb
    .from("profiles")
    .select("id, full_name, email")
    .or(`full_name.ilike.${v},email.ilike.${v}`)
    .eq("deactivated", false)
    .limit(5);

  // 12) Email + SMS templates.
  const tplsQ = sb
    .from("templates")
    .select("id, name, channel, subject")
    .or(`name.ilike.${v},subject.ilike.${v}`)
    .limit(5);

  // 13) Research templates.
  const researchQ = sb
    .from("research_templates")
    .select("id, name, state, sale_type")
    .ilike("name", v)
    .limit(5);

  // 14) Mail templates.
  const mailTplsQ = sb
    .from("mail_templates")
    .select("id, name, description")
    .or(`name.ilike.${v},description.ilike.${v}`)
    .limit(5);

  const settled = await Promise.allSettled([
    leadsQ,
    ownersQ,
    contactsQ,
    relativesQ,
    partiesQ,
    tasksQ,
    docsQ,
    mailJobsQ,
    liensQ,
    attorneysQ,
    membersQ,
    tplsQ,
    researchQ,
    mailTplsQ,
  ]);
  // Index settled results by position
  const [
    leadsR,
    ownersR,
    contactsR,
    relativesR,
    partiesR,
    tasksR,
    docsR,
    mailJobsR,
    liensR,
    attorneysR,
    membersR,
    tplsR,
    researchR,
    mailTplsR,
  ] = settled;

  type LeadJoin = { id: string; lead_id: string; address: string; city: string | null; state: string | null; zip: string | null; archived: boolean } | null;

  function leadFromJoin(j: unknown): LeadJoin {
    if (!j || typeof j !== "object") return null;
    return j as LeadJoin;
  }

  // 1) Leads
  if (leadsR.status === "fulfilled" && leadsR.value.data) {
    for (const r of leadsR.value.data) {
      leadCache.set(r.id as string, {
        lead_id: r.lead_id as string,
        address: r.address as string,
        city: r.city as string | null,
        state: r.state as string | null,
        zip: r.zip as string | null,
      });
      pushLead(r.id as string, leadCache.get(r.id as string)!, (r as { case_number?: string | null }).case_number || null);
    }
  }

  // Helper to push from a child-table hit with a leads(...) join.
  function pushFromJoin(row: { lead_id?: string | null; leads?: unknown }, matchHint: string | null) {
    const l = leadFromJoin(row.leads);
    if (!l || l.archived) return;
    leadCache.set(l.id, { lead_id: l.lead_id, address: l.address, city: l.city, state: l.state, zip: l.zip });
    pushLead(l.id, leadCache.get(l.id)!, matchHint);
  }

  // 2) Owners
  if (ownersR.status === "fulfilled" && ownersR.value.data) {
    for (const o of ownersR.value.data as Array<{ full_name: string; lead_id: string; leads: unknown }>) {
      pushFromJoin(o, o.full_name);
    }
  }
  // 3) Contacts
  if (contactsR.status === "fulfilled" && contactsR.value.data) {
    for (const c of contactsR.value.data as Array<{ value: string; channel: string; lead_id: string; leads: unknown }>) {
      pushFromJoin(c, `${c.channel}: ${c.value}`);
    }
  }
  // 4) Relatives
  if (relativesR.status === "fulfilled" && relativesR.value.data) {
    for (const r of relativesR.value.data as Array<{ full_name: string; lead_id: string; leads: unknown }>) {
      pushFromJoin(r, `relative: ${r.full_name}`);
    }
  }
  // 5) Lead parties
  if (partiesR.status === "fulfilled" && partiesR.value.data) {
    for (const p of partiesR.value.data as Array<{ name: string; custom_role_label: string | null; lead_id: string; leads: unknown }>) {
      const label = p.custom_role_label || "contact";
      pushFromJoin(p, `${label}: ${p.name}`);
    }
  }
  // 6) Tasks
  if (tasksR.status === "fulfilled" && tasksR.value.data) {
    for (const t of tasksR.value.data as Array<{ id: string; title: string; lead_id: string; leads: unknown }>) {
      pushFromJoin(t, `task: ${t.title}`);
    }
  }
  // 7) Documents
  if (docsR.status === "fulfilled" && docsR.value.data) {
    for (const d of docsR.value.data as Array<{ filename: string; custom_name: string | null; lead_id: string; leads: unknown }>) {
      pushFromJoin(d, `document: ${d.custom_name || d.filename}`);
    }
  }
  // 8) Mail jobs (don't use a leads(...) join because mail_jobs.lead_id can be null)
  if (mailJobsR.status === "fulfilled" && mailJobsR.value.data) {
    const ids = (mailJobsR.value.data as Array<{ lead_id: string | null }>).map((r) => r.lead_id).filter(Boolean) as string[];
    await hydrateLeads(ids);
    for (const m of mailJobsR.value.data as Array<{ id: string; recipient_name: string; recipient_address_line1: string; recipient_city: string; recipient_state: string; recipient_postal_code: string; status: string; sent_at: string | null; lead_id: string | null }>) {
      if (m.lead_id && leadCache.has(m.lead_id)) {
        pushLead(m.lead_id, leadCache.get(m.lead_id)!, `mail to ${m.recipient_name} (${m.status})`);
      } else {
        // standalone mail job not tied to a lead — surface as its own row
        results.push({
          group: "mail_jobs",
          groupLabel: "Sent Mail",
          id: m.id,
          title: m.recipient_name,
          subtitle: [
            `${m.recipient_address_line1}, ${m.recipient_city}, ${m.recipient_state} ${m.recipient_postal_code}`,
            m.status,
          ]
            .filter(Boolean)
            .join(" · "),
          href: "/mail",
        });
      }
    }
  }
  // 9) Liens
  if (liensR.status === "fulfilled" && liensR.value.data) {
    for (const l of liensR.value.data as Array<{ name: string; amount: number | null; lead_id: string; leads: unknown }>) {
      const amount = l.amount != null ? `$${l.amount.toLocaleString()}` : null;
      pushFromJoin(l, `lien: ${l.name}${amount ? ` (${amount})` : ""}`);
    }
  }

  // ─── NON-LEAD SURFACES ────────────────────────────────────────────────

  // 10) Attorneys
  if (attorneysR.status === "fulfilled" && attorneysR.value.data) {
    for (const a of attorneysR.value.data as Array<{ id: string; name: string; email: string | null; phone: string | null }>) {
      results.push({
        group: "attorneys",
        groupLabel: "Attorneys",
        id: a.id,
        title: a.name,
        subtitle: [a.email, a.phone].filter(Boolean).join(" · ") || null,
        href: "/settings#attorneys",
      });
    }
  }
  // 11) Members
  if (membersR.status === "fulfilled" && membersR.value.data) {
    for (const m of membersR.value.data as Array<{ id: string; full_name: string | null; email: string | null }>) {
      results.push({
        group: "members",
        groupLabel: "Members",
        id: m.id,
        title: m.full_name || m.email || "Member",
        subtitle: m.email,
        href: "/settings#team",
      });
    }
  }
  // 12) Email + SMS templates
  if (tplsR.status === "fulfilled" && tplsR.value.data) {
    for (const t of tplsR.value.data as Array<{ id: string; name: string; channel: string; subject: string | null }>) {
      const isEmail = t.channel === "email";
      results.push({
        group: isEmail ? "email_templates" : "sms_templates",
        groupLabel: isEmail ? "Email Templates" : "SMS Templates",
        id: t.id,
        title: t.name,
        subtitle: t.subject ?? null,
        href: isEmail ? "/settings#email-templates" : "/settings#sms-templates",
      });
    }
  }
  // 13) Research templates
  if (researchR.status === "fulfilled" && researchR.value.data) {
    for (const r of researchR.value.data as Array<{ id: string; name: string; state: string | null; sale_type: string | null }>) {
      results.push({
        group: "research_templates",
        groupLabel: "Research Templates",
        id: r.id,
        title: r.name,
        subtitle: [r.state, r.sale_type].filter(Boolean).join(" · ") || null,
        href: "/settings#research-templates",
      });
    }
  }
  // 14) Mail templates
  if (mailTplsR.status === "fulfilled" && mailTplsR.value.data) {
    for (const t of mailTplsR.value.data as Array<{ id: string; name: string; description: string | null }>) {
      results.push({
        group: "mail_templates",
        groupLabel: "Mail Templates",
        id: t.id,
        title: t.name,
        subtitle: t.description ?? null,
        href: "/mail/templates",
      });
    }
  }

  return NextResponse.json(results);
}
