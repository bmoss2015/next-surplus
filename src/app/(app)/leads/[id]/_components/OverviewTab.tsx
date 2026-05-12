import Link from "next/link";
import {
  IconArrowRight,
  IconNote,
  IconSparkles,
  IconClock,
  IconFile,
  IconCircleDot,
  IconCircleCheck,
  IconCircleDashed,
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
import { OWNER_STATUS_LABELS, type OwnerStatus } from "@/lib/leads/types";
import { SurplusBreakdown } from "./Overview/SurplusBreakdown";
import { SectionSubheader } from "./SectionSubheader";
import { cn } from "@/lib/cn";

// Fix TTTT2: Overview is a read-only deal snapshot — two columns plus a
// full-width Recent Activity strip. Every card links to the tab where the data
// is actually edited; nothing here is editable except the Surplus Breakdown
// (which keeps its own inline-edit behavior).

const ACTIVITY_ICONS = {
  create: IconSparkles,
  stage: IconArrowRight,
  note: IconNote,
  review: IconClock,
  doc: IconFile,
  default: IconCircleDot,
} as const;

// User-facing labels for the document_category enum values that make up the
// per-lead checklist (mirrors the Documents tab; "Other" is excluded).
const DOC_CHECKLIST: Array<{ value: string; label: string }> = [
  { value: "agreement", label: "Recovery Agreement" },
  { value: "id_copy", label: "ID Copy" },
  { value: "deed", label: "Deed" },
  { value: "court_filing", label: "Court Filing" },
  { value: "settlement_statement", label: "Settlement Statement" },
];

function formatPhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 10);
  if (digits.length !== 10) return raw;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
      className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-petrol-500 hover:text-petrol-700"
    >
      {children}
      <IconArrowRight size={12} stroke={2} />
    </Link>
  );
}

const CARD = "rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card";

export async function OverviewTab({ lead }: { lead: LeadDetailWithCounts }) {
  const leadId = lead.id;
  const [{ owners, contacts }, notes, documents, activity] = await Promise.all([
    fetchOwnersWithContacts(leadId),
    fetchNotes(leadId),
    fetchDocuments(leadId),
    fetchRecentActivity(leadId, 5),
  ]);

  const primaryOwner = owners.find((o) => o.is_primary) ?? owners[0] ?? null;
  const phoneContacts = contacts.filter((c) => c.channel === "phone" && c.value.trim());
  const emailContacts = contacts.filter((c) => c.channel === "email" && c.value.trim());
  const primaryPhone =
    phoneContacts.find((c) => c.is_primary) ?? phoneContacts[0] ?? null;
  const primaryEmail =
    emailContacts.find((c) => c.is_primary) ?? emailContacts[0] ?? null;
  const hasAnyContacts = owners.length > 0 || contacts.length > 0;

  const findings = (lead.research_overall_findings ?? "").trim();
  const recentNotes = notes.slice(0, 2);
  const docCategoriesPresent = new Set(documents.map((d) => d.category));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Owner Summary */}
          <div className={CARD}>
            <SectionSubheader>Owner Summary</SectionSubheader>
            {!hasAnyContacts || !primaryOwner ? (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                <div className="text-[12.5px] text-gray-500">No Contacts Yet</div>
                <CardLink href={`/leads/${leadId}?tab=contacts`}>Go To Contacts</CardLink>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-ink">
                    {primaryOwner.full_name}
                  </span>
                  <span
                    className={cn(
                      "rounded px-2 py-[2px] text-[10.5px] font-medium",
                      statusPillClass(primaryOwner.status)
                    )}
                  >
                    {OWNER_STATUS_LABELS[primaryOwner.status]}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Primary Phone</dt>
                    <dd className="text-ink">
                      {primaryPhone ? formatPhone(primaryPhone.value) : "Not Recorded"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Primary Email</dt>
                    <dd className="truncate text-ink">
                      {primaryEmail ? primaryEmail.value : "Not Recorded"}
                    </dd>
                  </div>
                </dl>
                <CardLink href={`/leads/${leadId}?tab=contacts`}>View All Contacts</CardLink>
              </>
            )}
          </div>

          {/* Research Summary */}
          <div className={CARD}>
            <SectionSubheader>Research Summary</SectionSubheader>
            {findings ? (
              <>
                <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink">
                  {findings}
                </p>
                <CardLink href={`/leads/${leadId}?tab=research`}>Open Research</CardLink>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                <div className="text-[12.5px] text-gray-500">No Research Findings Yet</div>
                <CardLink href={`/leads/${leadId}?tab=research`}>Go To Research</CardLink>
              </div>
            )}
          </div>

          {/* Recent Notes */}
          <div className={CARD}>
            <SectionSubheader>Recent Notes</SectionSubheader>
            {recentNotes.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12.5px] text-gray-500">
                No Notes Yet
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md border border-gray-200 bg-surface px-3 py-[10px]"
                  >
                    <div className="text-[10.5px] text-gray-500">
                      {noteByline(note.created_at, note)}
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-[12.5px] text-ink">
                      {(note.payload?.body as string) ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <CardLink href={`/leads/${leadId}?tab=notes`}>Open Notes</CardLink>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Surplus Breakdown — unchanged, moved here. */}
          <SurplusBreakdown
            leadId={lead.id}
            closingBid={lead.closing_bid}
            outstandingDebt={lead.outstanding_debt}
            courtCosts={lead.court_costs}
            liens={lead.liens}
            recoveryFeePercent={lead.recovery_fee_percent}
            attorneyCost={lead.attorney_cost}
          />

          {/* Documents Checklist */}
          <div className={CARD}>
            <SectionSubheader>Documents Checklist</SectionSubheader>
            <ul className="space-y-1.5">
              {DOC_CHECKLIST.map((cat) => {
                const received = docCategoriesPresent.has(cat.value);
                return (
                  <li key={cat.value} className="flex items-center gap-2 text-[12.5px]">
                    {received ? (
                      <IconCircleCheck size={15} stroke={2} className="shrink-0 text-success" />
                    ) : (
                      <IconCircleDashed size={15} stroke={2} className="shrink-0 text-gray-300" />
                    )}
                    <span className={received ? "text-ink" : "text-gray-500"}>
                      {cat.label}
                    </span>
                    <span
                      className={cn(
                        "ml-auto text-[10.5px] font-medium",
                        received ? "text-success" : "text-gray-400"
                      )}
                    >
                      {received ? "Received" : "Missing"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <CardLink href={`/leads/${leadId}?tab=documents`}>Open Documents</CardLink>
          </div>
        </div>
      </div>

      {/* FULL WIDTH BOTTOM — Recent Activity */}
      <div className={CARD}>
        <SectionSubheader>Recent Activity</SectionSubheader>
        {activity.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-[12.5px] text-gray-500">
            No Activity Yet
          </div>
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
        <CardLink href={`/leads/${leadId}?tab=activity`}>Open Full Activity Log</CardLink>
      </div>
    </div>
  );
}
