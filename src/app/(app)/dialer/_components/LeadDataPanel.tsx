"use client";

import {
  IconArrowUpRight,
  IconChevronRight,
  IconMail,
  IconPhone,
  IconNote,
  IconFileText,
} from "@tabler/icons-react";
import type {
  CallOutcome,
  DialerActivity,
  DialerLead,
} from "../_mock-data";

const ACTIVITY_ICON: Record<DialerActivity["type"], React.ComponentType<{ size?: number; stroke?: number }>> = {
  Call: IconPhone,
  Email: IconMail,
  Letter: IconFileText,
  Note: IconNote,
  Stage: IconChevronRight,
};

export function LeadDataPanel({
  lead,
  activeContactIndex,
  contactOutcomes,
  onOpenTimeline,
}: {
  lead: DialerLead;
  activeContactIndex: number;
  contactOutcomes: Record<string, CallOutcome>;
  onOpenTimeline: () => void;
}) {
  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto bg-white">
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
          {lead.contacts.map((c, i) => {
            const outcome = contactOutcomes[`${lead.id}:${c.id}`];
            const isActive = i === activeContactIndex && !outcome;
            const called = Boolean(outcome);
            return (
              <li
                key={c.id}
                className={[
                  "flex items-start gap-3 px-1.5 transition hover:bg-gray-50",
                  i === 0 ? "pb-3" : "py-3",
                ].join(" ")}
              >
                <ContactAvatar name={c.name} active={isActive} called={called} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={[
                        "truncate text-[13px] font-semibold",
                        called ? "text-gray-500 line-through" : "text-ink",
                      ].join(" ")}
                    >
                      {c.name}
                    </div>
                    <ContactOutcomePill
                      outcome={outcome}
                      active={isActive}
                      pending={!called && !isActive}
                    />
                  </div>
                  <div className="mt-1">
                    <span
                      className={[
                        "inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600",
                        called ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      {c.relationship}
                    </span>
                  </div>
                  <div
                    className={[
                      "mt-1 text-[11.5px] tabular-nums text-gray-500",
                      called ? "line-through opacity-70" : "",
                    ].join(" ")}
                  >
                    {c.phone}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>
    </aside>
  );
}

function ContactOutcomePill({
  outcome,
  active,
  pending,
}: {
  outcome: CallOutcome | undefined;
  active: boolean;
  pending: boolean;
}) {
  let label: string;
  let dot: string;
  let text: string;
  if (active) {
    label = "On Call";
    dot = "bg-petrol-500";
    text = "text-petrol-500";
  } else if (pending) {
    label = "Remaining";
    dot = "bg-gray-300";
    text = "text-gray-500";
  } else {
    label = outcome ?? "Called";
    dot = "bg-gray-400";
    text = "text-gray-500";
  }
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1 rounded-sm border border-gray-200 bg-white px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.10em]",
        text,
      ].join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", dot].join(" ")} />
      {label}
    </span>
  );
}

function ContactAvatar({
  name,
  active,
  called,
}: {
  name: string;
  active: boolean;
  called: boolean;
}) {
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
          : called
            ? "bg-gray-100 text-gray-400 line-through ring-1 ring-gray-200"
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
