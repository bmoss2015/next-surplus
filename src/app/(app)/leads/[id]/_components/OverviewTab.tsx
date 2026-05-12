import Link from "next/link";
import {
  IconArrowRight,
  IconNote,
  IconSparkles,
  IconClock,
  IconFile,
  IconCircleDot,
} from "@tabler/icons-react";
import type { LeadDetailWithCounts } from "@/lib/leads/fetch-detail";
import { fetchOwnersWithContacts } from "@/lib/leads/fetch-detail";
import { fetchNotes, fetchDocuments } from "@/lib/leads/fetch-tab-data";
import { fetchRecentActivity } from "@/lib/leads/activities";
import {
  formatActivity,
  relativeTime,
  activityActorName,
  noteByline,
} from "@/lib/leads/activity-format";
import { createClient } from "@/lib/supabase/server";
import { OWNER_STATUS_LABELS, type OwnerStatus } from "@/lib/leads/types";
import { SurplusBreakdown } from "./Overview/SurplusBreakdown";
import { SectionSubheader } from "./SectionSubheader";
import { cn } from "@/lib/cn";

// Fix IIIII / MMMMM: Overview is a read-only deal snapshot — no hero section,
// no large duplicate of the metric-strip numbers. It opens straight into four
// equal-weight panel cards (Owner / Research | Notes / Documents), then the
// read-only Surplus Breakdown, then a full-width Recent Activity strip. Each
// card has 24px padding, a bold Proper Case header, its content, and a link
// arrow to the relevant tab. 24px gap between cards.

const ACTIVITY_ICONS = {
  create: IconSparkles,
  stage: IconArrowRight,
  note: IconNote,
  review: IconClock,
  doc: IconFile,
  default: IconCircleDot,
} as const;

const DOC_CATEGORY_LABELS: Record<string, string> = {
  agreement: "Recovery Agreement",
  id_copy: "ID Copy",
  deed: "Deed",
  court_filing: "Court Filing",
  settlement_statement: "Settlement Statement",
  other: "Other",
};

function formatPhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 10);
  if (digits.length !== 10) return raw;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatDocDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusPillClass(status: OwnerStatus): string {
  switch (status) {
    case "living":
      return "bg-success-bg text-success-strong";
    case "deceased":
      return "bg-danger-bg text-danger";
    case "incarcerated":
      return "bg-warn-bg text-warn-strong";
    default:
      return "bg-gray-150 text-gray-600";
  }
}

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-petrol-500 hover:text-petrol-700"
    >
      {children}
      <IconArrowRight size={13} stroke={2} />
    </Link>
  );
}

const CARD = "flex flex-col rounded-[12px] border border-gray-200 bg-surface p-6 shadow-card";
const EMPTY =
  "flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-[13px] text-gray-500";

export async function OverviewTab({ lead }: { lead: LeadDetailWithCounts }) {
  const leadId = lead.id;
  const sb = await createClient();
  const [{ owners, contacts }, notes, documents, activity, lrtRes] = await Promise.all([
    fetchOwnersWithContacts(leadId),
    fetchNotes(leadId),
    fetchDocuments(leadId),
    fetchRecentActivity(leadId, 5),
    sb.from("lead_research_templates").select("steps").eq("lead_id", leadId),
  ]);

  const lrt = (lrtRes.data ?? []) as Array<{ steps: unknown }>;
  const allSteps = lrt.flatMap((t) =>
    Array.isArray(t.steps) ? (t.steps as Array<{ done?: boolean }>) : []
  );
  const totalSteps = allSteps.length;
  const doneSteps = allSteps.filter((s) => s?.done).length;
  const stepLabel = lrt.length > 0 && totalSteps > 0 ? `${doneSteps} Of ${totalSteps} Steps Complete` : null;

  const primaryOwner = owners.find((o) => o.is_primary) ?? owners[0] ?? null;
  const phoneContacts = contacts.filter((c) => c.channel === "phone" && c.value.trim());
  const emailContacts = contacts.filter((c) => c.channel === "email" && c.value.trim());
  const primaryPhone = phoneContacts.find((c) => c.is_primary) ?? phoneContacts[0] ?? null;
  const primaryEmail = emailContacts.find((c) => c.is_primary) ?? emailContacts[0] ?? null;
  const hasAnyContacts = owners.length > 0 || contacts.length > 0;
  const findings = (lead.research_overall_findings ?? "").trim();
  const recentNotes = notes.slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Owner */}
        <div className={CARD}>
          <SectionSubheader>Owner</SectionSubheader>
          {!hasAnyContacts || !primaryOwner ? (
            <div className={EMPTY}>No Contacts Yet</div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-semibold text-ink">{primaryOwner.full_name}</span>
                <span className={cn("rounded px-2 py-[2px] text-[11px] font-medium", statusPillClass(primaryOwner.status))}>
                  {OWNER_STATUS_LABELS[primaryOwner.status]}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Primary Phone</dt>
                  <dd className="text-ink">{primaryPhone ? formatPhone(primaryPhone.value) : "Not Recorded"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Primary Email</dt>
                  <dd className="truncate text-ink">{primaryEmail ? primaryEmail.value : "Not Recorded"}</dd>
                </div>
              </dl>
            </div>
          )}
          <CardLink href={`/leads/${leadId}?tab=contacts`}>View All Contacts</CardLink>
        </div>

        {/* Research */}
        <div className={CARD}>
          <SectionSubheader>Research</SectionSubheader>
          {findings ? (
            <div className="flex-1">
              {stepLabel && <div className="mb-2 text-[12px] font-medium text-petrol-700">{stepLabel}</div>}
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{findings}</p>
            </div>
          ) : (
            <div className={EMPTY}>
              No Research Findings Yet
              {stepLabel && <div className="mt-1 text-[12px] text-petrol-700">{stepLabel}</div>}
            </div>
          )}
          <CardLink href={`/leads/${leadId}?tab=research`}>Go To Research</CardLink>
        </div>

        {/* Notes */}
        <div className={CARD}>
          <SectionSubheader>Notes</SectionSubheader>
          {recentNotes.length === 0 ? (
            <div className={EMPTY}>No Notes Yet</div>
          ) : (
            <div className="flex-1 space-y-3">
              {recentNotes.map((note) => (
                <div key={note.id} className="rounded-md border border-gray-200 bg-surface px-3 py-[10px]">
                  <div className="text-[10.5px] text-gray-500">{noteByline(note.created_at, note)}</div>
                  <div className="mt-1 whitespace-pre-wrap text-[13px] text-ink">{(note.payload?.body as string) ?? ""}</div>
                </div>
              ))}
            </div>
          )}
          <CardLink href={`/leads/${leadId}?tab=notes`}>Open Notes</CardLink>
        </div>

        {/* Documents */}
        <div className={CARD}>
          <SectionSubheader>Documents</SectionSubheader>
          {documents.length === 0 ? (
            <div className={EMPTY}>No Documents Yet</div>
          ) : (
            <ul className="flex-1 divide-y divide-gray-150">
              {documents.map((doc) => {
                const title = doc.custom_name?.trim() || DOC_CATEGORY_LABELS[doc.category] || doc.category;
                return (
                  <li key={doc.id} className="flex items-center gap-2 py-2 text-[13px] first:pt-0">
                    <IconFile size={14} stroke={1.75} className="shrink-0 text-gray-400" />
                    <span className="min-w-0 flex-1 truncate text-ink">{title}</span>
                    <span className="shrink-0 text-[11px] text-gray-400">{formatDocDate(doc.uploaded_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <CardLink href={`/leads/${leadId}?tab=documents`}>Open Documents</CardLink>
        </div>
      </div>

      {/* Surplus Breakdown — shows calculated + confirmed side by side and is a
          secondary entry point for the Confirm Surplus action (Fix VVVV2). */}
      <SurplusBreakdown
        leadId={leadId}
        closingBid={lead.closing_bid}
        outstandingDebt={lead.outstanding_debt}
        liens={lead.liens}
        recoveryFeePercent={lead.recovery_fee_percent}
        attorneyCost={lead.attorney_cost}
      />

      {/* Recent Activity — full width */}
      <div className={CARD}>
        <SectionSubheader>Recent Activity</SectionSubheader>
        {activity.length === 0 ? (
          <div className={EMPTY}>No Activity Yet</div>
        ) : (
          <div className="divide-y divide-gray-150">
            {activity.map((row) => {
              const { text, icon } = formatActivity(row, { leadSource: lead.lead_source });
              const Icon = ACTIVITY_ICONS[icon];
              return (
                <div key={row.id} className="flex gap-2 py-2 text-[12px] first:pt-0 last:pb-0">
                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-gray-150">
                    <Icon size={11} stroke={1.75} className="text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="leading-[1.4] text-ink">{text}</div>
                    <div className="mt-[2px] text-[10.5px] text-gray-500">
                      {activityActorName(row)} · {relativeTime(row.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <CardLink href={`/leads/${leadId}?tab=activity`}>View All Activity</CardLink>
      </div>
    </div>
  );
}
