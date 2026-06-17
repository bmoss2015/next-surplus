"use client";

import {
  IconArrowUpRight,
  IconChevronRight,
  IconMail,
  IconPhone,
  IconNote,
  IconFileText,
} from "@tabler/icons-react";
import type { DialerActivity, DialerLead } from "../_mock-data";

const ACTIVITY_ICON: Record<DialerActivity["type"], React.ComponentType<{ size?: number; stroke?: number }>> = {
  Call: IconPhone,
  Email: IconMail,
  Letter: IconFileText,
  Note: IconNote,
  Stage: IconChevronRight,
};

export function LeadDataPanel({
  lead,
  onOpenTimeline,
}: {
  lead: DialerLead;
  onOpenTimeline: () => void;
}) {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col overflow-y-auto bg-white">
      <Section title="Case Details">
        <dl className="space-y-2">
          {lead.caseDetails.map((d) => (
            <div key={d.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-[12px] text-gray-500">{d.label}</dt>
              <dd className="text-right text-[13px] font-medium text-ink">
                {d.value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Divider />

      <Section
        title="Latest Activity"
        trailing={
          <button
            type="button"
            onClick={onOpenTimeline}
            className="inline-flex items-center gap-0.5 text-[11.5px] font-medium text-petrol-500 hover:text-petrol-700"
          >
            View All
            <IconArrowUpRight size={12} stroke={2.25} />
          </button>
        }
      >
        <ul className="space-y-3">
          {lead.activities.slice(-3).reverse().map((a) => {
            const Icon = ACTIVITY_ICON[a.type] ?? IconNote;
            return (
              <li key={a.id} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                  <Icon size={13} stroke={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-medium text-ink">
                    {a.title}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-gray-500">
                    {a.at}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Divider />

      <Section title="Contact Tree">
        <ul className="space-y-2.5">
          {lead.contacts.map((c) => (
            <li
              key={c.id}
              className="flex items-start gap-2.5 rounded-md px-1.5 py-1 transition hover:bg-gray-50"
            >
              <div
                className={[
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  c.status === "active"
                    ? "bg-petrol-500"
                    : c.status === "done"
                      ? "bg-gray-400"
                      : "bg-gray-300",
                ].join(" ")}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-ink">
                  {c.name}
                </div>
                <div className="text-[11.5px] text-gray-500">
                  {c.relationship}
                </div>
                <div className="text-[11.5px] tabular-nums text-gray-500">
                  {c.phone}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
  trailing,
}: {
  title: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full" style={{ background: "rgba(15,23,41,0.08)" }} />;
}
