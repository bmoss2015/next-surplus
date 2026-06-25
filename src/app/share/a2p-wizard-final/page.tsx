"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconShieldCheck,
  IconArrowRight,
  IconEye,
  IconX,
  IconExternalLink,
  IconClock,
  IconMail,
} from "@tabler/icons-react";

type Step = 1 | 2 | 3 | 4;

type Brand = {
  legalName: string;
  ein: string;
  vertical: string;
  website: string;
  repName: string;
  repEmail: string;
  repPhone: string;
  street: string;
  city: string;
  state: string;
  postal: string;
};

type Campaign = {
  useCase: string;
  volume: "LOW" | "MEDIUM" | "HIGH";
  messages: string[];
};

const DEFAULT_MESSAGES = [
  "Hi {first_name}, this is Sarah with Workflow Minds. Public records show you may be owed funds from a recent foreclosure sale. Reply Y for details, STOP to opt out.",
  "Following up on the surplus funds from your property sale. The claim window is open through August 15. Reply with a good time to talk.",
  "Quick reminder, a signed retainer is still needed to file the claim before the surplus funds are turned over to the state. Text or call when convenient.",
];

const ALT_MESSAGES = [
  "Hi {first_name}, the documents are filed with the court. You'll be texted again when a hearing date is set. Reply STOP to opt out.",
  "Hi {first_name}, a check is ready. Reply with the current mailing address and it'll go out today.",
  "Following up on the claim package mailed last week. Please confirm receipt or reply with any questions.",
];

export default function A2pWizardFinal() {
  const [step, setStep] = useState<Step>(1);
  const [preview, setPreview] = useState(false);
  const [useCaseOpen, setUseCaseOpen] = useState(false);

  const [brand, setBrand] = useState<Brand>({
    legalName: "Workflow Minds LLC",
    ein: "",
    vertical: "Financial Services",
    website: "https://nextsurplus.com",
    repName: "",
    repEmail: "bree@nextsurplus.com",
    repPhone: "+1 (432) 400-5579",
    street: "1234 Surplus Way",
    city: "Austin",
    state: "TX",
    postal: "78701",
  });

  const [campaign, setCampaign] = useState<Campaign>({
    useCase: "Customer Care",
    volume: "LOW",
    messages: DEFAULT_MESSAGES,
  });

  function next() {
    setStep((s) => Math.min(4, s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setStep((s) => Math.max(1, s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Hero step={step} />

      {step !== 4 && (
        <div className="mx-auto max-w-[1080px] px-10 py-9">
          <div className="grid grid-cols-[1fr_280px] gap-7">
            <div>
              {step === 1 && <Step1Brand brand={brand} setBrand={setBrand} />}
              {step === 2 && (
                <Step2Campaign
                  campaign={campaign}
                  setCampaign={setCampaign}
                  useCaseOpen={useCaseOpen}
                  setUseCaseOpen={setUseCaseOpen}
                />
              )}
              {step === 3 && <Step3Review brand={brand} campaign={campaign} />}

              <NavRow
                step={step}
                onBack={back}
                onNext={next}
                onPreview={() => setPreview(true)}
              />
            </div>

            <aside>{stepHelpFor(step)}</aside>
          </div>
        </div>
      )}

      {step === 4 && <Step4Success />}

      {preview && (
        <PreviewDrawer brand={brand} campaign={campaign} onClose={() => setPreview(false)} />
      )}
    </>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────
function Hero({ step }: { step: Step }) {
  if (step === 4) {
    return (
      <div
        className="border-b border-[#04261c]"
        style={{
          background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)",
        }}
      >
        <div className="mx-auto max-w-[1080px] px-10 py-14 text-center">
          <span
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white"
            style={{ boxShadow: "0 0 0 8px rgba(255,255,255,0.08)" }}
          >
            <IconCheck size={30} stroke={2.5} className="text-[#0d4b3a]" />
          </span>
          <h1 className="mt-5 text-[36px] font-semibold leading-[1.1] tracking-[-0.022em] text-white">
            Registration Submitted
          </h1>
          <p className="mx-auto mt-3 max-w-[58ch] text-[14.5px] leading-[1.55] text-white/75">
            The Campaign Registry received the brand and campaign. An SMS and email notification will fire the moment carriers approve.
          </p>
        </div>
      </div>
    );
  }

  const titles = {
    1: "Verify The Brand",
    2: "Build The Campaign",
    3: "Review And Submit",
  } as const;

  const subs = {
    1: "Carriers verify the legal entity behind every SMS campaign before approving it. This is the entity that gets registered.",
    2: "Carriers need to know how SMS will be used and need three real example messages. Both shape the approval decision.",
    3: "Final look before submission. Brand verification runs 1 to 2 business days, then carriers review the campaign for 1 to 3 weeks.",
  } as const;

  return (
    <div
      className="border-b border-[#04261c]"
      style={{
        background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)",
      }}
    >
      <div className="mx-auto max-w-[1080px] px-10 py-12">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          <IconShieldCheck size={13} stroke={2.25} />
          A2P 10DLC Registration
        </div>
        <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.024em] text-white">
          {titles[step]}
        </h1>
        <p className="mt-3 max-w-[60ch] text-[14.5px] leading-[1.55] text-white/75">
          {subs[step]}
        </p>

        <div className="mt-8 flex items-center gap-4">
          <HeroStep n={1} label="Brand" state={step === 1 ? "active" : "done"} />
          <span className={["h-px w-14", step >= 2 ? "bg-white/50" : "bg-white/20"].join(" ")} />
          <HeroStep n={2} label="Campaign" state={step === 2 ? "active" : step > 2 ? "done" : "todo"} />
          <span className={["h-px w-14", step >= 3 ? "bg-white/50" : "bg-white/20"].join(" ")} />
          <HeroStep n={3} label="Review" state={step === 3 ? "active" : "todo"} />
        </div>
      </div>
    </div>
  );
}

function HeroStep({ n, label, state }: { n: number; label: string; state: "done" | "active" | "todo" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={[
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold",
          state === "done" ? "bg-white text-[#0d4b3a]" : state === "active" ? "bg-white text-[#0d4b3a]" : "bg-white/10 text-white/70",
        ].join(" ")}
        style={{ boxShadow: state === "active" ? "0 0 0 4px rgba(255,255,255,0.15)" : undefined }}
      >
        {state === "done" ? <IconCheck size={13} stroke={3} /> : n}
      </span>
      <span className={["text-[12.5px] font-medium", state === "todo" ? "text-white/55" : "text-white"].join(" ")}>
        {label}
      </span>
    </div>
  );
}

// ─── Step 1: Brand ──────────────────────────────────────────────────────
function Step1Brand({ brand, setBrand }: { brand: Brand; setBrand: (b: Brand) => void }) {
  const u = <K extends keyof Brand>(k: K, v: Brand[K]) => setBrand({ ...brand, [k]: v });

  return (
    <div className="space-y-5">
      <Card title="Company">
        <FieldGrid>
          <Field label="Legal Name" value={brand.legalName} onChange={(v) => u("legalName", v)} preFilled />
          <Field label="EIN" value={brand.ein} onChange={(v) => u("ein", v)} placeholder="12-3456789" required />
          <Field label="Vertical" value={brand.vertical} onChange={(v) => u("vertical", v)} preFilled />
          <Field label="Website" value={brand.website} onChange={(v) => u("website", v)} preFilled />
        </FieldGrid>
      </Card>

      <Card title="Authorized Representative">
        <FieldGrid>
          <Field label="Full Name" value={brand.repName} onChange={(v) => u("repName", v)} placeholder="Jane Operator" required />
          <Field label="Email" value={brand.repEmail} onChange={(v) => u("repEmail", v)} preFilled />
          <Field label="Phone" value={brand.repPhone} onChange={(v) => u("repPhone", v)} preFilled wide />
        </FieldGrid>
      </Card>

      <Card title="Company Address">
        <FieldGrid>
          <Field label="Street" value={brand.street} onChange={(v) => u("street", v)} preFilled wide />
          <Field label="City" value={brand.city} onChange={(v) => u("city", v)} preFilled />
          <Field label="State" value={brand.state} onChange={(v) => u("state", v)} preFilled />
          <Field label="Postal Code" value={brand.postal} onChange={(v) => u("postal", v)} preFilled wide />
        </FieldGrid>
      </Card>
    </div>
  );
}

// ─── Step 2: Campaign ───────────────────────────────────────────────────
function Step2Campaign({
  campaign,
  setCampaign,
  useCaseOpen,
  setUseCaseOpen,
}: {
  campaign: Campaign;
  setCampaign: (c: Campaign) => void;
  useCaseOpen: boolean;
  setUseCaseOpen: (b: boolean) => void;
}) {
  const otherUseCases = ["Marketing", "Account Notification", "Higher Education", "Polling And Voting", "Public Service"];

  function swapMessage(i: number) {
    const alt = ALT_MESSAGES[i % ALT_MESSAGES.length];
    setCampaign({ ...campaign, messages: campaign.messages.map((x, j) => (j === i ? alt : x)) });
  }

  return (
    <div className="space-y-5">
      <Card title="Use Case">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-[14.5px] font-semibold tracking-[-0.012em] text-[#0a0d14]">
                {campaign.useCase}
              </div>
              <AutoTag />
            </div>
            <p className="mt-1 max-w-[44ch] text-[12.5px] leading-[1.55] text-[#5b606a]">
              Best fit for surplus recovery, where outreach goes to identified parties of interest, not cold prospects.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUseCaseOpen(!useCaseOpen)}
            className="cursor-pointer text-[12px] font-medium text-[#0d4b3a] hover:text-[#13644e]"
          >
            Change Use Case
          </button>
        </div>

        {useCaseOpen && (
          <div className="mt-4 rounded-[10px] border border-[#ebedf0] bg-white p-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Alternative Use Cases
            </div>
            <p className="mt-1.5 text-[11.5px] text-[#5b606a]">
              These rarely fit surplus recovery. Carriers may deny if mismatched.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherUseCases.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setCampaign({ ...campaign, useCase: u });
                    setUseCaseOpen(false);
                  }}
                  className="cursor-pointer rounded-[7px] border border-[#ebedf0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0a0d14] hover:border-[#0d4b3a]"
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card title="Monthly Volume">
        <div className="grid grid-cols-3 gap-2.5">
          {(["LOW", "MEDIUM", "HIGH"] as const).map((v) => {
            const selected = campaign.volume === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setCampaign({ ...campaign, volume: v })}
                className={[
                  "cursor-pointer rounded-[10px] border px-4 py-3 text-left transition",
                  selected
                    ? "border-[#0d4b3a] bg-[#0d4b3a] text-white"
                    : "border-[#ebedf0] bg-white text-[#0a0d14] hover:border-[#9298a3]",
                ].join(" ")}
                style={selected ? { boxShadow: "0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" } : undefined}
              >
                <div className={["text-[13px] font-semibold", selected ? "text-white" : "text-[#0a0d14]"].join(" ")}>
                  {v === "LOW" ? "Low" : v === "MEDIUM" ? "Medium" : "High"}
                </div>
                <div className={["mt-0.5 text-[11.5px]", selected ? "text-white/75" : "text-[#5b606a]"].join(" ")}>
                  {v === "LOW" ? "Up To 3,000 / Mo" : v === "MEDIUM" ? "Up To 30,000 / Mo" : "Above 30,000 / Mo"}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Sample Messages">
        <div className="mb-3 text-[12.5px] leading-[1.55] text-[#5b606a]">
          Three pre-filled defaults that match Customer Care for surplus recovery. Edit inline. Click Swap Template to load an alternative. Tokens like {"{first_name}"} fill in at send time.
        </div>
        <div className="space-y-3">
          {campaign.messages.map((m, i) => (
            <div key={i} className="rounded-[10px] border border-[#ebedf0] bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                    Template {i + 1}
                  </span>
                  <AutoTag />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => swapMessage(i)}
                    className="cursor-pointer text-[11px] font-medium text-[#0d4b3a] hover:text-[#13644e]"
                  >
                    Swap Template
                  </button>
                  <span className="text-[10.5px] text-[#9298a3]">{m.length} / 160</span>
                </div>
              </div>
              <textarea
                value={m}
                onChange={(e) =>
                  setCampaign({
                    ...campaign,
                    messages: campaign.messages.map((x, j) => (j === i ? e.target.value : x)),
                  })
                }
                rows={2}
                className="w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-[1.45] text-[#0a0d14] outline-none"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Step 3: Review ─────────────────────────────────────────────────────
function Step3Review({ brand, campaign }: { brand: Brand; campaign: Campaign }) {
  return (
    <div className="space-y-5">
      <Card title="Brand">
        <ReviewGrid>
          <ReviewItem label="Legal Name" value={brand.legalName} />
          <ReviewItem label="EIN" value={brand.ein || "Missing"} missing={!brand.ein} />
          <ReviewItem label="Vertical" value={brand.vertical} />
          <ReviewItem label="Website" value={brand.website} />
          <ReviewItem label="Authorized Rep" value={brand.repName || "Missing"} missing={!brand.repName} />
          <ReviewItem label="Rep Email" value={brand.repEmail} />
          <ReviewItem label="Rep Phone" value={brand.repPhone} />
          <ReviewItem label="Address" value={`${brand.street}, ${brand.city}, ${brand.state} ${brand.postal}`} />
        </ReviewGrid>
      </Card>

      <Card title="Campaign">
        <ReviewGrid>
          <ReviewItem label="Use Case" value={campaign.useCase} />
          <ReviewItem
            label="Monthly Volume"
            value={
              campaign.volume === "LOW"
                ? "Low (Up To 3,000 / Mo)"
                : campaign.volume === "MEDIUM"
                  ? "Medium (Up To 30,000 / Mo)"
                  : "High (Above 30,000 / Mo)"
            }
          />
          <ReviewItem label="Sample Messages" value={`${campaign.messages.length} Submitted`} />
          <ReviewItem label="HELP And STOP Behavior" value="Handled Automatically" />
        </ReviewGrid>
      </Card>

      <FeeRow />
    </div>
  );
}

function FeeRow() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white" style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4">
        <div>
          <div className="flex items-baseline gap-2">
            <div className="text-[14.5px] font-semibold tracking-[-0.012em] text-[#0a0d14]">
              Carrier Verification Fee
            </div>
            <div className="text-[14.5px] font-semibold tabular-nums text-[#0a0d14]">$40</div>
          </div>
          <p className="mt-1 max-w-[58ch] text-[12px] leading-[1.5] text-[#5b606a]">
            Set by The Campaign Registry. Not marked up. Same rate at every messaging provider. Charged at submission. Brand verifies in 1 to 2 business days, then carriers review the campaign for 1 to 3 weeks.
          </p>
        </div>
        <a
          href="https://www.campaignregistry.com/pricing"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[11.5px] font-medium text-[#5b606a] hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
        >
          See TCR Pricing
          <IconExternalLink size={11} stroke={2.25} />
        </a>
      </div>
    </div>
  );
}

// ─── Step 4: Success ────────────────────────────────────────────────────
function Step4Success() {
  return (
    <div className="mx-auto max-w-[760px] px-10 pb-20 pt-10">
      <div
        className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <div className="px-7 py-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#9298a3]">
            What Happens Next
          </div>
          <div className="mt-3 space-y-3">
            <Timeline
              icon={<IconShieldCheck size={14} stroke={2.25} />}
              title="Brand Verification"
              when="Within 1 To 2 Business Days"
              desc="The Campaign Registry verifies the legal entity, EIN, and contact details."
              active
            />
            <Timeline
              icon={<IconClock size={14} stroke={2.25} />}
              title="Carrier Review"
              when="1 To 3 Weeks After Verification"
              desc="T-Mobile, AT&T, and Verizon review the campaign use case and sample messages."
            />
            <Timeline
              icon={<IconCheck size={14} stroke={2.25} />}
              title="SMS Goes Live"
              when="The Moment Carriers Approve"
              desc="SMS flips on across every phone number automatically. An SMS and email confirmation fires."
            />
          </div>
        </div>

        <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-7 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] bg-white text-[#0d4b3a] ring-1 ring-[#ebedf0]">
              <IconMail size={14} stroke={2.25} />
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-[#0a0d14]">Confirmation Sent</div>
              <div className="mt-0.5 text-[12px] text-[#5b606a]">
                Submission record and tracking link sent to bree@nextsurplus.com.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href="/share/phone-numbers-approved?v=6"
          className="cursor-pointer text-[12.5px] font-medium text-[#5b606a] hover:text-[#0d4b3a]"
        >
          View Phone Numbers Settings &rarr;
        </Link>
        <Link
          href="/share/a2p-wizard-final"
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-5 text-[13px] font-medium text-white"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
        >
          Back To Dashboard
          <IconChevronRight size={12} stroke={2.25} />
        </Link>
      </div>
    </div>
  );
}

function Timeline({
  icon,
  title,
  when,
  desc,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  when: string;
  desc: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] border border-[#f1f2f4] p-3.5">
      <span
        className={[
          "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
          active ? "bg-[#0d4b3a] text-white" : "bg-white text-[#9298a3] ring-1 ring-[#ebedf0]",
        ].join(" ")}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <div className="text-[13.5px] font-semibold text-[#0a0d14]">{title}</div>
          <div className="text-[11.5px] text-[#9298a3]">{when}</div>
        </div>
        <p className="mt-1 text-[12.5px] leading-[1.5] text-[#5b606a]">{desc}</p>
      </div>
    </div>
  );
}

// ─── Help Cards (redesigned: structured data rows, no checkmark bullets) ─
function stepHelpFor(step: Step) {
  if (step === 1) {
    return (
      <div className="space-y-3">
        <HelpCard
          title="What Carriers Check"
          rows={[
            ["Legal Entity", "Verifiable In State Records"],
            ["EIN", "Matches IRS Records Exactly"],
            ["Rep Contact", "Reachable By Phone And Email"],
          ]}
        />
        <HelpCard
          title="Top Denial Reasons"
          rows={[
            ["EIN Format", "Wrong Digit Count Or Hyphen"],
            ["Vertical Mismatch", "Does Not Match Website Content"],
            ["Rep Email", "Bounces Or Undeliverable"],
          ]}
        />
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="space-y-3">
        <HelpCard
          title="What Makes A Strong Campaign"
          rows={[
            ["Use Case", "Messages Match The Stated Use"],
            ["Opt-In Flow", "Documented And Clear"],
            ["Keywords", "HELP And STOP Behavior Set"],
          ]}
        />
        <HelpCard
          title="HELP And STOP"
          rows={[
            ["Setup", "Handled Automatically"],
            ["STOP Reply", "Marks Contact Do-Not-Text"],
            ["HELP Reply", "Returns A Standard Response"],
          ]}
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <HelpCard
        title="After Submission"
        rows={[
          ["Brand Verify", "1 To 2 Business Days"],
          ["Campaign Review", "1 To 3 Weeks"],
          ["SMS Live", "Automatic On Approval"],
        ]}
      />
      <HelpCard
        title="Costs"
        rows={[
          ["Verification Fee", "$40 Carrier-Set"],
          ["Per Number", "No Charge"],
          ["If Denied", "Resubmit Free"],
        ]}
      />
    </div>
  );
}

function HelpCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#ebedf0] bg-white">
      <div className="border-b border-[#f1f2f4] px-4 py-2.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#0a0d14]">
          {title}
        </div>
      </div>
      <div className="divide-y divide-[#f1f2f4]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[100px_1fr] gap-2 px-4 py-2.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">
              {label}
            </div>
            <div className="text-[11.5px] leading-[1.4] text-[#0a0d14]">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Building blocks ────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="border-b border-[#f1f2f4] px-6 py-3.5">
        <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{title}</div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5 gap-y-4">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  preFilled,
  required,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  preFilled?: boolean;
  required?: boolean;
  wide?: boolean;
}) {
  const showRequired = required && !value;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="flex items-center gap-2">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">
          {label}
        </label>
        {preFilled && <AutoTag />}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "mt-1.5 h-[38px] w-full rounded-[7px] border bg-white px-3 text-[13px] text-[#0a0d14] outline-none placeholder:text-[#9298a3]",
          showRequired ? "border-[#fca5a5]" : "border-[#ebedf0] focus:border-[#0d4b3a]",
        ].join(" ")}
      />
      {showRequired && (
        <div className="mt-1 text-[11px] font-medium text-[#b42318]">Required For Carrier Review</div>
      )}
    </div>
  );
}

function AutoTag() {
  return (
    <span className="inline-flex h-4 items-center gap-1 rounded-[3px] border border-[#ebedf0] bg-white px-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#5b606a]">
      Auto
    </span>
  );
}

function ReviewGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-0">{children}</div>;
}

function ReviewItem({ label, value, missing }: { label: string; value: string; missing?: boolean }) {
  return (
    <div className="border-b border-[#f1f2f4] py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{label}</div>
      <div className={["mt-1 text-[13px] font-medium", missing ? "text-[#b42318]" : "text-[#0a0d14]"].join(" ")}>
        {value}
      </div>
    </div>
  );
}

// ─── Nav row (Preview only on Step 3) ──────────────────────────────────
function NavRow({
  step,
  onBack,
  onNext,
  onPreview,
}: {
  step: Step;
  onBack: () => void;
  onNext: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="mt-7 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-[7px] border border-[#ebedf0] bg-white px-4 text-[13px] font-medium text-[#0a0d14] hover:border-[#0d4b3a] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconChevronLeft size={12} stroke={2.25} />
        Back
      </button>

      <div className="flex items-center gap-3">
        {step === 3 && (
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] border border-[#ebedf0] bg-white px-3.5 text-[12.5px] font-medium text-[#5b606a] hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
          >
            <IconEye size={12} stroke={2.25} />
            Preview Submission
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[13.5px] font-medium text-white"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
        >
          {step === 1 ? "Continue To Campaign" : step === 2 ? "Continue To Review" : "Submit Registration"}
          {step === 3 ? <IconArrowRight size={13} stroke={2.25} /> : <IconChevronRight size={13} stroke={2.25} />}
        </button>
      </div>
    </div>
  );
}

// ─── Live preview drawer ────────────────────────────────────────────────
function PreviewDrawer({ brand, campaign, onClose }: { brand: Brand; campaign: Campaign; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" onClick={onClose} aria-label="Close preview" className="flex-1 cursor-default bg-[#0a0d14]/30" />
      <aside className="flex w-[420px] flex-col overflow-y-auto border-l border-[#ebedf0] bg-white">
        <div
          className="border-b border-[#04261c] px-7 py-5 text-white"
          style={{ background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 100%)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-white/60">
                Submission Preview
              </div>
              <div className="mt-0.5 text-[15px] font-semibold tracking-[-0.012em]">
                What Carriers See
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[6px] p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <IconX size={16} stroke={2.25} />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-7 py-6">
          <section>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Brand Submission
            </div>
            <PreviewLine label="Legal Name" value={brand.legalName} />
            <PreviewLine label="EIN" value={brand.ein || "Required"} warn={!brand.ein} />
            <PreviewLine label="Vertical" value={brand.vertical} />
            <PreviewLine label="Website" value={brand.website.replace(/^https?:\/\//, "")} />
            <PreviewLine label="Rep" value={brand.repName || "Required"} warn={!brand.repName} />
            <PreviewLine label="Address" value={`${brand.city}, ${brand.state}`} />
          </section>

          <section>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Campaign Submission
            </div>
            <PreviewLine label="Use Case" value={campaign.useCase} />
            <PreviewLine
              label="Monthly Volume"
              value={
                campaign.volume === "LOW" ? "Low (3k / mo)" : campaign.volume === "MEDIUM" ? "Medium (30k / mo)" : "High (30k+ / mo)"
              }
            />
            <PreviewLine label="Templates" value={`${campaign.messages.length} Submitted`} />
          </section>

          <section>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
              Sample Message
            </div>
            <div className="mt-2 rounded-[10px] bg-[#f1f2f4] p-3 text-[12.5px] leading-[1.45] text-[#0a0d14]">
              {campaign.messages[0]}
            </div>
          </section>

          <a
            href="https://www.campaignregistry.com/about-tcr"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#5b606a] hover:text-[#0d4b3a]"
          >
            About The Campaign Registry
            <IconExternalLink size={11} stroke={2.25} />
          </a>
        </div>
      </aside>
    </div>
  );
}

function PreviewLine({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="mt-3 flex items-baseline justify-between gap-3 border-b border-[#f1f2f4] pb-2">
      <span className="text-[11px] uppercase tracking-[0.06em] text-[#9298a3]">{label}</span>
      <span className={["text-[12.5px] font-medium tabular-nums", warn ? "text-[#b42318]" : "text-[#0a0d14]"].join(" ")}>
        {value}
      </span>
    </div>
  );
}
