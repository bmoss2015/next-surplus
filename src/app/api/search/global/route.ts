import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import {
  US_STATE_NAMES,
  STAGES,
  STAGE_LABELS,
  SALE_TYPES,
  SALE_TYPE_LABELS,
  OWNER_STATUSES,
  OWNER_STATUS_LABELS,
  type Stage,
  type SaleType,
  type OwnerStatus,
} from "@/lib/leads/types";

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

  // Map full state names → 2-letter codes for the query. Storage is the
  // 2-letter code so 'maryland' would otherwise miss every MD lead. If the
  // user types a substring of any state name, include those codes as an
  // additional state.in.(...) filter wherever a state column exists.
  const sanitizedLower = sanitized.toLowerCase();
  const stateCodesFromName: string[] = [];
  for (const [code, name] of Object.entries(US_STATE_NAMES)) {
    if (name.toLowerCase().includes(sanitizedLower)) stateCodesFromName.push(code);
  }
  const stateInFilter =
    stateCodesFromName.length > 0 ? `state.in.(${stateCodesFromName.join(",")})` : null;
  const recipientStateInFilter =
    stateCodesFromName.length > 0
      ? `recipient_state.in.(${stateCodesFromName.join(",")})`
      : null;

  // Enums — reverse-lookup display labels to storage values.
  // 'Won' → stage.eq.won, 'Mortgage' → sale_type.eq.MTG, etc.
  const stageMatches = STAGES.filter((s) =>
    STAGE_LABELS[s].toLowerCase().includes(sanitizedLower)
  );
  const saleTypeMatches = SALE_TYPES.filter((s) =>
    SALE_TYPE_LABELS[s].toLowerCase().includes(sanitizedLower)
  );
  const ownerStatusMatches = OWNER_STATUSES.filter((s) =>
    OWNER_STATUS_LABELS[s].toLowerCase().includes(sanitizedLower)
  );
  const stageInFilter = stageMatches.length > 0 ? `stage.in.(${stageMatches.join(",")})` : null;
  const saleTypeInFilter =
    saleTypeMatches.length > 0 ? `sale_type.in.(${saleTypeMatches.join(",")})` : null;
  const ownerStatusInFilter =
    ownerStatusMatches.length > 0 ? `status.in.(${ownerStatusMatches.join(",")})` : null;

  // Numeric — if the query parses as a number (after stripping $/,/space),
  // try to match every amount-style column. Currency in the UI is rounded
  // to whole dollars (maximumFractionDigits: 0), so a typed integer like
  // 96668 should match any stored value that displays as $96,668 — i.e.
  // [96667.50, 96668.50). Decimals match exactly.
  const numericRaw = sanitized.replace(/[$,\s]/g, "");
  const numericValue = /^-?\d+(\.\d+)?$/.test(numericRaw) ? Number(numericRaw) : null;
  const numericIsInteger = numericValue != null && Number.isInteger(numericValue);
  function currencyFilter(col: string): string | null {
    if (numericValue == null) return null;
    if (numericIsInteger) {
      const low = numericValue - 0.5;
      const high = numericValue + 0.5;
      return `and(${col}.gte.${low},${col}.lt.${high})`;
    }
    return `${col}.eq.${numericValue}`;
  }
  const leadAmountFilters =
    numericValue != null && Number.isFinite(numericValue)
      ? ([
          currencyFilter("closing_bid"),
          currencyFilter("estimated_surplus"),
          currencyFilter("confirmed_surplus"),
          currencyFilter("source_surplus"),
          currencyFilter("estimated_net_payout"),
          currencyFilter("attorney_cost"),
          // recovery_fee_percent is a percent, not currency — exact match only.
          `recovery_fee_percent.eq.${numericValue}`,
        ].filter(Boolean) as string[])
      : [];
  const lienAmountFilter =
    numericValue != null && Number.isFinite(numericValue)
      ? currencyFilter("amount")
      : null;

  // Phone normalization — phones are stored in mixed formats
  // ('(555) 123-4567' / '5551234567' / '+1 555-123-4567' / etc). Strip the
  // query to digits and interleave with wildcards so any punctuation between
  // any pair of digits still matches. "4567" → "*4*5*6*7*" finds the last
  // four digits of a formatted phone; "5551234" → "*5*5*5*1*2*3*4*" finds
  // a 7-digit partial regardless of formatting. Threshold lowered to 4 so
  // typing a last-4 or area code starts working.
  const phoneDigits = sanitized.replace(/\D/g, "");
  let phoneIlikeValue: string | null = null;
  if (phoneDigits.length >= 4) {
    let d = phoneDigits;
    // Drop a leading country-code 1 if we have 11 digits — '+15551234567' should
    // match '(555) 123-4567'.
    if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
    phoneIlikeValue = `*${d.split("").join("*")}*`;
  }

  // Date parsing — leads have several date columns (sale_date, redemption_ends,
  // filing_deadline). Try to interpret the query as an ISO date / year-month /
  // year / MM-DD-YY and translate to PostgREST .eq./range filters.
  const dateLeadFilters: string[] = [];
  const ymdMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(sanitized);
  const ymMatch = /^(\d{4})-(\d{1,2})$/.exec(sanitized);
  const yMatch = /^(\d{4})$/.exec(sanitized);
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(sanitized);
  const dateLeadCols = ["sale_date", "redemption_ends", "filing_deadline"];
  function pushExactDate(date: string) {
    for (const col of dateLeadCols) dateLeadFilters.push(`${col}.eq.${date}`);
  }
  function pushRange(start: string, endExclusive: string) {
    for (const col of dateLeadCols)
      dateLeadFilters.push(`and(${col}.gte.${start},${col}.lt.${endExclusive})`);
  }
  if (ymdMatch) {
    const date = `${ymdMatch[1]}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[3].padStart(2, "0")}`;
    pushExactDate(date);
  } else if (ymMatch) {
    const yr = ymMatch[1];
    const mo = ymMatch[2].padStart(2, "0");
    const start = `${yr}-${mo}-01`;
    const nextMo = Number(mo) === 12 ? `${Number(yr) + 1}-01-01` : `${yr}-${String(Number(mo) + 1).padStart(2, "0")}-01`;
    pushRange(start, nextMo);
  } else if (yMatch) {
    // Only treat 4-digit as year if it's plausibly in our domain range — avoids
    // a $2026 amount triggering a yearlong sale-date scan. Both still match
    // because the numeric eq already handles 2026 as a number.
    const yr = Number(yMatch[1]);
    if (yr >= 1900 && yr <= 2100) {
      pushRange(`${yr}-01-01`, `${yr + 1}-01-01`);
    }
  } else if (slashMatch) {
    const m = slashMatch[1].padStart(2, "0");
    const dd = slashMatch[2].padStart(2, "0");
    let y = slashMatch[3];
    if (y.length === 2) y = "20" + y;
    pushExactDate(`${y}-${m}-${dd}`);
  }

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
    .select("id, lead_id, address, city, state, zip, county, case_number, estimated_surplus, confirmed_surplus, source_surplus, estimated_net_payout, closing_bid, attorney_cost, recovery_fee_percent, stage, sale_type")
    .or(
      [
        `lead_id.ilike.${v}`,
        `address.ilike.${v}`,
        `city.ilike.${v}`,
        `state.ilike.${v}`,
        `zip.ilike.${v}`,
        `county.ilike.${v}`,
        `case_number.ilike.${v}`,
        `parcel_number.ilike.${v}`,
        stateInFilter,
        stageInFilter,
        saleTypeInFilter,
        ...leadAmountFilters,
        ...dateLeadFilters,
      ]
        .filter(Boolean)
        .join(",")
    )
    .eq("archived", false)
    .limit(10);

  // 2) Owners — name OR status (Living/Deceased/etc.) → lead.
  const ownersQ = sb
    .from("owners")
    .select("full_name, status, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or(
      [`full_name.ilike.${v}`, ownerStatusInFilter].filter(Boolean).join(",")
    )
    .limit(8);

  // 3) Contacts (phone/email values) — match the value → lead. If the query
  // looks like a phone number, also try a digit-wildcard pattern that ignores
  // formatting differences.
  const contactsQ = sb
    .from("contacts")
    .select("value, channel, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or(
      [
        `value.ilike.${v}`,
        phoneIlikeValue ? `value.ilike.${phoneIlikeValue}` : null,
      ]
        .filter(Boolean)
        .join(",")
    )
    .limit(8);

  // 4) Relatives — match full_name, phone (1-5), email (1-5), street, city, state → lead.
  const phoneIlikeFilters = phoneIlikeValue
    ? [
        `phone.ilike.${phoneIlikeValue}`,
        `phone_2.ilike.${phoneIlikeValue}`,
        `phone_3.ilike.${phoneIlikeValue}`,
        `phone_4.ilike.${phoneIlikeValue}`,
        `phone_5.ilike.${phoneIlikeValue}`,
      ]
    : [];
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
        ...phoneIlikeFilters,
        `email.ilike.${v}`,
        `email_2.ilike.${v}`,
        `email_3.ilike.${v}`,
        `email_4.ilike.${v}`,
        `email_5.ilike.${v}`,
        `street.ilike.${v}`,
        `city.ilike.${v}`,
        `state.ilike.${v}`,
        stateInFilter,
      ]
        .filter(Boolean)
        .join(",")
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
        phoneIlikeValue ? `phone.ilike.${phoneIlikeValue}` : null,
        `custom_role_label.ilike.${v}`,
      ]
        .filter(Boolean)
        .join(",")
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
        recipientStateInFilter,
      ]
        .filter(Boolean)
        .join(",")
    )
    .limit(6);

  // 9) Liens — name OR amount, bound to lead.
  const liensQ = sb
    .from("liens")
    .select("id, name, amount, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or([`name.ilike.${v}`, lienAmountFilter].filter(Boolean).join(","))
    .limit(6);

  // 9a) Discussion comments — flat text body tied to a lead.
  const commentsQ = sb
    .from("discussion_comments")
    .select("id, body, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .ilike("body", v)
    .limit(6);

  // 9b) Activities — JSON payload search. Common note keys are payload.body
  // and payload.text (review_pause uses `reason`). PostgREST supports
  // `column->>field.ilike.*x*` for JSON-path text matching.
  const activitiesQ = sb
    .from("activities")
    .select("id, activity_type, payload, lead_id, leads(id, lead_id, address, city, state, zip, archived)")
    .or(
      [
        `payload->>body.ilike.${v}`,
        `payload->>text.ilike.${v}`,
        `payload->>reason.ilike.${v}`,
        `payload->>note.ilike.${v}`,
      ].join(",")
    )
    .limit(6);

  // ─── NON-LEAD SURFACES ─────────────────────────────────────────────────

  // 10) Attorneys — name, email, phone (format-flexible), notes.
  const attorneysQ = sb
    .from("attorneys")
    .select("id, name, email, phone, notes")
    .or(
      [
        `name.ilike.${v}`,
        `email.ilike.${v}`,
        `phone.ilike.${v}`,
        phoneIlikeValue ? `phone.ilike.${phoneIlikeValue}` : null,
        `notes.ilike.${v}`,
      ]
        .filter(Boolean)
        .join(",")
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

  // 13) Research templates — match name OR state (code or full name).
  const researchQ = sb
    .from("research_templates")
    .select("id, name, state, sale_type")
    .or(
      [`name.ilike.${v}`, `state.ilike.${v}`, stateInFilter].filter(Boolean).join(",")
    )
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
    commentsQ,
    activitiesQ,
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
    commentsR,
    activitiesR,
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

  // snake_case / SCREAMING_CASE → "Title Case" so backend identifiers never
  // surface in result text. `mailing_address_updated` → `Mailing Address
  // Updated`, `MTG` left alone (caller decides), `email` → `Email`.
  function humanize(s: string): string {
    return s
      .replace(/[_-]+/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // 1) Leads — when the lead matched on a non-address field, surface that
  // field in the subtitle so the user can see *why* this row came up.
  // Otherwise the result reads as a plain address with no breadcrumb.
  if (leadsR.status === "fulfilled" && leadsR.value.data) {
    const qLower = sanitized.toLowerCase();
    type LeadRow = {
      id: string; lead_id: string; address: string;
      city: string | null; state: string | null; zip: string | null;
      county: string | null; case_number: string | null;
      stage: string | null; sale_type: string | null;
      estimated_surplus: number | null;
      confirmed_surplus: number | null;
      source_surplus: number | null;
      estimated_net_payout: number | null;
      closing_bid: number | null;
      attorney_cost: number | null;
      recovery_fee_percent: number | null;
    };
    // Currency columns in priority order — when a numeric query matches one
    // of these, the hint reads e.g. "Est. Net Payout: $96,668" so the user
    // can see which financial value brought this lead up.
    const CURRENCY_COLS: Array<[string, keyof LeadRow]> = [
      ["Est. Net Payout", "estimated_net_payout"],
      ["Confirmed Surplus", "confirmed_surplus"],
      ["Est. Surplus", "estimated_surplus"],
      ["Source Surplus", "source_surplus"],
      ["Closing Bid", "closing_bid"],
      ["Attorney Cost", "attorney_cost"],
    ];
    function fmtMoney(n: number): string {
      return `$${Math.round(n).toLocaleString()}`;
    }
    function leadMatchHint(r: LeadRow): string | null {
      // Numeric match — surface the financial field that rounds to the query.
      if (numericValue != null && Number.isFinite(numericValue)) {
        for (const [label, col] of CURRENCY_COLS) {
          const v = r[col] as number | null;
          if (v == null) continue;
          const hitsRounded = numericIsInteger && Math.round(v) === numericValue;
          const hitsExact = !numericIsInteger && v === numericValue;
          if (hitsRounded || hitsExact) {
            return `${label}: ${fmtMoney(v)}`;
          }
        }
        if (
          r.recovery_fee_percent != null &&
          r.recovery_fee_percent === numericValue
        ) {
          return `Recovery Fee: ${r.recovery_fee_percent}%`;
        }
      }
      const addr = (r.address || "").toLowerCase();
      // If the address itself contains the query, the title already shows it.
      if (addr.includes(qLower)) return null;
      const checks: Array<[string, string | null | undefined]> = [
        ["County", r.county],
        ["Case #", r.case_number],
        ["Lead ID", r.lead_id],
        ["City", r.city],
        ["ZIP", r.zip],
      ];
      for (const [label, value] of checks) {
        if (value && String(value).toLowerCase().includes(qLower)) {
          return `${label}: ${value}`;
        }
      }
      // State and enum matches don't contain the literal query — they came
      // from reverse-lookup. Surface a Title-Case label.
      if (r.state && stateCodesFromName.includes(r.state)) {
        return `State: ${US_STATE_NAMES[r.state] ?? r.state}`;
      }
      if (r.stage && stageMatches.includes(r.stage as Stage)) {
        return `Stage: ${STAGE_LABELS[r.stage as Stage]}`;
      }
      if (r.sale_type && saleTypeMatches.includes(r.sale_type as SaleType)) {
        return `Sale Type: ${SALE_TYPE_LABELS[r.sale_type as SaleType]}`;
      }
      // Fall back to case_number if present (legacy behavior).
      return r.case_number || null;
    }
    for (const r of leadsR.value.data as LeadRow[]) {
      leadCache.set(r.id, {
        lead_id: r.lead_id,
        address: r.address,
        city: r.city,
        state: r.state,
        zip: r.zip,
      });
      pushLead(r.id, leadCache.get(r.id)!, leadMatchHint(r));
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
      pushFromJoin(c, `${humanize(c.channel)}: ${c.value}`);
    }
  }
  // 4) Relatives — figure out which slot actually matched so the result
  // doesn't read as "relative: <name>" when the match was a phone/email
  // sitting on that relative record. e.g. searching an email shouldn't
  // surface as "relative: <name>" with no breadcrumb to the email field.
  if (relativesR.status === "fulfilled" && relativesR.value.data) {
    const qLower = sanitized.toLowerCase();
    type RelativeRow = {
      full_name: string;
      phone: string | null; phone_2: string | null; phone_3: string | null; phone_4: string | null; phone_5: string | null;
      email: string | null; email_2: string | null; email_3: string | null; email_4: string | null; email_5: string | null;
      street: string | null;
      city: string | null;
      lead_id: string;
      leads: unknown;
    };
    function relativeMatchHint(r: RelativeRow): string {
      const emails = [r.email, r.email_2, r.email_3, r.email_4, r.email_5];
      for (const e of emails) {
        if (e && e.toLowerCase().includes(qLower)) {
          return `${r.full_name} · Email: ${e}`;
        }
      }
      const phones = [r.phone, r.phone_2, r.phone_3, r.phone_4, r.phone_5];
      if (phoneDigits.length >= 4) {
        for (const p of phones) {
          if (p && p.replace(/\D/g, "").includes(phoneDigits)) {
            return `${r.full_name} · Phone: ${p}`;
          }
        }
      } else {
        for (const p of phones) {
          if (p && p.toLowerCase().includes(qLower)) {
            return `${r.full_name} · Phone: ${p}`;
          }
        }
      }
      if (r.street && r.street.toLowerCase().includes(qLower)) {
        return `${r.full_name} · Street: ${r.street}`;
      }
      if (r.city && r.city.toLowerCase().includes(qLower)) {
        return `${r.full_name} · City: ${r.city}`;
      }
      // Default: name matched.
      return `Relative: ${r.full_name}`;
    }
    for (const r of relativesR.value.data as RelativeRow[]) {
      pushFromJoin(r, relativeMatchHint(r));
    }
  }
  // 5) Lead parties — same field-aware hint pattern as relatives so an
  // email/phone/organization match doesn't show only the role + name.
  if (partiesR.status === "fulfilled" && partiesR.value.data) {
    const qLower = sanitized.toLowerCase();
    type PartyRow = {
      name: string;
      organization: string | null;
      email: string | null;
      phone: string | null;
      custom_role_label: string | null;
      lead_id: string;
      leads: unknown;
    };
    function partyMatchHint(p: PartyRow): string {
      const role = humanize(p.custom_role_label || "contact");
      if (p.email && p.email.toLowerCase().includes(qLower)) {
        return `${role}: ${p.name} · Email: ${p.email}`;
      }
      const phoneHit =
        (phoneDigits.length >= 4 && p.phone && p.phone.replace(/\D/g, "").includes(phoneDigits)) ||
        (p.phone && p.phone.toLowerCase().includes(qLower));
      if (phoneHit && p.phone) {
        return `${role}: ${p.name} · Phone: ${p.phone}`;
      }
      if (p.organization && p.organization.toLowerCase().includes(qLower)) {
        return `${role}: ${p.name} · ${p.organization}`;
      }
      // Default: name or role matched.
      return `${role}: ${p.name}`;
    }
    for (const p of partiesR.value.data as PartyRow[]) {
      pushFromJoin(p, partyMatchHint(p));
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

  // 9a) Discussion comments
  if (commentsR.status === "fulfilled" && commentsR.value.data) {
    for (const c of commentsR.value.data as Array<{ id: string; body: string; lead_id: string; leads: unknown }>) {
      const snippet = (c.body || "").trim().slice(0, 80);
      pushFromJoin(c, `comment: ${snippet}${(c.body?.length ?? 0) > 80 ? "…" : ""}`);
    }
  }

  // 9b) Activities (note-style entries via JSON payload)
  if (activitiesR.status === "fulfilled" && activitiesR.value.data) {
    for (const a of activitiesR.value.data as Array<{ activity_type: string; payload: Record<string, unknown> | null; lead_id: string; leads: unknown }>) {
      const p = a.payload || {};
      const text =
        (p.body as string | undefined) ||
        (p.text as string | undefined) ||
        (p.reason as string | undefined) ||
        (p.note as string | undefined) ||
        "";
      const snippet = text.trim().slice(0, 80);
      const label = humanize(a.activity_type);
      pushFromJoin(a, snippet ? `${label}: ${snippet}${text.length > 80 ? "…" : ""}` : label);
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
