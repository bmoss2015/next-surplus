"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconInfoCircle,
  IconSparkles,
} from "@tabler/icons-react";
import type { A2pBrand, OrgInfo } from "@/lib/settings/fetch";
import { saveA2pBrandDraft, submitA2pBrand } from "@/app/(app)/settings/_actions";

type Step = 1 | 2 | 3;

const DEFAULT_SAMPLE_MESSAGES = [
  "Hi {first_name}, this is Sarah with {brand_name}. Public records show you may be owed funds from a recent foreclosure sale. Reply Y for details, STOP to opt out.",
  "Following up on the surplus funds from the {property_address} sale. The claim window is open through {deadline}. Reply with a good time to talk.",
  "Quick reminder, we still need a signed retainer to file your claim before the surplus funds are turned over to the state. Text or call when you have a minute.",
  "Hi {first_name}, the documents you signed are filed with the court. We'll text you again when we have a hearing date. Reply STOP to opt out at any time.",
  "Hi {first_name}, you have a check ready. Reply with your current mailing address and we'll get it out today.",
];

export function A2pWizard({
  initialBrand,
  orgInfo,
  hostedPrivacyUrl,
  hostedTermsUrl,
}: {
  initialBrand: A2pBrand | null;
  orgInfo: OrgInfo | null;
  hostedPrivacyUrl?: string;
  hostedTermsUrl?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from org info or existing brand draft.
  const [brand, setBrand] = useState({
    company_legal_name: initialBrand?.company_legal_name ?? orgInfo?.legal_name ?? orgInfo?.name ?? "",
    ein: initialBrand?.ein ?? orgInfo?.tax_id_ein ?? "",
    vertical: initialBrand?.vertical ?? "FINANCIAL",
    company_website: initialBrand?.company_website ?? orgInfo?.website ?? "",
    authorized_rep_name: initialBrand?.authorized_rep_name ?? "",
    authorized_rep_email: initialBrand?.authorized_rep_email ?? orgInfo?.email ?? "",
    authorized_rep_phone: initialBrand?.authorized_rep_phone ?? orgInfo?.phone ?? "",
    company_address_street: orgInfo?.address_line1 ?? "",
    company_address_city: orgInfo?.city ?? "",
    company_address_state: orgInfo?.region ?? "",
    company_address_postal_code: orgInfo?.postal_code ?? "",
    company_address_country: orgInfo?.country ?? "US",
    privacy_policy_url: initialBrand?.privacy_policy_url ?? hostedPrivacyUrl ?? "",
    terms_url: initialBrand?.terms_url ?? hostedTermsUrl ?? "",
    vetting_tier: (initialBrand?.vetting_tier ?? "standard") as "standard" | "enhanced" | "sole_prop",
  });

  const [campaign, setCampaign] = useState({
    use_case: "CUSTOMER_CARE",
    sample_messages: DEFAULT_SAMPLE_MESSAGES.slice(0, 3),
    monthly_volume: "LOW" as "LOW" | "MEDIUM" | "HIGH",
  });

  function update<K extends keyof typeof brand>(k: K, v: (typeof brand)[K]) {
    setBrand((b) => ({ ...b, [k]: v }));
  }

  async function saveDraft() {
    setError(null);
    startTransition(async () => {
      const res = await saveA2pBrandDraft(brand);
      if (!res.ok) {
        setError(res.error);
        return;
      }
    });
  }

  async function submit() {
    setError(null);
    startTransition(async () => {
      const draft = await saveA2pBrandDraft(brand);
      if (!draft.ok) {
        setError(draft.error);
        return;
      }
      const submitted = await submitA2pBrand();
      if (!submitted.ok) {
        setError(submitted.error);
        return;
      }
      router.push("/settings#phone-numbers");
    });
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-8 pb-32 pt-10">
      <div className="text-[12px] text-[#9298a3]">
        <Link href="/settings#phone-numbers" className="hover:text-[#0a0d14]">Settings</Link>
        {" / "}
        <span>A2P 10DLC Registration</span>
      </div>

      <h1 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.026em] text-[#0a0d14]">
        A2P 10DLC Registration
      </h1>
      <p className="mt-3 max-w-[60ch] text-[14px] leading-[1.55] text-[#5b606a]">
        Three short steps. We pre-filled what we could from your Company Profile. Carriers take 1 to 3 weeks to approve once submitted.
      </p>

      <div className="mt-8 flex items-center justify-between gap-3">
        <StepDot n={1} label="Brand" state={step === 1 ? "active" : step > 1 ? "done" : "todo"} />
        <span className={["h-px flex-1", step > 1 ? "bg-[#0d4b3a]" : "bg-[#ebedf0]"].join(" ")} />
        <StepDot n={2} label="Campaign" state={step === 2 ? "active" : step > 2 ? "done" : "todo"} />
        <span className={["h-px flex-1", step > 2 ? "bg-[#0d4b3a]" : "bg-[#ebedf0]"].join(" ")} />
        <StepDot n={3} label="Review and Submit" state={step === 3 ? "active" : "todo"} />
      </div>

      <div
        className="mt-8 overflow-hidden rounded-[14px] border border-[#ebedf0] bg-white"
        style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
      >
        {step === 1 && (
          <div className="space-y-5 px-7 py-6">
            <SmartTip text="We've pre-filled fields below from your Company Profile. Double-check the EIN and Authorized Representative." />
            <FieldGrid>
              <Field label="Company Legal Name" value={brand.company_legal_name} onChange={(v) => update("company_legal_name", v)} placeholder="Workflow Minds LLC" />
              <Field label="EIN" value={brand.ein} onChange={(v) => update("ein", v)} placeholder="12-3456789" />
              <Field label="Vertical" value={brand.vertical} onChange={(v) => update("vertical", v)} as="select" options={[
                { value: "FINANCIAL", label: "Financial Services" },
                { value: "REAL_ESTATE", label: "Real Estate" },
                { value: "PROFESSIONAL", label: "Professional Services" },
                { value: "NON_PROFIT", label: "Non-Profit" },
                { value: "OTHER", label: "Other" },
              ]} />
              <Field label="Vetting Tier" value={brand.vetting_tier} onChange={(v) => update("vetting_tier", v as typeof brand.vetting_tier)} as="select" options={[
                { value: "sole_prop", label: "Sole Proprietor ($4, 100 msgs/day cap)" },
                { value: "standard", label: "Standard ($40, recommended)" },
                { value: "enhanced", label: "Enhanced ($200, higher trust score)" },
              ]} />
              <Field label="Company Website" value={brand.company_website} onChange={(v) => update("company_website", v)} placeholder="https://example.com" />
              <Field label="Authorized Rep Name" value={brand.authorized_rep_name} onChange={(v) => update("authorized_rep_name", v)} placeholder="Jane Operator" />
              <Field label="Authorized Rep Email" value={brand.authorized_rep_email} onChange={(v) => update("authorized_rep_email", v)} placeholder="jane@example.com" />
              <Field label="Authorized Rep Phone" value={brand.authorized_rep_phone} onChange={(v) => update("authorized_rep_phone", v)} placeholder="+15125550188" />
              <Field label="Street Address" value={brand.company_address_street} onChange={(v) => update("company_address_street", v)} placeholder="123 Main St" wide />
              <Field label="City" value={brand.company_address_city} onChange={(v) => update("company_address_city", v)} placeholder="Austin" />
              <Field label="State" value={brand.company_address_state} onChange={(v) => update("company_address_state", v)} placeholder="TX" />
              <Field label="Postal Code" value={brand.company_address_postal_code} onChange={(v) => update("company_address_postal_code", v)} placeholder="78701" />
            </FieldGrid>
            <SmartTip
              variant="info"
              text="Privacy Policy and Terms URLs are required. We'll generate hosted pages for you automatically based on this brand info."
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 px-7 py-6">
            <SmartTip text="We've pre-selected the Customer Care use case and 3 sample messages tailored to surplus recovery. Edit any message inline." />
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Use Case</div>
              <div className="mt-1.5 text-[13px] text-[#0a0d14]">Customer Care (auto-selected, best fit for outreach to known parties of interest)</div>
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Monthly Volume</div>
              <div className="mt-2 flex gap-2">
                {(["LOW", "MEDIUM", "HIGH"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCampaign((c) => ({ ...c, monthly_volume: v }))}
                    className={[
                      "inline-flex h-9 cursor-pointer items-center rounded-[7px] border px-3 text-[12.5px] font-medium",
                      campaign.monthly_volume === v ? "border-[#0d4b3a] bg-[#0d4b3a] text-white" : "border-[#ebedf0] bg-white text-[#0a0d14]",
                    ].join(" ")}
                  >
                    {v === "LOW" ? "Low (Up To 3,000/Mo)" : v === "MEDIUM" ? "Medium (Up To 30,000/Mo)" : "High (Above 30,000/Mo)"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">Sample Messages</div>
              <div className="mt-2 space-y-2.5">
                {campaign.sample_messages.map((m, i) => (
                  <textarea
                    key={i}
                    value={m}
                    onChange={(e) => setCampaign((c) => ({ ...c, sample_messages: c.sample_messages.map((x, j) => (j === i ? e.target.value : x)) }))}
                    rows={2}
                    className="w-full rounded-[7px] border border-[#ebedf0] bg-white p-3 text-[13px] leading-[1.45] text-[#0a0d14] outline-none focus:border-[#0d4b3a]"
                  />
                ))}
              </div>
            </div>
            <SmartTip
              variant="info"
              text="HELP and STOP keyword behavior is wired automatically. You don't need to configure anything for those."
            />
          </div>
        )}

        {step === 3 && (
          <div className="px-7 py-6">
            <SmartTip text="Once submitted, brand vetting takes 1-2 business days. Campaign approval takes 1-3 weeks. You can keep buying numbers and using voice in the meantime." />
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <ReviewLine label="Company" value={brand.company_legal_name} />
              <ReviewLine label="EIN" value={brand.ein || "(missing)"} />
              <ReviewLine label="Vertical" value={brand.vertical} />
              <ReviewLine label="Vetting Tier" value={brand.vetting_tier} />
              <ReviewLine label="Website" value={brand.company_website} />
              <ReviewLine label="Use Case" value={campaign.use_case} />
              <ReviewLine label="Volume" value={campaign.monthly_volume} />
              <ReviewLine label="Sample Messages" value={`${campaign.sample_messages.length} templates`} />
            </div>
            <div className="mt-5 rounded-[7px] border border-[#ebedf0] bg-[#fafbfc] px-4 py-3 text-[12px] text-[#5b606a]">
              By submitting you authorize Workflow Minds to register your brand and campaign with The Campaign Registry and the mobile carriers on your behalf. Standard vetting fee: $40 charged on submit.
            </div>
          </div>
        )}

        {error && (
          <div className="border-t border-[#ebedf0] bg-[#fef2f2] px-7 py-3 text-[12.5px] text-[#b42318]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#ebedf0] bg-[#fafbfc] px-7 py-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
            disabled={step === 1 || pending}
            className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[12.5px] font-medium text-[#0a0d14] hover:border-[#0d4b3a] disabled:opacity-40"
          >
            <IconChevronLeft size={12} stroke={2.25} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={pending}
              className="cursor-pointer text-[12.5px] font-medium text-[#5b606a] hover:text-[#0d4b3a] disabled:opacity-40"
            >
              Save Draft
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(3, s + 1) as Step)}
                disabled={pending}
                className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[7px] bg-[#0d4b3a] px-4 text-[12.5px] font-medium text-white disabled:opacity-50"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
              >
                Continue
                <IconChevronRight size={12} stroke={2.25} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-[7px] bg-[#0d4b3a] px-4 text-[12.5px] font-medium text-white disabled:opacity-50"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(13,75,58,0.20), 0 6px 16px -4px rgba(13,75,58,0.30)" }}
              >
                <IconCheck size={12} stroke={2.5} />
                Submit Registration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDot({ n, label, state }: { n: number; label: string; state: "active" | "done" | "todo" }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold",
          state === "done" ? "bg-[#0d4b3a] text-white" : state === "active" ? "bg-white text-[#0d4b3a]" : "bg-white text-[#9298a3]",
        ].join(" ")}
        style={{ border: state === "active" ? "2px solid #0d4b3a" : "1px solid #ebedf0" }}
      >
        {state === "done" ? <IconCheck size={13} stroke={3} /> : n}
      </span>
      <span className={["text-[12.5px] font-medium whitespace-nowrap", state === "todo" ? "text-[#9298a3]" : "text-[#0a0d14]"].join(" ")}>
        {label}
      </span>
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
  as,
  options,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  as?: "input" | "select";
  options?: { value: string; label: string }[];
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <label className="block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#5b606a]">
        {label}
      </label>
      {as === "select" && options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 h-[38px] w-full cursor-pointer rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13px] text-[#0a0d14] outline-none focus:border-[#0d4b3a]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 h-[38px] w-full rounded-[7px] border border-[#ebedf0] bg-white px-3 text-[13px] text-[#0a0d14] outline-none placeholder:text-[#9298a3] focus:border-[#0d4b3a]"
        />
      )}
    </div>
  );
}

function SmartTip({ text, variant = "tip" }: { text: string; variant?: "tip" | "info" }) {
  return (
    <div
      className={[
        "flex items-start gap-2 rounded-[7px] border px-3.5 py-2.5 text-[12.5px]",
        variant === "tip"
          ? "border-[#0d4b3a] bg-[#0d4b3a]/[0.03] text-[#0d4b3a]"
          : "border-[#ebedf0] bg-[#fafbfc] text-[#5b606a]",
      ].join(" ")}
    >
      {variant === "tip" ? (
        <IconSparkles size={14} stroke={2.25} className="mt-0.5 shrink-0" />
      ) : (
        <IconInfoCircle size={14} stroke={2.25} className="mt-0.5 shrink-0" />
      )}
      <span>{text}</span>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#f1f2f4] pb-2">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9298a3]">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium text-[#0a0d14]">{value}</div>
    </div>
  );
}
