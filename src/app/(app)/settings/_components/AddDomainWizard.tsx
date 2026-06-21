"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  detectAndPrepare,
  startSubdomainDelegation,
  checkDomainVerification,
} from "@/lib/sending-domains/actions";

type Stage = "enter" | "detected" | "records" | "verifying" | "done";

type DetectInfo = {
  domain: string;
  subdomain: string;
  providerId: string;
  providerName: string;
  tier: string;
};

type RecordsInfo = {
  id: string;
  subdomain: string;
  nsRecords: string[];
};

export function AddDomainWizard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("enter");
  const [rawDomain, setRawDomain] = useState("");
  const [detect, setDetect] = useState<DetectInfo | null>(null);
  const [records, setRecords] = useState<RecordsInfo | null>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    // Reset wizard state when the modal closes so the next open starts
    // fresh. Existing settings panels (EmailAccountsSection's ConnectImap
    // modal et al) use the same pattern; the set-state-in-effect rule
    // doesn't apply because we're synchronizing to the open prop changing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStage("enter");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRawDomain("");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetect(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErr(null);
  }, [open]);

  function onDetect() {
    setErr(null);
    startTransition(async () => {
      const res = await detectAndPrepare(rawDomain);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setDetect(res.data);
      setStage("detected");
    });
  }

  function onStartDelegation() {
    if (!detect) return;
    setErr(null);
    startTransition(async () => {
      const res = await startSubdomainDelegation(detect.domain);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setRecords(res.data);
      setStage("records");
    });
  }

  function onVerify() {
    if (!records) return;
    setErr(null);
    setStage("verifying");
    startTransition(async () => {
      const res = await checkDomainVerification(records.id);
      if (!res.ok) {
        setErr(res.error);
        setStage("records");
        return;
      }
      if (res.data.status === "verified") {
        setStage("done");
        router.refresh();
      } else {
        setStage("records");
        setErr(
          "We can't see your DNS changes yet. DNS can take 5 to 60 minutes to propagate. Try again in a moment."
        );
      }
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_8px_40px_rgba(15,23,41,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Header onClose={onClose} />

        {stage === "enter" && (
          <EnterStage
            domain={rawDomain}
            setDomain={setRawDomain}
            err={err}
            pending={pending}
            onContinue={onDetect}
          />
        )}

        {stage === "detected" && detect && (
          <DetectedStage
            detect={detect}
            err={err}
            pending={pending}
            onContinue={onStartDelegation}
            onChangeDomain={() => setStage("enter")}
          />
        )}

        {(stage === "records" || stage === "verifying") && records && detect && (
          <RecordsStage
            detect={detect}
            records={records}
            err={err}
            pending={pending || stage === "verifying"}
            onVerify={onVerify}
          />
        )}

        {stage === "done" && detect && (
          <DoneStage domain={detect.domain} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f1f3] px-6 py-4">
      <div className="text-[14px] font-semibold tracking-[-0.01em] text-ink">
        Add Sending Domain
      </div>
      <button
        type="button"
        className="cursor-pointer text-[#9ca3af] hover:text-ink"
        aria-label="Close"
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

function EnterStage({
  domain,
  setDomain,
  err,
  pending,
  onContinue,
}: {
  domain: string;
  setDomain: (v: string) => void;
  err: string | null;
  pending: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="p-6">
      <FieldLabel>Domain You Want To Send From</FieldLabel>
      <input
        type="text"
        autoFocus
        placeholder="yourcompany.com"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && domain.trim().length > 3) onContinue();
        }}
        className="mt-1.5 h-[40px] w-full rounded-[6px] border border-gray-200 bg-white px-3 text-[13.5px] text-ink outline-none transition-colors duration-150 ease-out focus:border-[#13644e]"
      />
      <p className="mt-2 text-[11.5px] text-gray-500">
        We&apos;ll detect your DNS provider automatically. Your existing
        email keeps working.
      </p>
      {err && <ErrLine>{err}</ErrLine>}
      <button
        type="button"
        disabled={pending || domain.trim().length < 4}
        onClick={onContinue}
        className="mt-6 inline-flex h-[40px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
      >
        {pending ? "Detecting..." : "Continue"}
      </button>
    </div>
  );
}

function DetectedStage({
  detect,
  err,
  pending,
  onContinue,
  onChangeDomain,
}: {
  detect: DetectInfo;
  err: string | null;
  pending: boolean;
  onContinue: () => void;
  onChangeDomain: () => void;
}) {
  const tierLabel =
    detect.tier === "tier_a_direct"
      ? "2 Clicks"
      : detect.tier === "tier_b_domain_connect"
        ? "3 Clicks"
        : "5 Clicks";

  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-2 w-2 rounded-full bg-[#13644e]" />
        <span className="text-[13.5px] font-medium text-ink">
          {detect.domain}
        </span>
        <button
          type="button"
          onClick={onChangeDomain}
          className="ml-auto cursor-pointer text-[11.5px] font-medium text-gray-500 hover:text-ink"
        >
          Change
        </button>
      </div>

      <div className="mt-4 rounded-[6px] border border-gray-200 bg-[#fafbfc] px-4 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Detected Provider
        </div>
        <div className="mt-1 text-[13.5px] font-medium text-ink">
          {detect.providerName}
        </div>
        <div className="mt-1 text-[11.5px] text-gray-500">
          Setup For This Provider: {tierLabel}
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-gray-500">
        We&apos;ll create a sending subdomain at{" "}
        <span className="font-mono text-ink">{detect.subdomain}</span>.
        Your existing email at {detect.domain} keeps working untouched.
      </p>

      {err && <ErrLine>{err}</ErrLine>}

      <button
        type="button"
        disabled={pending}
        onClick={onContinue}
        className="mt-6 inline-flex h-[40px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
      >
        {pending ? "Preparing..." : "Continue"}
      </button>
    </div>
  );
}

function RecordsStage({
  detect,
  records,
  err,
  pending,
  onVerify,
}: {
  detect: DetectInfo;
  records: RecordsInfo;
  err: string | null;
  pending: boolean;
  onVerify: () => void;
}) {
  return (
    <div className="p-6">
      <div className="text-[13.5px] font-medium text-ink">
        Add This DNS Record At {detect.providerName}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
        Sign into your DNS provider and add a single NS record. This points
        the sending subdomain at our servers so we can manage the DKIM
        records for you.
      </p>

      <div className="mt-4 rounded-[6px] border border-gray-200 bg-[#fafbfc] px-3 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Record Type
        </div>
        <div className="mt-0.5 font-mono text-[12px] text-ink">NS</div>

        <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Host / Name
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="font-mono text-[12px] text-ink">
            send.{detect.domain}
          </span>
          <CopyButton text={`send.${detect.domain}`} />
        </div>

        <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          Value / Points To
        </div>
        <div className="mt-1 flex flex-col gap-1">
          {records.nsRecords.map((ns) => (
            <div key={ns} className="flex items-center gap-2">
              <span className="font-mono text-[11.5px] text-ink">{ns}</span>
              <CopyButton text={ns} />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[11.5px] text-gray-500">
        DNS changes typically take 5 to 60 minutes to propagate. Come back
        and click Verify once you&apos;ve added the record.
      </p>

      {err && <ErrLine>{err}</ErrLine>}

      <button
        type="button"
        disabled={pending}
        onClick={onVerify}
        className="mt-6 inline-flex h-[40px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
      >
        {pending ? "Checking DNS..." : "Verify Domain"}
      </button>
    </div>
  );
}

function DoneStage({
  domain,
  onClose,
}: {
  domain: string;
  onClose: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2.5">
        <span className="inline-block h-2 w-2 rounded-full bg-[#13644e]" />
        <span className="text-[15px] font-medium text-ink">Connected</span>
      </div>
      <div className="mt-2 text-[13px] text-ink">{domain}</div>
      <div className="mt-0.5 text-[12px] text-gray-500">
        You Can Now Send Email From This Domain
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-6 inline-flex h-[40px] w-full cursor-pointer items-center justify-center rounded-[6px] bg-[#13644e] text-[13.5px] font-medium text-white transition-colors duration-150 ease-out hover:bg-[#0d4b3a]"
      >
        Done
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11.5px] font-medium text-[#374151]">
      {children}
    </label>
  );
}

function ErrLine({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-3 rounded-[4px] border border-[#fdecec] bg-[#fef6f6] px-3 py-2 text-[11.5px]"
      style={{ color: "var(--danger)" }}
    >
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="cursor-pointer rounded-[3px] border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 hover:border-[#13644e] hover:text-[#13644e]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
