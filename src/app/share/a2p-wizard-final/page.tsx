"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  IconInfoCircle,
  IconLock,
  IconAlertTriangle,
} from "@tabler/icons-react";

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\[[A-Z][A-Z0-9 ,.'\-/]+\]/g);
  return matches ? Array.from(new Set(matches)) : [];
}

type Step = 1 | 2 | 3 | 4;

type Brand = {
  entityType: string;
  legalName: string;
  ein: string;
  vertical: string;
  website: string;
  privacyUrl: string;
  termsUrl: string;
  optInUrl: string;
  repName: string;
  repTitle: string;
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
  optInConfirmation: string;
  helpMessage: string;
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

// TCR's accepted job titles for the authorized representative. Fixed
// list per Twilio's published collect-business-info docs.
const REP_TITLES: { value: string; label: string }[] = [
  { value: "", label: "Select A Title" },
  { value: "CEO", label: "CEO" },
  { value: "CFO", label: "CFO" },
  { value: "DIRECTOR", label: "Director" },
  { value: "GM", label: "General Manager" },
  { value: "VP", label: "Vice President" },
  { value: "GENERAL_COUNSEL", label: "General Counsel" },
  { value: "OTHER", label: "Other" },
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

// Placeholder copy shown in empty textareas. Never written into state.
const SAMPLE_PLACEHOLDERS: string[] = [
  "Write the first message recipients will see. For example, an introduction explaining who is contacting them, why, and how to opt out.",
  "Write a follow-up message that goes out after first contact. For example, a status update, document request, or scheduling prompt.",
  "Write a third example representative of routine activity. For example, a reminder, confirmation, or wrap-up.",
];

// Templates the operator can LOAD with one click. After loading, the
// wizard remembers the loaded value and blocks Continue if the message
// is still identical to it, so boilerplate never ships across operators.
const SAMPLE_TEMPLATES: string[][] = [
  [
    "Hi [FIRST NAME], this is [YOUR NAME] with [COMPANY]. Public records show you may be entitled to surplus funds from a [SALE TYPE]. Reply Y for details or STOP to opt out.",
    "Hi [FIRST NAME], following up on a possible recovery from court records tied to [PROPERTY OR CASE DETAIL]. Reply Y to learn more or STOP to opt out.",
  ],
  [
    "Hi [FIRST NAME], following up on the surplus funds claim from the [PROPERTY ADDRESS] sale. The window closes on [DEADLINE]. Reply with a good time to talk.",
    "Hi [FIRST NAME], the documents you signed are filed with the court. The next step is [NEXT STEP]. Reply STOP to opt out at any time.",
  ],
  [
    "Hi [FIRST NAME], a check is ready to mail. Reply with the current mailing address and it will go out today.",
    "Hi [FIRST NAME], a signed retainer is still needed to file the claim before [DEADLINE]. Reply or call when convenient.",
  ],
];

const DESCRIPTION_TEMPLATE =
  "[COMPANY NAME] sends transactional outreach to individuals identified through public court records as potential claimants for surplus funds from [SALE TYPES, e.g. foreclosure or tax sales]. Messages provide case status updates, document requests, and payment notifications. Recipients can reply STOP at any time to opt out.";

// Sample message slot labels. The Campaign Registry itself does not
// enforce a specific label for each slot, but the messages submitted
// must reflect what carriers will see in production. Three slots are
// labeled simply by number, in line with Twilio's API field naming.
const SAMPLE_LABELS: { title: string; subtitle: string }[] = [
  { title: "Message 1", subtitle: "" },
  { title: "Message 2", subtitle: "" },
  { title: "Message 3", subtitle: "" },
];

export default function A2pWizardFinalEntry() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbfc]" />}>
      <RouteSwitch />
    </Suspense>
  );
}

function RouteSwitch() {
  const sp = useSearchParams();
  const action = sp.get("action");
  if (action === "rebrand-confirm") return <BrandIdentityChangeConfirm />;
  return <A2pWizardFinal />;
}

function A2pWizardFinal() {
  const [step, setStep] = useState<Step>(1);
  const [useCaseOpen, setUseCaseOpen] = useState(false);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});

  const [brand, setBrand] = useState<Brand>({
    entityType: "PRIVATE_PROFIT",
    legalName: "Workflow Minds LLC",
    ein: "",
    vertical: "FINANCIAL",
    website: "https://nextsurplus.com",
    privacyUrl: "",
    termsUrl: "",
    optInUrl: "",
    repName: "Bree Moss",
    repTitle: "",
    repEmail: "bree@nextsurplus.com",
    repPhone: "+1 (432) 400-5579",
    street: "1234 Surplus Way",
    city: "Austin",
    state: "TX",
    postal: "78701",
  });

  const [campaign, setCampaign] = useState<Campaign>({
    useCase: "CUSTOMER_CARE",
    description: "",
    volume: "LOW",
    messages: ["", "", ""],
    optInConfirmation: "You're subscribed to surplus recovery updates from [COMPANY NAME]. Reply HELP for help, STOP to opt out.",
    helpMessage: "[COMPANY NAME] surplus recovery support. Email [SUPPORT EMAIL]. Reply STOP to opt out, START to opt back in.",
  });

  const [loadedTemplates, setLoadedTemplates] = useState<(string | null)[]>([null, null, null]);
  const messagesUnchanged = campaign.messages.map(
    (m, i) => loadedTemplates[i] !== null && m === loadedTemplates[i],
  );

  const descriptionPlaceholders = extractPlaceholders(campaign.description);
  const stopMentioned = campaign.messages.some((m) => /\bSTOP\b/i.test(m));
  const einValid = /^\d{2}-\d{7}$/.test(brand.ein.trim());
  const optInConfirmationPlaceholders = extractPlaceholders(campaign.optInConfirmation);
  const helpMessagePlaceholders = extractPlaceholders(campaign.helpMessage);

  const canContinue =
    step === 1
      ? einValid &&
        !!brand.repName.trim() &&
        !!brand.repTitle.trim() &&
        !!brand.privacyUrl.trim() &&
        !!brand.termsUrl.trim() &&
        !!brand.optInUrl.trim()
      : step === 2
        ? !!campaign.useCase &&
          campaign.messages.every((m) => m.trim().length > 0) &&
          !!campaign.description.trim() &&
          descriptionPlaceholders.length === 0 &&
          messagesUnchanged.every((u) => !u) &&
          stopMentioned &&
          !!campaign.optInConfirmation.trim() &&
          optInConfirmationPlaceholders.length === 0 &&
          !!campaign.helpMessage.trim() &&
          helpMessagePlaceholders.length === 0
        : true;

  function next() {
    setAttempted((a) => ({ ...a, [step]: true }));
    if (!canContinue) {
      setTimeout(() => {
        const first = document.querySelector<HTMLElement>("[data-invalid='true']");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }
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
                  loadedTemplates={loadedTemplates}
                  setLoadedTemplates={setLoadedTemplates}
                  messagesUnchanged={messagesUnchanged}
                  descriptionPlaceholders={descriptionPlaceholders}
                />
              )}
              {step === 3 && <Step3Review brand={brand} campaign={campaign} />}

              <NavRow step={step} onBack={back} onNext={next} />
            </div>

            <aside>{stepHelpFor(step)}</aside>
          </div>
        </div>
      )}

      {step === 4 && <Step4Success repEmail={brand.repEmail} />}
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
          <EinField
            value={brand.ein}
            onChange={(v) => u("ein", v)}
            attempted={attempted}
          />
          <Field label="Legal Name" value={brand.legalName} onChange={(v) => u("legalName", v)} />
          <SelectField
            label="Industry"
            value={brand.vertical}
            onChange={(v) => u("vertical", v)}
            options={VERTICALS}
            info={
              <>
                <div className="font-semibold text-[#0a0d14]">Industry Selection</div>
                <p className="mt-1 text-[#5b606a]">
                  Pre-selected as Financial Services because surplus recovery involves identifying entitled parties to funds from court-supervised sales. Carriers classify this work under financial services even when the company itself is structured as professional services or legal services.
                </p>
              </>
            }
          />
          <Field label="Website" value={brand.website} onChange={(v) => u("website", v)} wide />
        </FieldGrid>
      </Card>

      <Card
        title="Authorized Representative"
        subtitle="Carriers contact this person directly to verify the brand. The Campaign Registry requires Full Name and Title at minimum. Both the email and phone number must be actively monitored at the time of submission."
      >
        <FieldGrid>
          <Field label="Full Name" value={brand.repName} onChange={(v) => u("repName", v)} required attempted={attempted} />
          <SelectField
            label="Title"
            value={brand.repTitle}
            onChange={(v) => u("repTitle", v)}
            options={REP_TITLES}
            required
            attempted={attempted}
          />
          <Field label="Email" value={brand.repEmail} onChange={(v) => u("repEmail", v)} type="email" />
          <Field label="Phone" value={brand.repPhone} onChange={(v) => u("repPhone", v)} type="tel" />
        </FieldGrid>
      </Card>

      <Card
        title="Company Address"
        subtitle="The Campaign Registry verifies this against the address on file with the IRS. Discrepancies delay verification or cause rejection."
      >
        <FieldGrid>
          <Field label="Street" value={brand.street} onChange={(v) => u("street", v)} wide />
          <Field label="City" value={brand.city} onChange={(v) => u("city", v)} />
          <Field label="State" value={brand.state} onChange={(v) => u("state", v)} />
          <Field label="Postal Code" value={brand.postal} onChange={(v) => u("postal", v)} wide />
        </FieldGrid>
      </Card>

      <Card
        title="Legal Documents And Opt-In Flow"
        subtitle="The Campaign Registry requires all three URLs to be live and publicly accessible on the brand's own domain. Carriers actively crawl these URLs during review. Placeholder, broken, or generic pages are a common rejection reason."
        info={
          <>
            <div className="font-semibold text-[#0a0d14]">Privacy Policy Must Include</div>
            <ul className="mt-1 list-disc pl-4 text-[#5b606a]">
              <li>Statement that SMS opt-in data is NOT shared with third parties for marketing</li>
              <li>How phone numbers are collected and used</li>
              <li>Instructions to text STOP to opt out at any time</li>
              <li>Contact email for privacy questions</li>
            </ul>

            <div className="mt-3 font-semibold text-[#0a0d14]">Terms Of Service Must Include</div>
            <ul className="mt-1 list-disc pl-4 text-[#5b606a]">
              <li>Description of the service the business provides</li>
              <li>Mention of SMS as part of the service</li>
              <li>Standard disclaimers and dispute resolution</li>
            </ul>

            <div className="mt-3 font-semibold text-[#0a0d14]">Opt-In Flow URL Must Include</div>
            <ul className="mt-1 list-disc pl-4 text-[#5b606a]">
              <li>Form with a phone number field</li>
              <li>Unchecked consent checkbox with explicit language: &quot;I agree to receive SMS from [BRAND]&quot;</li>
              <li>Frequency disclosure (e.g. &quot;Up to 4 messages per month&quot;)</li>
              <li>&quot;Message and data rates may apply&quot;</li>
              <li>Visible links to Privacy Policy and Terms Of Service</li>
              <li>STOP and HELP keyword guidance</li>
              <li>Reachable without a login</li>
            </ul>

            <div className="mt-3 font-semibold text-[#0a0d14]">Common Rejection Reasons</div>
            <ul className="mt-1 list-disc pl-4 text-[#5b606a]">
              <li>Pre-checked consent box</li>
              <li>Generic privacy policy with no SMS-specific language</li>
              <li>Login-protected URLs</li>
              <li>Opt-in checkbox language that does not match the campaign description</li>
            </ul>

            <div className="mt-3 font-semibold text-[#0a0d14]">No Existing Policy?</div>
            <p className="mt-1 text-[#5b606a]">
              Use a third-party generator like Termly or iubenda and host the resulting pages on the brand&apos;s own domain.
            </p>
          </>
        }
      >
        <FieldGrid>
          <Field
            label="Privacy Policy URL"
            value={brand.privacyUrl}
            onChange={(v) => u("privacyUrl", v)}
            placeholder="https://example.com/privacy"
            type="url"
            required
            attempted={attempted}
            wide
          />
          <Field
            label="Terms Of Service URL"
            value={brand.termsUrl}
            onChange={(v) => u("termsUrl", v)}
            placeholder="https://example.com/terms"
            type="url"
            required
            attempted={attempted}
            wide
          />
          <Field
            label="Opt-In Flow URL"
            value={brand.optInUrl}
            onChange={(v) => u("optInUrl", v)}
            placeholder="https://example.com/sms-opt-in"
            type="url"
            required
            attempted={attempted}
            wide
          />
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
  loadedTemplates,
  setLoadedTemplates,
  messagesUnchanged,
  descriptionPlaceholders,
}: {
  campaign: Campaign;
  setCampaign: (c: Campaign) => void;
  useCaseOpen: boolean;
  setUseCaseOpen: (b: boolean) => void;
  attempted: boolean;
  loadedTemplates: (string | null)[];
  setLoadedTemplates: (v: (string | null)[]) => void;
  messagesUnchanged: boolean[];
  descriptionPlaceholders: string[];
}) {
  const selectedUseCase = USE_CASES.find((u) => u.value === campaign.useCase);
  const useCaseMissing = attempted && !campaign.useCase;
  const stopMentioned = campaign.messages.some((m) => /\bSTOP\b/i.test(m));
  const optInConfirmationPlaceholders = extractPlaceholders(campaign.optInConfirmation);
  const helpMessagePlaceholders = extractPlaceholders(campaign.helpMessage);
  const showFccWarning = campaign.useCase === "MARKETING" || campaign.useCase === "MIXED";

  function loadTemplate(i: number, templateIdx: number) {
    const tmpl = SAMPLE_TEMPLATES[i]?.[templateIdx] ?? "";
    setCampaign({ ...campaign, messages: campaign.messages.map((x, j) => (j === i ? tmpl : x)) });
    setLoadedTemplates(loadedTemplates.map((x, j) => (j === i ? tmpl : x)));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[10px] border border-[#ebedf0] bg-[#fafbfc] px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-white text-[#0d4b3a] ring-1 ring-[#ebedf0]">
            <IconInfoCircle size={14} stroke={2} />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-[#0a0d14]">
              Approval Is Decided By Carriers
            </div>
            <p className="mt-1 text-[12px] leading-[1.5] text-[#5b606a]">
              The Campaign Registry and mobile carriers review every campaign individually. The fields below describe the messaging program in the operator&apos;s own words. Guidance is informational. Approval cannot be guaranteed in advance.
            </p>
          </div>
        </div>
      </div>

      <Card
        title="Use Case"
        subtitle="The category that best matches how messages will be used. Sample messages must align with the chosen use case."
      >
        {selectedUseCase ? (
          <div className={["rounded-[10px] border bg-white p-5", useCaseMissing ? "border-[#fca5a5]" : "border-[#ebedf0]"].join(" ")}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#5b606a]">
                  Suggested For Surplus Recovery
                </div>
                <div className="mt-1.5 text-[18px] font-semibold tracking-[-0.014em] text-[#0a0d14]">
                  {selectedUseCase.label}
                </div>
                <p className="mt-2 text-[13px] leading-[1.55] text-[#5b606a]">{selectedUseCase.description}</p>
                <p className="mt-2 text-[11.5px] leading-[1.5] text-[#5b606a]">
                  Auto-suggested based on the registered industry. Change the selection if the actual messaging program does not match.
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
        ) : (
          <div className={["rounded-[10px] border bg-white p-5", useCaseMissing ? "border-[#fca5a5]" : "border-[#ebedf0]"].join(" ")}>
            <p className="text-[13px] leading-[1.55] text-[#5b606a]">
              Choose the category that matches the messaging program. Surplus recovery operators most commonly select Customer Care when outreach goes to identified parties of interest, but the right choice depends on the actual program.
            </p>
            <button
              type="button"
              onClick={() => setUseCaseOpen(true)}
              className="mt-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-4 text-[12.5px] font-medium text-white"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
            >
              Pick A Use Case
            </button>
          </div>
        )}

        {useCaseOpen && (
          <div className="mt-3 overflow-hidden rounded-[10px] border border-[#ebedf0] bg-white">
            <div className="divide-y divide-[#f1f2f4]">
              {USE_CASES.filter((u) => u.value !== campaign.useCase).map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => {
                    setCampaign({ ...campaign, useCase: u.value });
                    setUseCaseOpen(false);
                  }}
                  className="grid w-full cursor-pointer grid-cols-[160px_1fr] gap-3 px-4 py-3 text-left hover:bg-[#fafbfc]"
                >
                  <div className="text-[12.5px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{u.label}</div>
                  <p className="text-[12px] leading-[1.5] text-[#5b606a]">{u.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Campaign Description"
        subtitle="A starter template is loaded below. Replace every bracketed placeholder with details specific to the business before continuing. Carriers compare this against the sample messages to verify alignment."
      >
        <textarea
          value={campaign.description}
          onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
          rows={5}
          data-invalid={
            (attempted && !campaign.description.trim()) || descriptionPlaceholders.length > 0
              ? "true"
              : undefined
          }
          className={[
            "w-full rounded-[7px] border bg-white p-3 text-[13px] leading-[1.5] text-[#0a0d14] outline-none placeholder:text-[#9298a3]",
            (attempted && !campaign.description.trim()) || descriptionPlaceholders.length > 0
              ? "border-[#fca5a5] focus:border-[#b42318]"
              : "border-[#ebedf0] focus:border-[#0d4b3a]",
          ].join(" ")}
        />
        {descriptionPlaceholders.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[#b42318]">
            <span className="font-semibold">Replace before continuing:</span>
            {descriptionPlaceholders.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-[5px] border border-[#fca5a5] bg-white px-2 py-0.5 font-medium tabular-nums"
              >
                {p}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-3 text-[11.5px] text-[#5b606a]">
          <button
            type="button"
            onClick={() => setCampaign({ ...campaign, description: DESCRIPTION_TEMPLATE })}
            className="cursor-pointer font-medium text-[#0d4b3a] hover:text-[#13644e]"
          >
            Load Example Template
          </button>
          {campaign.description.length > 0 && (
            <button
              type="button"
              onClick={() => setCampaign({ ...campaign, description: "" })}
              className="cursor-pointer font-medium text-[#5b606a] hover:text-[#0a0d14]"
            >
              Clear Field
            </button>
          )}
        </div>
      </Card>

      <Card
        title="Monthly Volume"
        info={
          <>
            <div className="font-semibold text-[#0a0d14]">How Volume Affects Approval</div>
            <p className="mt-1 text-[#5b606a]">
              Volume tells carriers what throughput to expect. Picking too high triggers extra scrutiny; picking too low can result in throttling once active. Low covers most surplus recovery operators. Medium and High require justification in the campaign description.
            </p>
          </>
        }
      >
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

      <Card
        title="Sample Messages"
        subtitle="Three messages representative of the actual SMS the program will send. At least one must include the word STOP so carriers see the opt-out path. Load an example to start fast, then edit so the wording reflects this specific business. Identical templates submitted across operators are a common rejection reason."
      >
        {attempted && !stopMentioned && (
          <div
            data-invalid="true"
            className="mb-3 rounded-[7px] border border-[#fca5a5] bg-white px-3 py-2 text-[11.5px] font-medium text-[#b42318]"
          >
            No sample message currently contains the word STOP. At least one is required before continuing.
          </div>
        )}
        <div className="space-y-3">
          {campaign.messages.map((m, i) => {
            const empty = attempted && !m.trim();
            const unchanged = attempted && messagesUnchanged[i];
            const errored = empty || unchanged;
            const placeholder = SAMPLE_PLACEHOLDERS[i] ?? "";
            const templates = SAMPLE_TEMPLATES[i] ?? [];
            return (
              <div
                key={i}
                data-invalid={errored ? "true" : undefined}
                className={[
                  "rounded-[10px] border bg-white p-3.5",
                  errored ? "border-[#fca5a5]" : "border-[#ebedf0]",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#0a0d14]">
                      {SAMPLE_LABELS[i]?.title ?? `Message ${i + 1}`}
                    </span>
                    <span className="text-[10.5px] text-[#9298a3]">{SAMPLE_LABELS[i]?.subtitle ?? ""}</span>
                    {templates.map((_, j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => loadTemplate(i, j)}
                        className="cursor-pointer text-[11px] font-medium text-[#0d4b3a] hover:text-[#13644e]"
                      >
                        Load Example {j + 1}
                      </button>
                    ))}
                    {m.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCampaign({ ...campaign, messages: campaign.messages.map((x, j) => (j === i ? "" : x)) });
                          setLoadedTemplates(loadedTemplates.map((x, j) => (j === i ? null : x)));
                        }}
                        className="cursor-pointer text-[11px] font-medium text-[#5b606a] hover:text-[#0a0d14]"
                      >
                        Clear Field
                      </button>
                    )}
                  </div>
                  <span className="text-[10.5px] text-[#9298a3]">{m.length} / 160</span>
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
                  placeholder={placeholder}
                  className="w-full resize-none border-0 bg-transparent p-0 text-[13px] leading-[1.45] text-[#0a0d14] outline-none placeholder:text-[#9298a3]"
                />
                {unchanged && (
                  <div className="mt-2 text-[11.5px] font-medium text-[#b42318]">
                    Edit this message before continuing. Submitting an unedited example will be flagged by carriers as boilerplate.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        title="Opt-In Confirmation Message"
        subtitle="The single message sent automatically to a recipient the moment they opt in. Carriers compare this against the opt-in flow URL and reject submissions where the confirmation does not match the consent that was given. 160 character limit."
      >
        <textarea
          value={campaign.optInConfirmation}
          onChange={(e) => setCampaign({ ...campaign, optInConfirmation: e.target.value })}
          rows={2}
          maxLength={160}
          data-invalid={
            (attempted && (!campaign.optInConfirmation.trim() || optInConfirmationPlaceholders.length > 0))
              ? "true"
              : undefined
          }
          className={[
            "w-full rounded-[7px] border bg-white p-3 text-[13px] leading-[1.5] text-[#0a0d14] outline-none",
            (attempted && !campaign.optInConfirmation.trim()) || optInConfirmationPlaceholders.length > 0
              ? "border-[#fca5a5] focus:border-[#b42318]"
              : "border-[#ebedf0] focus:border-[#0d4b3a]",
          ].join(" ")}
        />
        <div className="mt-1 flex items-center justify-between text-[10.5px] text-[#9298a3]">
          <span>{campaign.optInConfirmation.length} / 160</span>
        </div>
        {optInConfirmationPlaceholders.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[#b42318]">
            <span className="font-semibold">Replace before continuing:</span>
            {optInConfirmationPlaceholders.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-[5px] border border-[#fca5a5] bg-white px-2 py-0.5 font-medium tabular-nums"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="HELP Reply Message"
        subtitle="The reply sent automatically when a recipient texts HELP. Must include the brand name, support contact, and instructions to opt back in. Required by CTIA guidelines and reviewed by carriers."
      >
        <textarea
          value={campaign.helpMessage}
          onChange={(e) => setCampaign({ ...campaign, helpMessage: e.target.value })}
          rows={2}
          maxLength={160}
          data-invalid={
            (attempted && (!campaign.helpMessage.trim() || helpMessagePlaceholders.length > 0))
              ? "true"
              : undefined
          }
          className={[
            "w-full rounded-[7px] border bg-white p-3 text-[13px] leading-[1.5] text-[#0a0d14] outline-none",
            (attempted && !campaign.helpMessage.trim()) || helpMessagePlaceholders.length > 0
              ? "border-[#fca5a5] focus:border-[#b42318]"
              : "border-[#ebedf0] focus:border-[#0d4b3a]",
          ].join(" ")}
        />
        <div className="mt-1 flex items-center justify-between text-[10.5px] text-[#9298a3]">
          <span>{campaign.helpMessage.length} / 160</span>
        </div>
        {helpMessagePlaceholders.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-[#b42318]">
            <span className="font-semibold">Replace before continuing:</span>
            {helpMessagePlaceholders.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-[5px] border border-[#fca5a5] bg-white px-2 py-0.5 font-medium tabular-nums"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </Card>

      {showFccWarning && (
        <div className="flex items-start gap-3 rounded-[10px] border border-[#fca5a5] bg-white px-5 py-4">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-white text-[#b42318] ring-1 ring-[#fca5a5]">
            <IconAlertTriangle size={14} stroke={2.25} />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-[#0a0d14]">
              FCC One-To-One Consent Rule Applies
            </div>
            <p className="mt-1 text-[12px] leading-[1.5] text-[#5b606a]">
              As of January 27, 2026, the FCC requires recipients of Marketing and Mixed use case messages to give consent individually for each specific seller. Blanket consent for affiliated companies is no longer valid. The Opt-In Flow URL above must show consent collected for this brand specifically, not for a parent company, lead generation marketplace, or affiliated network. Misalignment is a top rejection reason in 2026.
            </p>
          </div>
        </div>
      )}
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
          <ReviewItem label="Terms Of Service" value={brand.termsUrl} />
          <ReviewItem label="Opt-In Flow URL" value={brand.optInUrl || "Missing"} missing={!brand.optInUrl} />
          <ReviewItem label="Authorized Rep" value={brand.repName || "Missing"} missing={!brand.repName} />
          <ReviewItem label="Rep Title" value={brand.repTitle || "Missing"} missing={!brand.repTitle} />
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
          <ReviewItem label="Opt-In Confirmation" value={campaign.optInConfirmation} wide />
          <ReviewItem label="HELP Reply" value={campaign.helpMessage} wide />
        </ReviewGrid>
      </Card>

      <FeeRow />
    </div>
  );
}

function FeeRow() {
  return (
    <div
      className="rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="px-6 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <div className="text-[14.5px] font-semibold tracking-[-0.012em] text-[#0a0d14]">
            Carrier Verification Fee
          </div>
          <div className="text-[16px] font-semibold tabular-nums text-[#0a0d14]">$19.50</div>
        </div>
        <p className="mt-2 text-[12.5px] leading-[1.55] text-[#5b606a]">
          The Campaign Registry, an industry body operated by the major US mobile carriers, administers brand verification on behalf of the wireless industry. The fee passes through at cost with no markup and is identical at every messaging provider. Verification completes within 1 to 2 business days. Carrier review of the campaign follows for 1 to 3 weeks before SMS is enabled across registered numbers.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[10px] border border-[#ebedf0] bg-[#fafbfc] p-3.5">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-[7px] w-[7px] rounded-full"
                style={{ background: "#0d4b3a", boxShadow: "0 0 0 3px rgba(13,75,58,0.14)" }}
              />
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">
                Free Resubmission
              </div>
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-[#0a0d14]">
              If the campaign is rejected, edit any of the following and resubmit at no charge:
            </p>
            <ul className="mt-1.5 space-y-0.5 text-[12px] leading-[1.5] text-[#5b606a]">
              <li>Campaign description</li>
              <li>Sample messages</li>
              <li>Use case</li>
              <li>Monthly volume</li>
              <li>Authorized representative contact info</li>
              <li>Privacy policy or terms URL</li>
              <li>Address</li>
            </ul>
          </div>

          <div className="rounded-[10px] border border-[#ebedf0] bg-[#fafbfc] p-3.5">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-[7px] w-[7px] rounded-full"
                style={{ background: "#b42318", boxShadow: "0 0 0 3px rgba(180,35,24,0.14)" }}
              />
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b42318]">
                Triggers New $19.50 Fee
              </div>
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-[#0a0d14]">
              Editing any of these registers a new brand and starts the verification cycle over:
            </p>
            <ul className="mt-1.5 space-y-0.5 text-[12px] leading-[1.5] text-[#5b606a]">
              <li>Entity Type</li>
              <li>Legal Name</li>
              <li>EIN</li>
            </ul>
            <p className="mt-1.5 text-[11px] leading-[1.5] text-[#5b606a]">
              These three fields lock after submission and require an explicit confirmation to change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Success ────────────────────────────────────────────────────
function Step4Success({ repEmail }: { repEmail: string }) {
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
                The submission record and tracking link were sent to {repEmail || "the authorized representative email on file"}.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Link
          href="/share/phone-numbers-approved?v=6"
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-5 text-[13px] font-medium text-white"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
        >
          View Phone Numbers Settings
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

// ─── Reference Panel (side column) ─────────────────────────────────────
function stepHelpFor(step: Step) {
  if (step === 1) {
    return (
      <ReferencePanel
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
      <ReferencePanel
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
    <ReferencePanel
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

function ReferencePanel({
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
          Carrier Notes
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
function Card({
  title,
  subtitle,
  info,
  children,
}: {
  title: string;
  subtitle?: string;
  info?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] border border-[#ebedf0] bg-white"
      style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
    >
      <div className="border-b border-[#f1f2f4] px-6 py-4">
        <div className="flex items-center gap-1.5">
          <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{title}</div>
          {info && <InfoButton>{info}</InfoButton>}
        </div>
        {subtitle && <div className="mt-1 text-[12px] leading-[1.5] text-[#5b606a]">{subtitle}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function InfoButton({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More information"
        className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-[#9298a3] hover:text-[#0d4b3a]"
      >
        <IconInfoCircle size={14} stroke={2} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-6 w-[280px] rounded-[10px] border border-[#ebedf0] bg-white p-3.5 text-[12px] leading-[1.5] text-[#0a0d14]"
          style={{ boxShadow: "0 8px 28px -10px rgba(12,13,16,0.15)", zIndex: 100 }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5 gap-y-4">{children}</div>;
}

function EinField({
  value,
  onChange,
  attempted,
}: {
  value: string;
  onChange: (v: string) => void;
  attempted?: boolean;
}) {
  const validFormat = /^\d{2}-\d{7}$/.test(value.trim());
  const empty = attempted && !value.trim();
  const wrongFormat = attempted && value.trim().length > 0 && !validFormat;
  const errored = empty || wrongFormat;

  // Auto-format: strip non-digits, insert dash after 2 digits, cap at 9 digits total.
  function format(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">
          EIN
          <span className="ml-1 text-[#b42318]">*</span>
        </label>
        <InfoButton>
          <div className="font-semibold text-[#0a0d14]">EIN Requirements</div>
          <p className="mt-1 text-[#5b606a]">
            The Employer Identification Number is a nine-digit federal tax ID issued by the IRS, formatted as XX-XXXXXXX.
          </p>
          <p className="mt-2 text-[#5b606a]">
            The Campaign Registry requires the EIN to be at least 15 days old at the time of submission. EINs are verified against IRS records, which update on a delay. Newly issued numbers are rejected as unverifiable.
          </p>
        </InfoButton>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(format(e.target.value))}
        placeholder="12-3456789"
        inputMode="numeric"
        maxLength={10}
        data-invalid={errored ? "true" : undefined}
        className={[
          "mt-1.5 h-[38px] w-full rounded-[7px] border bg-white px-3 text-[13px] text-[#0a0d14] outline-none placeholder:text-[#9298a3] tabular-nums",
          errored ? "border-[#fca5a5] focus:border-[#b42318]" : "border-[#ebedf0] focus:border-[#0d4b3a]",
        ].join(" ")}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  attempted,
  type,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  attempted?: boolean;
  type?: "text" | "email" | "tel" | "url";
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
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
        pattern={type === "tel" ? "[+0-9() \\-]*" : undefined}
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
  info,
  required,
  attempted,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  info?: React.ReactNode;
  required?: boolean;
  attempted?: boolean;
  wide?: boolean;
}) {
  const errored = required && attempted && !value;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">
          {label}
          {required && <span className="ml-1 text-[#b42318]">*</span>}
        </label>
        {info && <InfoButton>{info}</InfoButton>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-invalid={errored ? "true" : undefined}
        className={[
          "mt-1.5 h-[38px] w-full cursor-pointer rounded-[7px] border bg-white px-3 text-[13px] text-[#0a0d14] outline-none",
          errored ? "border-[#fca5a5] focus:border-[#b42318]" : "border-[#ebedf0] focus:border-[#0d4b3a]",
        ].join(" ")}
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
}: {
  step: Step;
  onBack: () => void;
  onNext: () => void;
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
        className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[13.5px] font-medium text-white"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
      >
        {step === 1 ? "Continue To Campaign" : step === 2 ? "Continue To Review" : "Submit Registration"}
        {step === 3 ? <IconArrowRight size={13} stroke={2.25} /> : <IconChevronRight size={13} stroke={2.25} />}
      </button>
    </div>
  );
}

// ─── Brand Identity Change Confirmation ─────────────────────────────────
// Hit at /share/a2p-wizard-final?action=rebrand-confirm
// Shown when the operator tries to edit Entity Type, Legal Name, or EIN
// on an already-submitted brand. These three fields lock after
// submission. Editing any one of them registers a new brand and starts
// the verification cycle over, which costs another $40.
function BrandIdentityChangeConfirm() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div>
      <div
        className="border-b border-[#04261c]"
        style={{ background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)" }}
      >
        <div className="mx-auto max-w-[760px] px-10 py-12">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <IconShieldCheck size={13} stroke={2.25} />
            Brand Identity Change
          </div>
          <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.022em] text-white">
            This Edit Registers A New Brand
          </h1>
          <p className="mt-3 max-w-[58ch] text-[14px] leading-[1.55] text-white/75">
            The Campaign Registry treats any change to Entity Type, Legal Name, or EIN as a separate brand. The original approved brand remains registered with TCR. A separate new brand is then created with the updated identity, which restarts verification and incurs a new fee.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[760px] px-10 pb-20 pt-9 space-y-5">
        <div
          className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="border-b border-[#f1f2f4] px-6 py-4">
            <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">What Is Changing</div>
          </div>
          <div className="divide-y divide-[#f1f2f4]">
            <ChangeRow field="EIN" from="12-3456789" to="12-3456788" />
            <ChangeRow field="Legal Name" from="Workflow Minds LLC" to="(unchanged)" muted />
            <ChangeRow field="Entity Type" from="Private For-Profit Company" to="(unchanged)" muted />
          </div>
        </div>

        <div
          className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="border-b border-[#f1f2f4] px-6 py-4">
            <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">What This Costs</div>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-[13.5px] font-semibold text-[#0a0d14]">New Carrier Verification Fee</div>
              <div className="text-[18px] font-semibold tabular-nums text-[#0a0d14]">$19.50</div>
            </div>
            <p className="mt-2 text-[12.5px] leading-[1.55] text-[#5b606a]">
              Charged at submission of the updated brand. Set by The Campaign Registry, passes through at cost. The original brand remains registered with TCR and its fee is not refundable.
            </p>
          </div>
        </div>

        <div
          className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="border-b border-[#f1f2f4] px-6 py-4">
            <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">What Happens Next</div>
          </div>
          <div className="space-y-3 px-6 py-5">
            <NextStep
              icon={<IconShieldCheck size={14} stroke={2.25} />}
              title="Brand Verification Restarts"
              when="1 To 2 Business Days"
              desc="The Campaign Registry verifies the new legal entity, EIN, address, and authorized representative against IRS and state records."
            />
            <NextStep
              icon={<IconClock size={14} stroke={2.25} />}
              title="Campaign Carries Over"
              when="No Additional Carrier Review"
              desc="The campaign description, use case, and sample messages stay attached to the new brand without re-review by carriers."
            />
            <NextStep
              icon={<IconCheck size={14} stroke={2.25} />}
              title="SMS Pauses Then Resumes"
              when="Once The New Brand Verifies"
              desc="SMS sending pauses on the affected numbers during verification. It resumes automatically when the new brand is approved."
            />
          </div>
        </div>

        <div
          className="overflow-hidden rounded-[14px] border-[#fca5a5] bg-white"
          style={{ borderWidth: 1, boxShadow: "0 1px 2px rgba(180,35,24,0.06)" }}
        >
          <div className="px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-white text-[#b42318] ring-1 ring-[#fca5a5]">
                <IconAlertTriangle size={14} stroke={2.25} />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#0a0d14]">No Refund For The Existing Brand</div>
                <p className="mt-1 text-[12.5px] leading-[1.55] text-[#5b606a]">
                  The previous brand stays in The Campaign Registry permanently. If this change was made by mistake, cancel below to keep the existing brand and avoid the new fee. There is no recovery path once the new brand is submitted.
                </p>
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[1.5] text-[#0a0d14]">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[#0d4b3a]"
              />
              <span>
                I understand that this edit registers a new brand, incurs a new $40 verification fee, and that the original brand and its fee are not refunded.
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            href="/share/phone-numbers-approved?v=6"
            className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-[7px] border border-[#ebedf0] bg-white px-4 text-[13px] font-medium text-[#0a0d14] hover:border-[#0d4b3a]"
          >
            <IconChevronLeft size={12} stroke={2.25} />
            Cancel And Keep Existing Brand
          </Link>
          <button
            type="button"
            disabled={!acknowledged}
            className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#b42318] px-5 text-[13.5px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            style={
              acknowledged
                ? { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(180,35,24,0.20), 0 6px 16px -4px rgba(180,35,24,0.30)" }
                : undefined
            }
          >
            Register New Brand And Pay $19.50
            <IconArrowRight size={13} stroke={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangeRow({ field, from, to, muted }: { field: string; from: string; to: string; muted?: boolean }) {
  return (
    <div className="grid grid-cols-[160px_1fr_1fr] items-center gap-4 px-6 py-3.5">
      <div className={["text-[10.5px] font-semibold uppercase tracking-[0.08em]", muted ? "text-[#9298a3]" : "text-[#b42318]"].join(" ")}>
        {field}
        {!muted && <IconLock size={10} stroke={2.25} className="ml-1 inline" />}
      </div>
      <div className={["text-[12.5px]", muted ? "text-[#9298a3]" : "text-[#5b606a] line-through"].join(" ")}>{from}</div>
      <div className={["text-[12.5px] font-semibold", muted ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>{to}</div>
    </div>
  );
}

function NextStep({ icon, title, when, desc }: { icon: React.ReactNode; title: string; when: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[10px] border border-[#f1f2f4] p-3.5">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#0d4b3a] ring-1 ring-[#ebedf0]">
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
