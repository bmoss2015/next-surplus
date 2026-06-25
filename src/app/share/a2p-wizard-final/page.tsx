"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconShieldCheck,
  IconArrowRight,
  IconClock,
  IconMail,
} from "@tabler/icons-react";

type Step = 1 | 2 | 3 | 4;

type Brand = {
  entityType: string;
  legalName: string;
  ein: string;
  vertical: string;
  website: string;
  privacyUrl: string;
  termsUrl: string;
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
  description: string;
  volume: "LOW" | "MEDIUM" | "HIGH";
  messages: string[];
};

const VERTICALS: { value: string; label: string }[] = [
  { value: "FINANCIAL", label: "Financial Services" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "PROFESSIONAL", label: "Professional Services" },
  { value: "LEGAL", label: "Legal" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "EDUCATION", label: "Education" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "NON_PROFIT", label: "Non-Profit" },
  { value: "RETAIL", label: "Retail" },
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "HOSPITALITY_TRAVEL", label: "Hospitality and Travel" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "ENERGY_UTILITIES", label: "Energy and Utilities" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "COMMUNICATION", label: "Communication" },
];

const ENTITY_TYPES: { value: string; label: string }[] = [
  { value: "PRIVATE_PROFIT", label: "Private For-Profit Company" },
  { value: "PUBLIC_PROFIT", label: "Public For-Profit Company" },
  { value: "NON_PROFIT", label: "Non-Profit Organization" },
  { value: "GOVERNMENT", label: "Government Entity" },
  { value: "SOLE_PROPRIETOR", label: "Sole Proprietor" },
];

const USE_CASES: { value: string; label: string; description: string }[] = [
  {
    value: "CUSTOMER_CARE",
    label: "Customer Care",
    description: "Transactional messages to recipients who have an established relationship with the sender. Best fit for surplus recovery outreach to identified parties of interest.",
  },
  {
    value: "ACCOUNT_NOTIFICATION",
    label: "Account Notification",
    description: "Updates about account status, transactions, or upcoming events. Use when messages are strictly notifications, not conversational outreach.",
  },
  {
    value: "MIXED",
    label: "Mixed",
    description: "Combination of marketing and informational content. Subject to higher carrier scrutiny and slower approval.",
  },
  {
    value: "MARKETING",
    label: "Marketing",
    description: "Promotional content. Requires documented opt-in for every recipient. Not recommended for cold outreach scenarios.",
  },
  {
    value: "LOW_VOLUME",
    label: "Low Volume",
    description: "Mixed content with strict volume caps. Appropriate when total throughput stays under 6,000 messages per day across all numbers.",
  },
];

const DEFAULT_MESSAGES = [
  "Hi {first_name}, this is Sarah with Workflow Minds. Public records show you may be owed funds from a recent foreclosure sale. Reply Y for details or STOP to opt out.",
  "Following up on the surplus funds from your property sale. The claim window is open through August 15. Reply with a good time to talk.",
  "A signed retainer is still needed to file the claim before the surplus funds transfer to the state. Reply or call when convenient.",
];

const ALT_MESSAGES = [
  "Hi {first_name}, the documents are filed with the court. A follow-up text will go out when a hearing date is set. Reply STOP to opt out.",
  "Hi {first_name}, a check is ready to mail. Reply with the current mailing address and it will go out today.",
  "Following up on the claim package mailed last week. Please confirm receipt or reply with any questions.",
];

export default function A2pWizardFinal() {
  const [step, setStep] = useState<Step>(1);
  const [useCaseOpen, setUseCaseOpen] = useState(false);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});

  const [brand, setBrand] = useState<Brand>({
    entityType: "PRIVATE_PROFIT",
    legalName: "Workflow Minds LLC",
    ein: "",
    vertical: "FINANCIAL",
    website: "https://nextsurplus.com",
    privacyUrl: "https://app.nextsurplus.com/legal/workflow-minds/privacy",
    termsUrl: "https://app.nextsurplus.com/legal/workflow-minds/terms",
    repName: "Bree Moss",
    repEmail: "bree@nextsurplus.com",
    repPhone: "+1 (432) 400-5579",
    street: "1234 Surplus Way",
    city: "Austin",
    state: "TX",
    postal: "78701",
  });

  const [campaign, setCampaign] = useState<Campaign>({
    useCase: "CUSTOMER_CARE",
    description:
      "Outreach to individuals identified through public court records as potential claimants for surplus funds from foreclosure or tax sales. Messages provide case status, document requests, and payment notifications.",
    volume: "LOW",
    messages: DEFAULT_MESSAGES,
  });

  const canContinue =
    step === 1
      ? !!brand.ein.trim() && !!brand.repName.trim()
      : step === 2
        ? campaign.messages.every((m) => m.trim().length > 0) && !!campaign.description.trim()
        : true;

  function next() {
    if (!canContinue) {
      setAttempted((a) => ({ ...a, [step]: true }));
      return;
    }
    setAttempted((a) => ({ ...a, [step]: true }));
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
          <div className="grid grid-cols-[1fr_300px] gap-7">
            <div>
              {step === 1 && <Step1Brand brand={brand} setBrand={setBrand} attempted={!!attempted[1]} />}
              {step === 2 && (
                <Step2Campaign
                  campaign={campaign}
                  setCampaign={setCampaign}
                  useCaseOpen={useCaseOpen}
                  setUseCaseOpen={setUseCaseOpen}
                  attempted={!!attempted[2]}
                />
              )}
              {step === 3 && <Step3Review brand={brand} campaign={campaign} />}

              <NavRow step={step} onBack={back} onNext={next} canContinue={canContinue} />
            </div>

            <aside>{stepHelpFor(step)}</aside>
          </div>
        </div>
      )}

      {step === 4 && <Step4Success />}
    </>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────
function Hero({ step }: { step: Step }) {
  if (step === 4) {
    return (
      <div
        className="border-b border-[#04261c]"
        style={{ background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)" }}
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
            The Campaign Registry received the brand and campaign for review. Notifications will arrive by SMS and email at each status change.
          </p>
        </div>
      </div>
    );
  }

  const titles = {
    1: "Brand Registration",
    2: "Campaign Definition",
    3: "Review And Submit",
  } as const;

  const subs = {
    1: "Carriers verify the legal entity behind every SMS campaign before approval. The entity registered here represents the sender to mobile network operators.",
    2: "Carriers assess how the SMS program will be used and review three sample messages alongside the campaign description.",
    3: "Final review before submission. Brand verification completes in 1 to 2 business days, followed by carrier campaign review of 1 to 3 weeks.",
  } as const;

  return (
    <div
      className="border-b border-[#04261c]"
      style={{ background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)" }}
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
          state === "done" || state === "active" ? "bg-white text-[#0d4b3a]" : "bg-white/10 text-white/70",
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
function Step1Brand({
  brand,
  setBrand,
  attempted,
}: {
  brand: Brand;
  setBrand: (b: Brand) => void;
  attempted: boolean;
}) {
  const u = <K extends keyof Brand>(k: K, v: Brand[K]) => setBrand({ ...brand, [k]: v });

  return (
    <div className="space-y-5">
      <Card title="Company">
        <FieldGrid>
          <SelectField
            label="Entity Type"
            value={brand.entityType}
            onChange={(v) => u("entityType", v)}
            options={ENTITY_TYPES}
          />
          <Field label="EIN" value={brand.ein} onChange={(v) => u("ein", v)} placeholder="12-3456789" required attempted={attempted} />
          <Field label="Legal Name" value={brand.legalName} onChange={(v) => u("legalName", v)} />
          <SelectField label="Industry" value={brand.vertical} onChange={(v) => u("vertical", v)} options={VERTICALS} />
          <Field label="Website" value={brand.website} onChange={(v) => u("website", v)} wide />
        </FieldGrid>
      </Card>

      <Card title="Authorized Representative" subtitle="Person carriers will contact to verify the brand. Must be reachable by phone and email.">
        <FieldGrid>
          <Field label="Full Name" value={brand.repName} onChange={(v) => u("repName", v)} required attempted={attempted} />
          <Field label="Email" value={brand.repEmail} onChange={(v) => u("repEmail", v)} />
          <Field label="Phone" value={brand.repPhone} onChange={(v) => u("repPhone", v)} wide />
        </FieldGrid>
      </Card>

      <Card title="Company Address" subtitle="Must match the address registered with the IRS.">
        <FieldGrid>
          <Field label="Street" value={brand.street} onChange={(v) => u("street", v)} wide />
          <Field label="City" value={brand.city} onChange={(v) => u("city", v)} />
          <Field label="State" value={brand.state} onChange={(v) => u("state", v)} />
          <Field label="Postal Code" value={brand.postal} onChange={(v) => u("postal", v)} wide />
        </FieldGrid>
      </Card>

      <Card
        title="Legal Documents"
        subtitle="Carriers and recipients can review the policies that govern messaging. URLs are hosted automatically and update when company details change."
      >
        <FieldGrid>
          <Field label="Privacy Policy" value={brand.privacyUrl} onChange={(v) => u("privacyUrl", v)} wide />
          <Field label="Terms Of Service" value={brand.termsUrl} onChange={(v) => u("termsUrl", v)} wide />
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
  attempted,
}: {
  campaign: Campaign;
  setCampaign: (c: Campaign) => void;
  useCaseOpen: boolean;
  setUseCaseOpen: (b: boolean) => void;
  attempted: boolean;
}) {
  function swapMessage(i: number) {
    const alt = ALT_MESSAGES[i % ALT_MESSAGES.length];
    setCampaign({ ...campaign, messages: campaign.messages.map((x, j) => (j === i ? alt : x)) });
  }

  const current = USE_CASES.find((u) => u.value === campaign.useCase) ?? USE_CASES[0];

  return (
    <div className="space-y-5">
      <Card title="Use Case">
        <div className="rounded-[10px] border border-[#ebedf0] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5b606a]">
                Suggested For Surplus Recovery
              </div>
              <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
                {current.label}
              </div>
              <p className="mt-2 max-w-[54ch] text-[13px] leading-[1.55] text-[#5b606a]">
                {current.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseCaseOpen(!useCaseOpen)}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12px] font-medium text-[#0a0d14] hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
            >
              Change Use Case
              <IconChevronDown size={12} stroke={2.25} className={useCaseOpen ? "rotate-180 transition" : "transition"} />
            </button>
          </div>
        </div>

        {useCaseOpen && (
          <div className="mt-3 space-y-2">
            <div className="px-1 text-[11px] text-[#5b606a]">
              Other use cases rarely fit surplus recovery and may extend or fail carrier review. Choose with care.
            </div>
            {USE_CASES.filter((u) => u.value !== campaign.useCase).map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => {
                  setCampaign({ ...campaign, useCase: u.value });
                  setUseCaseOpen(false);
                }}
                className="block w-full cursor-pointer rounded-[10px] border border-[#ebedf0] bg-white p-4 text-left hover:border-[#0d4b3a]"
              >
                <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{u.label}</div>
                <p className="mt-1 text-[12px] leading-[1.5] text-[#5b606a]">{u.description}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card title="Campaign Description" subtitle="A short statement describing how SMS is used. Carriers compare this to the sample messages.">
        <textarea
          value={campaign.description}
          onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
          rows={3}
          className={[
            "w-full rounded-[7px] border bg-white p-3 text-[13px] leading-[1.5] text-[#0a0d14] outline-none",
            attempted && !campaign.description.trim()
              ? "border-[#fca5a5] focus:border-[#b42318]"
              : "border-[#ebedf0] focus:border-[#0d4b3a]",
          ].join(" ")}
        />
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
                  {v === "LOW" ? "Up To 3,000 Per Month" : v === "MEDIUM" ? "Up To 30,000 Per Month" : "Above 30,000 Per Month"}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Sample Messages" subtitle="Three templates carriers will compare against the campaign description. These are starting points tailored to the selected use case and can be edited inline. Tokens such as {first_name} fill at send time.">
        <div className="space-y-3">
          {campaign.messages.map((m, i) => {
            const empty = attempted && !m.trim();
            return (
              <div
                key={i}
                className={[
                  "rounded-[10px] border bg-white p-3.5",
                  empty ? "border-[#fca5a5]" : "border-[#ebedf0]",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
                    Template {i + 1}
                  </span>
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
            );
          })}
        </div>
      </Card>

      <Card title="Keywords And Opt-Outs" subtitle="STOP and HELP keyword behavior is handled by the platform. No additional configuration is needed for compliance with carrier requirements.">
        <div className="grid grid-cols-2 gap-3">
          <KeywordRow keyword="STOP" behavior="Marks the contact do-not-text and confirms with a standard reply." />
          <KeywordRow keyword="HELP" behavior="Returns brand name, support email, and how to opt back in." />
        </div>
      </Card>
    </div>
  );
}

function KeywordRow({ keyword, behavior }: { keyword: string; behavior: string }) {
  return (
    <div className="rounded-[10px] border border-[#ebedf0] bg-white p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold tabular-nums text-[#0a0d14]">{keyword}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5b606a]">Automatic</span>
      </div>
      <p className="mt-1 text-[11.5px] leading-[1.5] text-[#5b606a]">{behavior}</p>
    </div>
  );
}

// ─── Step 3: Review ─────────────────────────────────────────────────────
function Step3Review({ brand, campaign }: { brand: Brand; campaign: Campaign }) {
  const useCaseLabel = USE_CASES.find((u) => u.value === campaign.useCase)?.label ?? campaign.useCase;
  const verticalLabel = VERTICALS.find((v) => v.value === brand.vertical)?.label ?? brand.vertical;
  const entityLabel = ENTITY_TYPES.find((e) => e.value === brand.entityType)?.label ?? brand.entityType;

  return (
    <div className="space-y-5">
      <Card title="Brand">
        <ReviewGrid>
          <ReviewItem label="Entity Type" value={entityLabel} />
          <ReviewItem label="Legal Name" value={brand.legalName} />
          <ReviewItem label="EIN" value={brand.ein || "Missing"} missing={!brand.ein} />
          <ReviewItem label="Industry" value={verticalLabel} />
          <ReviewItem label="Website" value={brand.website} />
          <ReviewItem label="Privacy Policy" value={brand.privacyUrl} />
          <ReviewItem label="Terms" value={brand.termsUrl} />
          <ReviewItem label="Authorized Rep" value={brand.repName || "Missing"} missing={!brand.repName} />
          <ReviewItem label="Rep Email" value={brand.repEmail} />
          <ReviewItem label="Rep Phone" value={brand.repPhone} />
          <ReviewItem label="Address" value={`${brand.street}, ${brand.city}, ${brand.state} ${brand.postal}`} wide />
        </ReviewGrid>
      </Card>

      <Card title="Campaign">
        <ReviewGrid>
          <ReviewItem label="Use Case" value={useCaseLabel} />
          <ReviewItem
            label="Monthly Volume"
            value={
              campaign.volume === "LOW"
                ? "Low (Up To 3,000 Per Month)"
                : campaign.volume === "MEDIUM"
                  ? "Medium (Up To 30,000 Per Month)"
                  : "High (Above 30,000 Per Month)"
            }
          />
          <ReviewItem label="Description" value={campaign.description} wide />
          <ReviewItem label="Sample Messages" value={`${campaign.messages.length} Submitted`} />
          <ReviewItem label="STOP And HELP Behavior" value="Handled By Platform" />
        </ReviewGrid>
      </Card>

      <FeeRow />
    </div>
  );
}

function FeeRow() {
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="px-6 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <div className="text-[14.5px] font-semibold tracking-[-0.012em] text-[#0a0d14]">
            Carrier Verification Fee
          </div>
          <div className="text-[16px] font-semibold tabular-nums text-[#0a0d14]">$40.00</div>
        </div>
        <p className="mt-2 max-w-[64ch] text-[12.5px] leading-[1.55] text-[#5b606a]">
          The Campaign Registry, an industry body operated by the major US mobile carriers, administers brand verification on behalf of the wireless industry. The fee passes through at cost and is identical at every messaging provider. Verification completes within 1 to 2 business days. Carrier review of the campaign follows for 1 to 3 weeks before SMS is enabled across registered numbers.
        </p>
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
              when="1 To 2 Business Days"
              desc="The Campaign Registry verifies the legal entity, EIN, address, and authorized representative."
              active
            />
            <Timeline
              icon={<IconClock size={14} stroke={2.25} />}
              title="Carrier Campaign Review"
              when="1 To 3 Weeks After Verification"
              desc="Mobile network operators evaluate the campaign use case, description, and sample messages."
            />
            <Timeline
              icon={<IconCheck size={14} stroke={2.25} />}
              title="SMS Activation"
              when="At The Moment Of Approval"
              desc="SMS capability enables automatically across every phone number registered to the account. A confirmation arrives by SMS and email."
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
                The submission record and tracking link were sent to bree@nextsurplus.com.
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

// ─── Compliance Coach ──────────────────────────────────────────────────
function stepHelpFor(step: Step) {
  if (step === 1) {
    return (
      <ComplianceCoach
        title="What Carriers Verify"
        lead="Brand registration passes through three checks before the campaign can enter carrier review."
        tips={[
          {
            headline: "Legal Entity",
            body: "Carriers validate the brand name against the entity registered with the state and the IRS. Use the legal name exactly as it appears on filings.",
          },
          {
            headline: "EIN",
            body: "Carriers cross-reference the EIN against IRS records. Format the value with the hyphen, for example 12-3456789. EIN format errors are the single most common rejection reason.",
          },
          {
            headline: "Authorized Representative",
            body: "Mobile carriers may place a verification call. Provide a direct line and an actively monitored email rather than a help desk address.",
          },
        ]}
        footer="Common rejection reasons include EIN format errors, industry mismatches between the website and registered vertical, and undeliverable representative contact details."
      />
    );
  }
  if (step === 2) {
    return (
      <ComplianceCoach
        title="What Strengthens A Campaign"
        lead="Three components shape the carrier decision on whether the campaign is approved."
        tips={[
          {
            headline: "Use Case Match",
            body: "The sample messages must reflect the selected use case. Customer Care messages should read as transactional follow-up, not as cold marketing outreach.",
          },
          {
            headline: "Opt-In Description",
            body: "Carriers expect a clear path showing how recipients consented to receive messages. Public-record outreach is acceptable when the source and rationale are stated explicitly.",
          },
          {
            headline: "Keyword Compliance",
            body: "STOP and HELP keyword responses are required by FCC and CTIA guidelines. Both behaviors are handled by the platform with no additional configuration required.",
          },
        ]}
        footer="Common rejection reasons include marketing-style language inside a Customer Care use case, missing opt-in explanation, and stated volume that exceeds the use-case norms."
      />
    );
  }
  return (
    <ComplianceCoach
      title="After Submission"
      lead="Three phases follow once the registration is submitted to The Campaign Registry."
      tips={[
        {
          headline: "Brand Verification",
          body: "The Campaign Registry confirms the legal entity and EIN within 1 to 2 business days. Status updates flow through to the Phone Numbers settings panel.",
        },
        {
          headline: "Carrier Review",
          body: "Mobile carriers conduct a 1 to 3 week review of the campaign use case, description, and sample messages once the brand verifies.",
        },
        {
          headline: "SMS Activation",
          body: "On approval, SMS capability activates across every phone number registered to the account, with notifications by SMS and email.",
        },
      ]}
      footer="If a submission is rejected, the specific reason surfaces on the Phone Numbers settings panel with guidance on the corrections required before resubmission."
    />
  );
}

function ComplianceCoach({
  title,
  lead,
  tips,
  footer,
}: {
  title: string;
  lead: string;
  tips: { headline: string; body: string }[];
  footer: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div
        className="border-b border-[#04261c] px-5 py-3 text-white"
        style={{ background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 100%)" }}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
          <IconShieldCheck size={11} stroke={2.25} />
          Compliance Coach
        </div>
        <div className="mt-0.5 text-[15px] font-semibold leading-[1.2] tracking-[-0.014em]">
          {title}
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-[12.5px] leading-[1.55] text-[#5b606a]">{lead}</p>
        <ol className="mt-4 space-y-3.5">
          {tips.map((t, i) => (
            <li key={t.headline} className="grid grid-cols-[24px_1fr] gap-3">
              <span className="text-[20px] font-semibold leading-none tabular-nums text-[#0d4b3a]">
                {i + 1}
              </span>
              <div>
                <div className="text-[12.5px] font-semibold leading-[1.3] text-[#0a0d14]">
                  {t.headline}
                </div>
                <p className="mt-1 text-[12px] leading-[1.5] text-[#5b606a]">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-[#f1f2f4] bg-[#fafbfc] px-5 py-3">
        <p className="text-[11px] leading-[1.45] text-[#5b606a]">{footer}</p>
      </div>
    </div>
  );
}

// ─── Building blocks ────────────────────────────────────────────────────
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="border-b border-[#f1f2f4] px-6 py-4">
        <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{title}</div>
        {subtitle && <div className="mt-1 max-w-[64ch] text-[12px] leading-[1.5] text-[#5b606a]">{subtitle}</div>}
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
  required,
  attempted,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  attempted?: boolean;
  wide?: boolean;
}) {
  const errored = required && attempted && !value;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">
        {label}
        {required && <span className="ml-1 text-[#b42318]">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "mt-1.5 h-[38px] w-full rounded-[7px] border bg-white px-3 text-[13px] text-[#0a0d14] outline-none placeholder:text-[#9298a3]",
          errored ? "border-[#fca5a5] focus:border-[#b42318]" : "border-[#ebedf0] focus:border-[#0d4b3a]",
        ].join(" ")}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-[38px] w-full cursor-pointer rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13px] text-[#0a0d14] outline-none focus:border-[#0d4b3a]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ReviewGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6">{children}</div>;
}

function ReviewItem({ label, value, missing, wide }: { label: string; value: string; missing?: boolean; wide?: boolean }) {
  return (
    <div className={["border-b border-[#f1f2f4] py-3", wide ? "col-span-2" : ""].join(" ")}>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{label}</div>
      <div className={["mt-1 text-[13px] font-medium", missing ? "text-[#b42318]" : "text-[#0a0d14]"].join(" ")}>
        {value}
      </div>
    </div>
  );
}

// ─── Nav row ────────────────────────────────────────────────────────────
function NavRow({
  step,
  onBack,
  onNext,
  canContinue,
}: {
  step: Step;
  onBack: () => void;
  onNext: () => void;
  canContinue: boolean;
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

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[13.5px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={canContinue ? { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" } : undefined}
        title={canContinue ? undefined : "Complete the required fields to continue"}
      >
        {step === 1 ? "Continue To Campaign" : step === 2 ? "Continue To Review" : "Submit Registration"}
        {step === 3 ? <IconArrowRight size={13} stroke={2.25} /> : <IconChevronRight size={13} stroke={2.25} />}
      </button>
    </div>
  );
}
