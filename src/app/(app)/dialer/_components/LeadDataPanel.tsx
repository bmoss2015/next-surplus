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
        <ul className="divide-y divide-[rgba(15,23,41,0.06)]">
          {lead.contacts.map((c, i) => (
            <li
              key={c.id}
              className={[
                "flex items-start gap-3 px-1.5 transition hover:bg-gray-50",
                i === 0 ? "pb-3" : "py-3",
              ].join(" ")}
            >
              <ContactAvatar name={c.name} active={c.status === "active"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[13px] font-semibold text-ink">
                    {c.name}
                  </div>
                  {c.status === "active" && (
                    <span className="shrink-0 rounded-sm bg-petrol-500/10 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.10em] text-petrol-500">
                      On Call
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">
                    {c.relationship}
                  </span>
                </div>
                <div className="mt-1 text-[11.5px] tabular-nums text-gray-500">
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

function ContactAvatar({ name, active }: { name: string; active: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={[
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        active
          ? "bg-petrol-500 text-white"
          : "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
      ].join(" ")}
    >
      {initials}
    </div>
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
      <div className="mb-3.5 flex items-center justify-between border-b border-[rgba(15,23,41,0.06)] pb-2">
        <h2 className="text-[13.5px] font-bold tracking-tight text-ink">
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
