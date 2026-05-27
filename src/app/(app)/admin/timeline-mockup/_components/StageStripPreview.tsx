"use client";

import { useState } from "react";
import {
  StageStripView,
  type StageStripStage,
} from "@/app/(app)/leads/[id]/_components/StageProgressStrip";

const LIST_STAGES: StageStripStage[] = [
  { key: "s1", label: "New Leads" },
  { key: "s2", label: "Qualifying" },
  { key: "s3", label: "Outreach" },
  { key: "s4", label: "In Conversation" },
  { key: "s5", label: "Contract" },
  { key: "s6", label: "With Attorney" },
  { key: "s7", label: "Claim Filed" },
  { key: "s8", label: "Won" },
];

const CENTERED_STAGES: StageStripStage[] = [
  { key: "c1", label: "New Lead" },
  { key: "c2", label: "Initial Research" },
  { key: "c3", label: "Skip Trace" },
  { key: "c4", label: "Cold Outreach" },
  { key: "c5", label: "Warm Follow Up" },
  { key: "c6", label: "Discovery Call" },
  { key: "c7", label: "Verbal Agreement" },
  { key: "c8", label: "Engagement Sent" },
  { key: "c9", label: "Engagement Signed" },
  { key: "c10", label: "Attorney Review" },
  { key: "c11", label: "Petition Filed" },
  { key: "c12", label: "Court Hearing" },
  { key: "c13", label: "Awaiting Disbursement" },
  { key: "c14", label: "Funded" },
];

const RAIL_STAGES: StageStripStage[] = [
  { key: "r1", label: "New Lead" },
  { key: "r2", label: "Public Records Check" },
  { key: "r3", label: "Surplus Confirmed" },
  { key: "r4", label: "Owner Identification" },
  { key: "r5", label: "Address Verification" },
  { key: "r6", label: "Phone Verification" },
  { key: "r7", label: "Relative Research" },
  { key: "r8", label: "Cold Outreach" },
  { key: "r9", label: "Warm Follow Up" },
  { key: "r10", label: "Discovery Call" },
  { key: "r11", label: "Verbal Agreement" },
  { key: "r12", label: "Engagement Sent" },
  { key: "r13", label: "Engagement Signed" },
  { key: "r14", label: "Bank Verification" },
  { key: "r15", label: "Attorney Briefed" },
  { key: "r16", label: "Petition Drafted" },
  { key: "r17", label: "Petition Filed" },
  { key: "r18", label: "Hearing Scheduled" },
  { key: "r19", label: "Court Approved" },
  { key: "r20", label: "Funded" },
];

export function StageStripPreview() {
  const [listIdx, setListIdx] = useState(2);
  const [centeredIdx, setCenteredIdx] = useState(7);
  const [railIdx, setRailIdx] = useState(11);

  return (
    <div className="space-y-10">
      <Section
        title="Mode 1 — List (≤8 Stages)"
        blurb="Today's Equal-Width Step Layout. Used When The Pipeline Has Eight Or Fewer Stages."
      >
        <PreviewCard>
          <StageStripView
            stages={LIST_STAGES}
            currentIndex={listIdx}
            onJump={(s) =>
              setListIdx(LIST_STAGES.findIndex((x) => x.key === s.key))
            }
          />
          <CurrentLine label={LIST_STAGES[listIdx]?.label} />
        </PreviewCard>
      </Section>

      <Section
        title="Mode 2 — Centered (9–15 Stages)"
        blurb="Horizontally Scrollable Strip, Auto-Centered On The Current Stage So It Stays In View Even When Steps Extend Off Screen."
      >
        <PreviewCard>
          <StageStripView
            stages={CENTERED_STAGES}
            currentIndex={centeredIdx}
            onJump={(s) =>
              setCenteredIdx(
                CENTERED_STAGES.findIndex((x) => x.key === s.key)
              )
            }
          />
          <CurrentLine label={CENTERED_STAGES[centeredIdx]?.label} />
        </PreviewCard>
      </Section>

      <Section
        title="Mode 3 — Headline + Rail (16+ Stages)"
        blurb="Current Stage Surfaces As A Headline With Prev / Next Shortcuts. Other Stages Collapse Into A Compact Click-To-Jump Dot Rail."
      >
        <PreviewCard>
          <StageStripView
            stages={RAIL_STAGES}
            currentIndex={railIdx}
            onJump={(s) =>
              setRailIdx(RAIL_STAGES.findIndex((x) => x.key === s.key))
            }
          />
          <CurrentLine label={RAIL_STAGES[railIdx]?.label} />
        </PreviewCard>
      </Section>
    </div>
  );
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="mt-[2px] text-[11.5px] text-gray-500">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

function PreviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-surface p-5 shadow-card">
      {children}
    </div>
  );
}

function CurrentLine({ label }: { label?: string }) {
  return (
    <div className="mt-2 text-[11px] text-gray-500">
      Click Any Step To Move The Mock Lead There. Current:{" "}
      <span className="font-medium text-ink">{label ?? "—"}</span>
    </div>
  );
}
