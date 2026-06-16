import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";

export default async function V9Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <TopRibbon leadId={lead.leadId} />

      <div className="mx-auto max-w-[860px] px-12 py-12">
        <DossierHeader lead={lead} />
        <TLDR lead={lead} />
        <KeyFacts lead={lead} />
        <OpenQuestions />
        <Script />
        <Risks />
        <People lead={lead} />
        <CallStrip />
      </div>
    </div>
  );
}

function TopRibbon({ leadId }: { leadId: string }) {
  return (
    <div className="border-b border-[#d8d2c1] bg-[#f0ece1]">
      <div className="mx-auto flex max-w-[860px] items-center justify-between px-12 py-3 text-[11px]">
        <Link
          href="/share/dialer-mockup"
          className="font-medium text-[#5b5240] hover:text-[#2a2516]"
        >
          ← Back to mockups
        </Link>
        <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.5px] text-[#5b5240]">
          <span>Mission File</span>
          <span>·</span>
          <span>{leadId}</span>
          <span>·</span>
          <span>Prepared June 15, 2026 04:42 ET</span>
        </div>
      </div>
    </div>
  );
}

function DossierHeader({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <header className="border-b-2 border-[#2a2516] pb-7">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.6px] text-[#9b8e6b]">
        Mission Briefing · Lead 3 of 10
      </div>
      <h1
        className="m-0 mt-3 text-[44px] font-bold leading-[1.05] tracking-[-0.022em] text-[#2a2516]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        Reach the {lead.ownerName} estate before its heirs reach another firm.
      </h1>
      <p
        className="mt-3 max-w-[58ch] text-[14.5px] leading-[1.65] text-[#5b5240]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Cuyahoga County, OH. {lead.saleProcess} held{" "}
        {lead.saleDate}. Estimated surplus{" "}
        <strong className="text-[#2a2516]">{fmtMoney(lead.estimatedSurplus)}</strong>
        . Probate has been filed and two heirs are reachable.
      </p>
    </header>
  );
}

function TLDR({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <Section label="TL;DR" number="01">
      <p
        className="m-0 text-[16px] leading-[1.7] text-[#2a2516]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Heir <strong>Cornelius J. Hayes Jr.</strong> is the warm contact. He
        confirmed the surplus is real, asked us to wait until he speaks with his
        sister <strong>Yvette</strong>, and committed to{" "}
        <strong>a callback Tuesday morning June 17, 2026</strong>. The estate
        carries an estimated{" "}
        <strong>{fmtMoney(lead.estimatedNet)}</strong> in net fee to the firm at
        a {lead.recoveryFeePercent}% rate.
      </p>
    </Section>
  );
}

function KeyFacts({ lead }: { lead: typeof ACTIVE_LEAD }) {
  const rows = [
    { label: "Decedent", value: "Cornelius J. Hayes Sr." },
    { label: "Property", value: `${lead.propertyAddress}, ${lead.city}, ${lead.state}` },
    { label: "County", value: lead.county },
    { label: "Sale", value: `${lead.saleProcess}, held ${lead.saleDate}` },
    { label: "Estimated Surplus", value: fmtMoney(lead.estimatedSurplus) },
    { label: "Recovery Fee", value: `${lead.recoveryFeePercent}%` },
    { label: "Estimated Net To Firm", value: fmtMoney(lead.estimatedNet) },
    { label: "Probate Status", value: "Filed March 2026, case 2026-PR-0488" },
    { label: "Days Since Last Contact", value: `${lead.daysSinceContact}` },
  ];
  return (
    <Section label="Key Facts" number="02">
      <dl className="m-0 grid grid-cols-[200px_minmax(0,1fr)] gap-y-2">
        {rows.map((r) => (
          <RowFact key={r.label} {...r} />
        ))}
      </dl>
    </Section>
  );
}

function RowFact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt
        className="border-b border-dotted border-[#d8d2c1] py-1.5 text-[12.5px] uppercase tracking-[0.4px] text-[#9b8e6b]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {label}
      </dt>
      <dd
        className="m-0 border-b border-dotted border-[#d8d2c1] py-1.5 text-[14px] text-[#2a2516]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {value}
      </dd>
    </>
  );
}

function OpenQuestions() {
  const qs = [
    "Has Yvette and Cornelius Jr. agreed on which heir signs the engagement letter?",
    "Is there any contested claim on the estate? Probate filing notes one creditor.",
    "Confirm Karen Hayes is not a beneficiary (she was marked wrong number).",
  ];
  return (
    <Section label="Open Questions" number="03">
      <ol className="m-0 list-decimal space-y-2 pl-6 text-[14.5px] leading-relaxed text-[#2a2516]" style={{ fontFamily: "Georgia, serif" }}>
        {qs.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
    </Section>
  );
}

function Script() {
  return (
    <Section label="Suggested Opening" number="04">
      <blockquote
        className="border-l-2 border-[#2a2516] pl-5 text-[14.5px] leading-[1.7] text-[#2a2516]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        &ldquo;Cornelius, it&apos;s Bree from Moss Equity. Last week you mentioned waiting
        until you spoke with Yvette. I wanted to follow up the way we agreed and
        see if there&apos;s a window today or tomorrow that would work for all three
        of us.&rdquo;
      </blockquote>
      <div
        className="mt-2 text-[12px] text-[#9b8e6b]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Three-sentence open. Anchors on his commitment, includes the sister,
        leaves the time choice with him.
      </div>
    </Section>
  );
}

function Risks() {
  const risks = [
    {
      level: "Medium",
      label: "Family alignment",
      detail: "Yvette has flexible work, Cornelius Jr. has a tight schedule. Synchronizing both could cost a week.",
    },
    {
      level: "Low",
      label: "Competing firm",
      detail: "No external solicitation on the lead's mail history. Probate filing is recent enough that other firms may not have surfaced it yet.",
    },
  ];
  return (
    <Section label="Risk Assessment" number="05">
      <div className="space-y-3">
        {risks.map((r) => (
          <div
            key={r.label}
            className="border border-[#d8d2c1] bg-[#fbf9f3] px-4 py-3"
          >
            <div className="flex items-baseline justify-between">
              <span
                className="font-mono text-[10.5px] uppercase tracking-[0.5px] text-[#9b8e6b]"
              >
                {r.label}
              </span>
              <span
                className={
                  r.level === "Medium"
                    ? "rounded-sm border border-[#2a2516] bg-[#fbf9f3] px-1.5 py-[1px] font-mono text-[10px] uppercase tracking-[0.4px] text-[#2a2516]"
                    : "rounded-sm border border-[#9b8e6b] bg-[#fbf9f3] px-1.5 py-[1px] font-mono text-[10px] uppercase tracking-[0.4px] text-[#9b8e6b]"
                }
              >
                {r.level}
              </span>
            </div>
            <p
              className="m-0 mt-1.5 text-[13.5px] leading-relaxed text-[#2a2516]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {r.detail}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function People({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <Section label="People In Play" number="06">
      <div className="space-y-3">
        {lead.contacts.map((c, i) => (
          <div
            key={c.id}
            className="grid grid-cols-[160px_minmax(0,1fr)_140px] items-baseline gap-4 border-b border-[#d8d2c1] py-2.5"
          >
            <div
              className="text-[13px] font-semibold text-[#2a2516]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {c.name}
            </div>
            <div
              className="text-[12.5px] text-[#5b5240]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {c.role}.{" "}
              {i === 0
                ? "Warm. Wants to confirm with sister."
                : i === 1
                ? "Asked for the 12:30 to 1:30 PM ET window."
                : i === 2
                ? "Marked wrong number. Cousin, not in contact."
                : "Number out of service."}
            </div>
            <div className="text-right font-mono text-[12px] text-[#2a2516]">
              {c.numbers[0].formatted}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function CallStrip() {
  return (
    <div className="sticky bottom-0 z-10 mt-12 -mx-12 border-t-2 border-[#2a2516] bg-[#fbf9f3] px-12 py-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.5px] text-[#9b8e6b]">
            On Call · Connected
          </div>
          <div
            className="text-[15px] font-semibold text-[#2a2516]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Cornelius J. Hayes Jr.
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[18px] font-medium tabular-nums text-[#2a2516]">
            02:14
          </span>
          <button className="rounded-sm border border-[#2a2516] bg-[#fbf9f3] px-3 py-1.5 text-[11.5px] text-[#2a2516] hover:bg-[#f0ece1]">
            Mute
          </button>
          <button className="rounded-sm border border-[#2a2516] bg-[#fbf9f3] px-3 py-1.5 text-[11.5px] text-[#2a2516] hover:bg-[#f0ece1]">
            Hold
          </button>
          <button className="rounded-sm bg-[#2a2516] px-3.5 py-1.5 text-[11.5px] font-medium text-[#f6f4ee]">
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  number,
  children,
}: {
  label: string;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.5px] text-[#9b8e6b]">
          {number}
        </span>
        <h2
          className="m-0 text-[12px] font-bold uppercase tracking-[0.6px] text-[#2a2516]"
        >
          {label}
        </h2>
        <span className="h-px flex-1 bg-[#d8d2c1]" />
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
