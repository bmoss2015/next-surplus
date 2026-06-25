"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  IconCheck,
  IconChevronRight,
  IconSparkles,
  IconBuilding,
  IconMessage2,
  IconShieldCheck,
  IconLock,
  IconArrowRight,
  IconCircleCheck,
  IconCircleDashed,
} from "@tabler/icons-react";

type V = "1" | "2" | "3" | "4" | "5";

export default function A2pWizardMockup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafbfc]" />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const sp = useSearchParams();
  const v: V = (["1", "2", "3", "4", "5"].includes(sp.get("v") ?? "") ? (sp.get("v") as V) : "1");

  if (v === "1") return <V1DarkHero />;
  if (v === "2") return <V2SidebarRail />;
  if (v === "3") return <V3CardStack />;
  if (v === "4") return <V4SplitPreview />;
  return <V5BrandedForm />;
}

// ───────────────────────────────────────────────────────────────
// V1 — Dark Hero Banner Wizard
// Petrol gradient hero at the top, white form card below
// ───────────────────────────────────────────────────────────────
function V1DarkHero() {
  return (
    <div>
      <div
        className="border-b border-[#04261c]"
        style={{
          background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)",
        }}
      >
        <div className="mx-auto max-w-[920px] px-10 py-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <IconShieldCheck size={13} stroke={2.25} />
            Step 1 Of 3
          </div>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.024em] text-white">
            Verify Your Brand
          </h1>
          <p className="mt-3 max-w-[58ch] text-[14px] leading-[1.55] text-white/70">
            We&apos;ve pre-filled what we know from your Company Profile. Skim, fix anything that looks off, and continue.
          </p>

          <div className="mt-7 flex items-center gap-3">
            <StepPill n={1} label="Brand" active />
            <span className="h-px w-12 bg-white/20" />
            <StepPill n={2} label="Campaign" />
            <span className="h-px w-12 bg-white/20" />
            <StepPill n={3} label="Review" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[920px] px-10 py-8">
        <PreFillCallout count={11} />

        <div
          className="mt-6 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="px-7 py-6">
            <SectionHeading icon={<IconBuilding size={14} stroke={2.25} />} title="Company" sub="The legal entity carriers will register" />
            <FieldGrid>
              <Field label="Legal Name" value="Workflow Minds LLC" />
              <Field label="EIN" value="" placeholder="12-3456789" needsAttention />
              <Field label="Vertical" value="Financial Services" />
              <Field label="Website" value="https://nextsurplus.com" />
            </FieldGrid>
          </div>
          <div className="border-t border-[#f1f2f4] px-7 py-6">
            <SectionHeading icon={<IconLock size={14} stroke={2.25} />} title="Authorized Representative" sub="Carrier verifications go to this person" />
            <FieldGrid>
              <Field label="Name" value="Bree Moss" />
              <Field label="Email" value="bree@nextsurplus.com" />
              <Field label="Phone" value="+1 (432) 400-5579" />
            </FieldGrid>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button type="button" className="cursor-pointer text-[12.5px] font-medium text-[#5b606a] hover:text-[#0d4b3a]">Save Draft And Exit</button>
          <button
            type="button"
            className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[13.5px] font-medium text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            Continue To Campaign
            <IconChevronRight size={13} stroke={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepPill({ n, label, active }: { n: number; label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={[
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold",
          active ? "bg-white text-[#0d4b3a]" : "bg-white/10 text-white/70",
        ].join(" ")}
        style={{ boxShadow: active ? "0 0 0 4px rgba(255,255,255,0.15)" : undefined }}
      >
        {n}
      </span>
      <span className={["text-[12.5px] font-medium", active ? "text-white" : "text-white/60"].join(" ")}>{label}</span>
    </div>
  );
}

function PreFillCallout({ count }: { count: number }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-[14px] border border-[#0d4b3a]/20 bg-white px-5 py-4"
      style={{ boxShadow: "0 0 0 4px rgba(13,75,58,0.05)" }}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0d4b3a] text-white">
          <IconSparkles size={16} stroke={2.25} />
        </span>
        <div>
          <div className="text-[13.5px] font-semibold tracking-[-0.012em] text-[#0a0d14]">
            We Pre-Filled {count} Fields
          </div>
          <div className="mt-0.5 text-[12px] text-[#5b606a]">Pulled from your Company Profile so you barely have to type</div>
        </div>
      </div>
      <span className="text-[12px] font-medium text-[#0d4b3a]">Review Below &rarr;</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// V2 — Sidebar Rail Wizard
// Persistent left rail with step descriptions, content on the right
// ───────────────────────────────────────────────────────────────
function V2SidebarRail() {
  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-[280px_1fr] gap-0 px-0">
      <aside
        className="border-r border-[#ebedf0] bg-white px-7 pb-12 pt-10"
        style={{ minHeight: "calc(100vh - 49px)" }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">SMS Approval</div>
        <h2 className="mt-2 text-[20px] font-semibold leading-[1.2] tracking-[-0.018em] text-[#0a0d14]">
          A2P 10DLC Registration
        </h2>
        <p className="mt-2 text-[12px] leading-[1.55] text-[#5b606a]">
          Three short steps. Carriers approve in 1 to 3 weeks.
        </p>

        <div className="mt-8 space-y-1">
          <RailStep n={1} active title="Verify Brand" desc="Company details, authorized rep, EIN" status="active" />
          <RailStep n={2} title="Build Campaign" desc="Use case, sample messages, opt-in" status="todo" />
          <RailStep n={3} title="Review And Submit" desc="Sign off, pay vetting fee" status="todo" />
        </div>

        <div className="mt-10 rounded-[10px] bg-[#fafbfc] p-3.5">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">
            <IconShieldCheck size={11} stroke={2.25} />
            Bank-Level Encryption
          </div>
          <p className="mt-1.5 text-[11.5px] leading-[1.5] text-[#5b606a]">
            Your EIN and ID details are encrypted end-to-end and only shared with The Campaign Registry.
          </p>
        </div>
      </aside>

      <main className="px-10 pb-16 pt-10">
        <div className="text-[12px] text-[#9298a3]">Step 1 Of 3</div>
        <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] text-[#0a0d14]">
          Verify Your Brand
        </h1>
        <p className="mt-2 max-w-[60ch] text-[13.5px] leading-[1.55] text-[#5b606a]">
          Carriers need a verified legal entity behind every SMS campaign. We&apos;ve started with the basics from your Company Profile.
        </p>

        <PreFillStrip count={11} />

        <FormCard title="Company" icon={<IconBuilding size={14} stroke={2.25} />}>
          <Field label="Legal Name" value="Workflow Minds LLC" />
          <Field label="EIN" value="" needsAttention placeholder="Required" />
          <Field label="Vertical" value="Financial Services" />
          <Field label="Website" value="https://nextsurplus.com" />
        </FormCard>

        <FormCard title="Authorized Representative" icon={<IconLock size={14} stroke={2.25} />}>
          <Field label="Name" value="Bree Moss" />
          <Field label="Email" value="bree@nextsurplus.com" />
          <Field label="Phone" value="+1 (432) 400-5579" />
        </FormCard>

        <NavRow />
      </main>
    </div>
  );
}

function RailStep({ n, title, desc, status, active }: { n: number; title: string; desc: string; status: "done" | "active" | "todo"; active?: boolean }) {
  return (
    <div className={["flex items-start gap-3 rounded-[10px] px-3 py-2.5", active ? "bg-[#0d4b3a]/[0.04]" : ""].join(" ")}>
      <span
        className={[
          "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold",
          status === "done" ? "bg-[#0d4b3a] text-white" : status === "active" ? "bg-white text-[#0d4b3a]" : "bg-white text-[#9298a3]",
        ].join(" ")}
        style={{ border: status === "active" ? "2px solid #0d4b3a" : "1px solid #ebedf0" }}
      >
        {status === "done" ? <IconCheck size={11} stroke={3} /> : n}
      </span>
      <div className="min-w-0">
        <div className={["text-[12.5px] font-semibold", status === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
          {title}
        </div>
        <div className="mt-0.5 text-[11px] leading-[1.45] text-[#5b606a]">{desc}</div>
      </div>
    </div>
  );
}

function PreFillStrip({ count }: { count: number }) {
  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#0d4b3a]/20 bg-[#0d4b3a]/[0.04] px-3 py-1.5 text-[11.5px] font-medium text-[#0d4b3a]">
      <IconSparkles size={11} stroke={2.5} />
      {count} Fields Pre-Filled From Company Profile
    </div>
  );
}

function FormCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-5 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white" style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}>
      <div className="border-b border-[#f1f2f4] px-6 py-4">
        <SectionHeading icon={icon} title={title} />
      </div>
      <div className="px-6 py-5">
        <FieldGrid>{children}</FieldGrid>
      </div>
    </div>
  );
}

function NavRow() {
  return (
    <div className="mt-7 flex items-center justify-between">
      <button type="button" className="cursor-pointer text-[12.5px] font-medium text-[#5b606a] hover:text-[#0d4b3a]">Save Draft</button>
      <button
        type="button"
        className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-6 text-[13.5px] font-medium text-white"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
      >
        Continue To Campaign
        <IconChevronRight size={13} stroke={2.25} />
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// V3 — Card Stack Wizard (Stripe/Linear style accordion)
// All steps visible. Active step expands. Completed steps collapse with summary
// ───────────────────────────────────────────────────────────────
function V3CardStack() {
  return (
    <div className="mx-auto max-w-[760px] px-8 pb-20 pt-10">
      <div className="text-[12px] text-[#9298a3]">Settings &middot; SMS Approval</div>
      <h1 className="mt-2 text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] text-[#0a0d14]">
        Get SMS Approved
      </h1>
      <p className="mt-3 max-w-[58ch] text-[13.5px] leading-[1.55] text-[#5b606a]">
        We&apos;ve done as much as we can for you. Three short steps, mostly pre-filled.
      </p>

      <CollapsibleStep n={1} title="Verify Brand" subtitle="Workflow Minds LLC — pre-filled from Company Profile" state="active">
        <PreFillStrip count={11} />
        <FieldGrid>
          <Field label="Legal Name" value="Workflow Minds LLC" />
          <Field label="EIN" value="" needsAttention placeholder="Required" />
          <Field label="Vertical" value="Financial Services" />
          <Field label="Website" value="https://nextsurplus.com" />
          <Field label="Authorized Rep" value="Bree Moss" />
          <Field label="Rep Email" value="bree@nextsurplus.com" />
        </FieldGrid>
        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-[7px] bg-[#0d4b3a] px-5 text-[13px] font-medium text-white"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
          >
            Continue
            <IconArrowRight size={13} stroke={2.25} />
          </button>
        </div>
      </CollapsibleStep>

      <CollapsibleStep n={2} title="Build Campaign" subtitle="Customer Care, 3 sample messages, low volume" state="todo" />
      <CollapsibleStep n={3} title="Review And Submit" subtitle="Sign off and pay $40 vetting fee" state="todo" />
    </div>
  );
}

function CollapsibleStep({
  n,
  title,
  subtitle,
  state,
  children,
}: {
  n: number;
  title: string;
  subtitle: string;
  state: "done" | "active" | "todo";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={[
        "mt-4 overflow-hidden rounded-[14px] border bg-white",
        state === "active" ? "border-[#0d4b3a]" : "border-[#ebedf0]",
      ].join(" ")}
      style={{
        boxShadow: state === "active" ? "0 8px 28px -12px rgba(13,75,58,0.18)" : "0 1px 2px rgba(12,13,16,0.02)",
      }}
    >
      <div className="flex items-center gap-3 px-6 py-4">
        <span
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold",
            state === "done" ? "bg-[#0d4b3a] text-white" : state === "active" ? "bg-[#0d4b3a] text-white" : "bg-white text-[#9298a3]",
          ].join(" ")}
          style={{ border: state === "todo" ? "1px solid #ebedf0" : undefined }}
        >
          {state === "done" ? <IconCheck size={14} stroke={3} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <div className={["text-[15px] font-semibold tracking-[-0.012em]", state === "todo" ? "text-[#5b606a]" : "text-[#0a0d14]"].join(" ")}>{title}</div>
          <div className="mt-0.5 text-[12px] text-[#5b606a]">{subtitle}</div>
        </div>
        {state === "todo" && <IconCircleDashed size={16} stroke={1.8} className="text-[#c2c5cc]" />}
        {state === "done" && <IconCircleCheck size={16} stroke={2} className="text-[#0d4b3a]" />}
      </div>
      {children && <div className="border-t border-[#f1f2f4] px-6 pb-6 pt-5">{children}</div>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// V4 — Split View With Live TCR Preview
// Form on the left, what carriers will see on the right
// ───────────────────────────────────────────────────────────────
function V4SplitPreview() {
  return (
    <div className="mx-auto max-w-[1240px] px-10 pb-16 pt-10">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[12px] text-[#9298a3]">Step 1 Of 3 &middot; A2P 10DLC Registration</div>
          <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] text-[#0a0d14]">
            Verify Your Brand
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Pill state="active">Step 1</Pill>
          <Pill>Step 2</Pill>
          <Pill>Step 3</Pill>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[1.4fr_1fr] gap-6">
        <div
          className="overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
          style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
        >
          <div className="border-b border-[#f1f2f4] bg-[#fafbfc] px-7 py-3.5">
            <SectionHeading icon={<IconBuilding size={14} stroke={2.25} />} title="Company Details" />
          </div>
          <div className="space-y-4 px-7 py-5">
            <PreFillStrip count={11} />
            <FieldGrid>
              <Field label="Legal Name" value="Workflow Minds LLC" />
              <Field label="EIN" value="" needsAttention placeholder="Required" />
              <Field label="Vertical" value="Financial Services" />
              <Field label="Website" value="https://nextsurplus.com" />
              <Field label="Rep Name" value="Bree Moss" />
              <Field label="Rep Email" value="bree@nextsurplus.com" />
            </FieldGrid>
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="overflow-hidden rounded-[14px] border border-[#0d4b3a]"
            style={{
              background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 100%)",
              boxShadow: "0 8px 24px -10px rgba(13,75,58,0.45)",
            }}
          >
            <div className="px-6 py-4 text-white">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-white/60">
                Live Preview
              </div>
              <div className="mt-0.5 text-[12px] text-white/70">What The Campaign Registry will see</div>
            </div>
            <div className="bg-white px-6 py-5 text-[#0a0d14]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9298a3]">Brand Submission</div>
              <PreviewLine label="Legal Name" value="Workflow Minds LLC" />
              <PreviewLine label="EIN" value="(Required)" warn />
              <PreviewLine label="Vertical" value="Financial Services" />
              <PreviewLine label="Website" value="nextsurplus.com" />
              <PreviewLine label="Rep" value="Bree Moss" />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#ebedf0] bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <IconShieldCheck size={14} stroke={2.25} className="text-[#0d4b3a]" />
              <div className="text-[12.5px] font-semibold text-[#0a0d14]">Standard Vetting, $40</div>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-[1.5] text-[#5b606a]">
              Charged on submit. Approved within 1 to 2 business days.
            </p>
          </div>
        </div>
      </div>

      <NavRow />
    </div>
  );
}

function Pill({ children, state }: { children: React.ReactNode; state?: "active" }) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-full px-3 text-[11.5px] font-medium",
        state === "active" ? "bg-[#0d4b3a] text-white" : "bg-white text-[#5b606a] border border-[#ebedf0]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function PreviewLine({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="mt-3 flex items-baseline justify-between gap-3 border-b border-[#f1f2f4] pb-2 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.06em] text-[#9298a3]">{label}</span>
      <span className={["text-[12.5px] font-medium tabular-nums", warn ? "text-[#b42318]" : "text-[#0a0d14]"].join(" ")}>{value}</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// V5 — Branded Form With Inline Help Cards
// Cleanest form treatment, with petrol accent strip + helpful sidebars
// ───────────────────────────────────────────────────────────────
function V5BrandedForm() {
  return (
    <div className="mx-auto max-w-[920px] px-10 pb-16 pt-10">
      <div
        className="relative overflow-hidden rounded-[14px] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0a3d2c 0%, #0d4b3a 50%, #13644e 100%)" }} />

        <div className="px-9 py-9">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.10em] text-[#0d4b3a]">
                <IconMessage2 size={12} stroke={2.25} />
                A2P 10DLC Registration
              </div>
              <h1 className="mt-2 text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] text-[#0a0d14]">
                Verify Your Brand
              </h1>
              <p className="mt-2 max-w-[58ch] text-[13.5px] leading-[1.55] text-[#5b606a]">
                Step 1 of 3. We pre-filled what we could from your Company Profile.
              </p>
            </div>
            <div
              className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full md:inline-flex"
              style={{
                background: "linear-gradient(135deg, #0a3d2c 0%, #0d4b3a 100%)",
                boxShadow: "0 0 0 8px rgba(13,75,58,0.08)",
              }}
            >
              <IconShieldCheck size={28} stroke={1.75} className="text-white" />
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <ProgressBubble n={1} done={false} active />
            <ProgressLine />
            <ProgressBubble n={2} done={false} />
            <ProgressLine />
            <ProgressBubble n={3} done={false} />
          </div>

          <div className="mt-8 grid grid-cols-[1fr_240px] gap-7">
            <div className="space-y-6">
              <div>
                <SectionHeading icon={<IconBuilding size={14} stroke={2.25} />} title="Company" />
                <FieldGrid className="mt-3">
                  <Field label="Legal Name" value="Workflow Minds LLC" />
                  <Field label="EIN" value="" needsAttention placeholder="Required" />
                  <Field label="Vertical" value="Financial Services" />
                  <Field label="Website" value="https://nextsurplus.com" />
                </FieldGrid>
              </div>
              <div>
                <SectionHeading icon={<IconLock size={14} stroke={2.25} />} title="Authorized Representative" />
                <FieldGrid className="mt-3">
                  <Field label="Name" value="Bree Moss" />
                  <Field label="Email" value="bree@nextsurplus.com" />
                  <Field label="Phone" value="+1 (432) 400-5579" wide />
                </FieldGrid>
              </div>
            </div>

            <aside className="space-y-3">
              <HelpCard
                title="What Carriers Check"
                points={["Legal entity is verifiable", "EIN matches IRS records", "Authorized rep is reachable"]}
              />
              <HelpCard
                title="Common Denial Reasons"
                points={["EIN typo", "Industry vertical mismatch", "Website missing privacy policy"]}
              />
            </aside>
          </div>

          <NavRow />
        </div>
      </div>
    </div>
  );
}

function ProgressBubble({ n, active, done }: { n: number; active?: boolean; done?: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold",
        done ? "bg-[#0d4b3a] text-white" : active ? "bg-[#0d4b3a] text-white" : "bg-white text-[#9298a3] border border-[#ebedf0]",
      ].join(" ")}
      style={{ boxShadow: active ? "0 0 0 5px rgba(13,75,58,0.12)" : undefined }}
    >
      {done ? <IconCheck size={14} stroke={3} /> : n}
    </span>
  );
}

function ProgressLine() {
  return <span className="h-px flex-1 bg-[#ebedf0]" />;
}

function HelpCard({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-[10px] border border-[#ebedf0] bg-[#fafbfc] px-3.5 py-3">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#0d4b3a]">{title}</div>
      <ul className="mt-2 space-y-1.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-1.5 text-[11.5px] leading-[1.45] text-[#5b606a]">
            <IconCheck size={11} stroke={2.5} className="mt-0.5 shrink-0 text-[#0d4b3a]" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Shared building blocks
// ───────────────────────────────────────────────────────────────
function SectionHeading({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#0d4b3a]/[0.08] text-[#0d4b3a]">
          {icon}
        </span>
        <div className="text-[14px] font-semibold tracking-[-0.012em] text-[#0a0d14]">{title}</div>
      </div>
      {sub && <div className="mt-1 text-[12px] text-[#5b606a]">{sub}</div>}
    </div>
  );
}

function FieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={["grid grid-cols-2 gap-x-5 gap-y-4", className ?? ""].join(" ")}>{children}</div>;
}

function Field({ label, value, placeholder, needsAttention, wide }: { label: string; value: string; placeholder?: string; needsAttention?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">{label}</label>
      <input
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        className={[
          "mt-1.5 h-[38px] w-full rounded-[7px] border bg-white px-3 text-[13px] text-[#0a0d14] outline-none placeholder:text-[#9298a3]",
          needsAttention ? "border-[#fca5a5]" : "border-[#ebedf0] focus:border-[#0d4b3a]",
        ].join(" ")}
      />
      {needsAttention && (
        <div className="mt-1 text-[11px] font-medium text-[#b42318]">Required for carrier review</div>
      )}
    </div>
  );
}
