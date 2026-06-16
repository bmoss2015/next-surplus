"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import { connectImapAccount } from "@/app/(app)/settings/_email-actions";

type Preset = {
  label: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  setupSteps: string[];
  setupLink: { label: string; url: string };
};

const PRESETS: Preset[] = [
  {
    label: "Fastmail",
    imap_host: "imap.fastmail.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.fastmail.com",
    smtp_port: 465,
    smtp_secure: true,
    setupSteps: [
      "Sign in to Fastmail and open Settings → Privacy & Security → App Passwords.",
      "Click New App Password, name it 'Next Surplus', and copy the generated password.",
      "Use that app password below — your regular Fastmail password will not work.",
    ],
    setupLink: {
      label: "Open Fastmail App Passwords",
      url: "https://app.fastmail.com/settings/security/passwords",
    },
  },
  {
    label: "iCloud",
    imap_host: "imap.mail.me.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.mail.me.com",
    smtp_port: 587,
    smtp_secure: false,
    setupSteps: [
      "Sign in to your Apple ID and open Sign-In and Security → App-Specific Passwords.",
      "Generate a new app-specific password named 'Next Surplus'.",
      "Use that app password below — Apple blocks IMAP with your normal password.",
    ],
    setupLink: {
      label: "Open Apple App-Specific Passwords",
      url: "https://account.apple.com/account/manage",
    },
  },
  {
    label: "Zoho",
    imap_host: "imap.zoho.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.zoho.com",
    smtp_port: 465,
    smtp_secure: true,
    setupSteps: [
      "In Zoho Mail, go to Settings → Mail Accounts → IMAP and toggle IMAP Access ON.",
      "At accounts.zoho.com → Security → App Passwords, generate one named 'Next Surplus'.",
      "Use that app password below. If your account is on Zoho EU / IN / AU / CN, pick Custom Server instead and use imap.zoho.<your-region>.",
    ],
    setupLink: {
      label: "Open Zoho App Passwords",
      url: "https://accounts.zoho.com/home#security/app_password",
    },
  },
  {
    label: "Yahoo",
    imap_host: "imap.mail.yahoo.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.mail.yahoo.com",
    smtp_port: 465,
    smtp_secure: true,
    setupSteps: [
      "Sign in at Yahoo Account Security and turn on Two-Step Verification (Yahoo requires it for IMAP).",
      "Generate an App Password named 'Next Surplus'.",
      "Use that app password below.",
    ],
    setupLink: {
      label: "Open Yahoo Account Security",
      url: "https://login.yahoo.com/account/security",
    },
  },
  {
    label: "AOL",
    imap_host: "imap.aol.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.aol.com",
    smtp_port: 465,
    smtp_secure: true,
    setupSteps: [
      "Sign in at AOL Account Security and turn on Two-Step Verification.",
      "Generate an App Password named 'Next Surplus'.",
      "Use that app password below.",
    ],
    setupLink: {
      label: "Open AOL Account Security",
      url: "https://login.aol.com/account/security",
    },
  },
  {
    label: "GMX",
    imap_host: "imap.gmx.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "mail.gmx.com",
    smtp_port: 465,
    smtp_secure: true,
    setupSteps: [
      "Sign in to GMX webmail and open Settings → POP3 / IMAP.",
      "Enable IMAP and Send and Receive via External Programs.",
      "Use your regular GMX password below.",
    ],
    setupLink: {
      label: "Open GMX Settings",
      url: "https://www.gmx.com",
    },
  },
  {
    label: "Mail.com",
    imap_host: "imap.mail.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.mail.com",
    smtp_port: 465,
    smtp_secure: true,
    setupSteps: [
      "Sign in to Mail.com and open Settings → POP3 / IMAP.",
      "Enable IMAP access for external programs.",
      "Use your regular Mail.com password below.",
    ],
    setupLink: {
      label: "Open Mail.com",
      url: "https://www.mail.com",
    },
  },
];

const CUSTOM_LABEL = "Custom Server";
const HEADER_GRADIENT =
  "linear-gradient(135deg, #0d4b3a 0%, #145e48 55%, #1f7a5e 100%)";

type Step = 1 | 2 | 3 | 4;

export function ConnectImapModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [customMode, setCustomMode] = useState(false);
  const [customImapHost, setCustomImapHost] = useState("");
  const [customImapPort, setCustomImapPort] = useState("993");
  const [customSmtpHost, setCustomSmtpHost] = useState("");
  const [customSmtpPort, setCustomSmtpPort] = useState("465");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>(1);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const providerLabel = customMode ? CUSTOM_LABEL : preset.label;
  const totalSteps = customMode ? 3 : 4;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setPreset(PRESETS[0]);
    setCustomMode(false);
    setCustomImapHost("");
    setCustomImapPort("993");
    setCustomSmtpHost("");
    setCustomSmtpPort("465");
    setAddress("");
    setPassword("");
    setStep(1);
    setErr(null);
    setSubmitting(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  function selectPreset(p: Preset) {
    setPreset(p);
    setCustomMode(false);
    setStep(1);
    setErr(null);
  }
  function selectCustom() {
    setCustomMode(true);
    setStep(1);
    setErr(null);
  }

  const credsReady =
    address.length > 0 &&
    password.length > 0 &&
    (!customMode ||
      (customImapHost.length > 0 && customSmtpHost.length > 0));

  function next() {
    setErr(null);
    if (customMode) {
      if (step === 1) return setStep(2);
      if (step === 2) return runConnect();
    } else {
      if (step === 1) return setStep(2);
      if (step === 2) return setStep(3);
      if (step === 3) return runConnect();
    }
  }
  function back() {
    setErr(null);
    if (step > 1) setStep((step - 1) as Step);
  }

  function runConnect() {
    if (!credsReady) {
      setErr("Email address and password are required.");
      return;
    }
    setStep(totalSteps as Step);
    setSubmitting(true);
    const imapHost = customMode ? customImapHost : preset.imap_host;
    const imapPort = customMode ? Number(customImapPort) : preset.imap_port;
    const smtpHost = customMode ? customSmtpHost : preset.smtp_host;
    const smtpPort = customMode ? Number(customSmtpPort) : preset.smtp_port;
    startTransition(async () => {
      const res = await connectImapAccount({
        address,
        creds: {
          imap_host: imapHost,
          imap_port: imapPort,
          imap_secure: imapPort === 993 || imapPort === 465,
          imap_username: address,
          imap_password: password,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_secure: smtpPort === 465 || smtpPort === 993,
          smtp_username: address,
          smtp_password: password,
        },
      });
      if (!res.ok) {
        setErr(res.error);
        setSubmitting(false);
        setStep((customMode ? 2 : 3) as Step);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  if (!open) return null;

  const stepTitle = (() => {
    if (customMode) {
      if (step === 1) return "Server Settings";
      if (step === 2) return "Sign In";
      return "Connecting";
    }
    if (step === 1) return "Prepare Your Account";
    if (step === 2) return "Sign In";
    if (step === 3) return "Sign In";
    return "Connecting";
  })();

  const ctaLabel = (() => {
    if (submitting) return "Testing Connection";
    if (customMode) {
      if (step === 1) return "Continue";
      if (step === 2) return "Test & Connect";
      return "Connecting";
    }
    if (step === 1) return "I'm Ready";
    if (step === 2) return "Continue";
    if (step === 3) return "Test & Connect";
    return "Connecting";
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-[480px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]"
        style={{ height: "min(640px, calc(100vh - 32px))" }}
      >
        <div
          className="flex shrink-0 items-center justify-between rounded-t-[20px] px-5 py-2.5 text-white"
          style={{ background: HEADER_GRADIENT }}
        >
          <div className="flex items-center gap-2">
            <IconMail size={14} stroke={2} />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em]">
              Connect Email Account
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <IconX size={14} stroke={2.2} />
          </button>
        </div>

        <div className="shrink-0 border-b border-gray-100 px-7 pt-5 pb-4 text-left">
          <div className="mb-1 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
            Step {step} Of {totalSteps}
          </div>
          <h2 className="m-0 text-left text-[20px] font-semibold leading-tight tracking-tight text-ink">
            {stepTitle}
          </h2>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const n = i + 1;
              const done = n < step;
              const current = n === step;
              return (
                <span
                  key={n}
                  className={`h-1 flex-1 rounded-full ${
                    done
                      ? "bg-[#0d4b3a]"
                      : current
                        ? "bg-[#0d4b3a]/40"
                        : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5 text-left">
          {!customMode && step === 1 && (
            <PrepareStep preset={preset} providerLabel={providerLabel} />
          )}
          {!customMode && step === 2 && (
            <SignInStep
              providerLabel={providerLabel}
              address={address}
              setAddress={setAddress}
              password={password}
              setPassword={setPassword}
            />
          )}
          {!customMode && step === 3 && (
            <ConfirmStep
              address={address}
              providerLabel={providerLabel}
              err={err}
              submitting={submitting}
            />
          )}

          {customMode && step === 1 && (
            <CustomServerStep
              customImapHost={customImapHost}
              setCustomImapHost={setCustomImapHost}
              customImapPort={customImapPort}
              setCustomImapPort={setCustomImapPort}
              customSmtpHost={customSmtpHost}
              setCustomSmtpHost={setCustomSmtpHost}
              customSmtpPort={customSmtpPort}
              setCustomSmtpPort={setCustomSmtpPort}
            />
          )}
          {customMode && step === 2 && (
            <SignInStep
              providerLabel={providerLabel}
              address={address}
              setAddress={setAddress}
              password={password}
              setPassword={setPassword}
            />
          )}
          {customMode && step === 3 && (
            <ConfirmStep
              address={address}
              providerLabel={providerLabel}
              err={err}
              submitting={submitting}
            />
          )}

          {err && step !== (totalSteps as Step) && (
            <div className="mt-4 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-left text-[12px] leading-relaxed text-danger">
              <strong className="mb-0.5 block">Connection failed</strong>
              {err}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-7 py-4">
          <div className="flex items-center gap-2">
            {step > 1 && step !== totalSteps && (
              <button
                type="button"
                onClick={back}
                className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white text-[13.5px] font-medium text-ink hover:border-gray-300"
              >
                <IconChevronLeft size={14} stroke={2.2} />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              disabled={submitting}
              className="inline-flex h-11 flex-1 cursor-pointer items-center justify-between rounded-md btn-primary px-5 text-[13.5px] font-medium text-white disabled:opacity-50"
            >
              <span>{ctaLabel}</span>
              <IconChevronRight size={14} stroke={2.4} />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-7 py-2.5">
          <div className="mb-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Switch Provider
          </div>
          <div className="flex flex-wrap items-center justify-start gap-1.5 text-[11px] text-gray-600">
            {PRESETS.filter(
              (p) => customMode || p.label !== preset.label
            ).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => selectPreset(p)}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-2.5 py-0.5 font-medium hover:border-[#0d4b3a] hover:text-[#0d4b3a]"
              >
                {p.label}
              </button>
            ))}
            {!customMode && (
              <button
                type="button"
                onClick={selectCustom}
                className="cursor-pointer rounded-full border border-dashed border-gray-300 bg-white px-2.5 py-0.5 font-medium text-gray-600 hover:border-gray-500 hover:text-ink"
              >
                Custom Server
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrepareStep({
  preset,
  providerLabel,
}: {
  preset: Preset;
  providerLabel: string;
}) {
  return (
    <div className="text-left">
      <p className="mb-4 text-[13px] leading-relaxed text-gray-600">
        {providerLabel} requires a one-time setup in your email account
        before the platform can sign in. Complete the steps below, then
        click <strong>I&apos;m Ready</strong>.
      </p>
      <div className="rounded-md border border-[#0d4b3a]/15 bg-[#0d4b3a]/[0.04] p-4">
        <ol className="space-y-2.5 text-left text-[12.5px] leading-relaxed text-ink">
          {preset.setupSteps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[1px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0d4b3a] text-[9px] font-semibold text-white">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <a
          href={preset.setupLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0d4b3a] underline decoration-[#0d4b3a]/40 underline-offset-2 hover:decoration-[#0d4b3a]"
        >
          {preset.setupLink.label}
          <IconExternalLink size={12} stroke={2} />
        </a>
      </div>
    </div>
  );
}

function SignInStep({
  providerLabel,
  address,
  setAddress,
  password,
  setPassword,
}: {
  providerLabel: string;
  address: string;
  setAddress: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  return (
    <div className="text-left">
      <p className="mb-4 text-[13px] leading-relaxed text-gray-600">
        Enter the email address and the app password you generated for{" "}
        {providerLabel}.
      </p>
      <div className="space-y-3">
        <BigInput
          type="email"
          placeholder="Email Address"
          value={address}
          onChange={setAddress}
        />
        <BigInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={setPassword}
        />
      </div>
      <p className="mt-3 text-left text-[11px] leading-relaxed text-gray-500">
        Most providers require an app-specific password when two-factor
        authentication is on. Use the app password from the previous
        step, not your normal login password.
      </p>
    </div>
  );
}

function CustomServerStep({
  customImapHost,
  setCustomImapHost,
  customImapPort,
  setCustomImapPort,
  customSmtpHost,
  setCustomSmtpHost,
  customSmtpPort,
  setCustomSmtpPort,
}: {
  customImapHost: string;
  setCustomImapHost: (v: string) => void;
  customImapPort: string;
  setCustomImapPort: (v: string) => void;
  customSmtpHost: string;
  setCustomSmtpHost: (v: string) => void;
  customSmtpPort: string;
  setCustomSmtpPort: (v: string) => void;
}) {
  return (
    <div className="text-left">
      <p className="mb-4 text-[13px] leading-relaxed text-gray-600">
        Enter your incoming (IMAP) and outgoing (SMTP) server addresses.
        Your email provider lists these on their settings or help page.
      </p>
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500">
            IMAP (Incoming)
          </div>
          <div className="grid grid-cols-[1fr_84px] gap-2">
            <BigInput
              placeholder="imap.example.com"
              value={customImapHost}
              onChange={setCustomImapHost}
            />
            <BigInput
              placeholder="993"
              value={customImapPort}
              onChange={setCustomImapPort}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500">
            SMTP (Outgoing)
          </div>
          <div className="grid grid-cols-[1fr_84px] gap-2">
            <BigInput
              placeholder="smtp.example.com"
              value={customSmtpHost}
              onChange={setCustomSmtpHost}
            />
            <BigInput
              placeholder="465"
              value={customSmtpPort}
              onChange={setCustomSmtpPort}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmStep({
  address,
  providerLabel,
  err,
  submitting,
}: {
  address: string;
  providerLabel: string;
  err: string | null;
  submitting: boolean;
}) {
  if (submitting) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-[#0d4b3a] border-r-transparent" />
        <div className="text-[14px] font-semibold text-ink">
          Verifying Connection
        </div>
        <div className="mt-1 text-[12.5px] text-gray-600">
          Testing IMAP and SMTP for {address || providerLabel}.
        </div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="text-left">
        <p className="text-[13px] leading-relaxed text-gray-600">
          The connection test for {address || providerLabel} did not
          succeed. See the error below, fix it, then go back and try
          again.
        </p>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0d4b3a] text-white">
        <IconCheck size={20} stroke={3} />
      </div>
      <div className="text-[14px] font-semibold text-ink">All Set</div>
      <div className="mt-1 text-[12.5px] text-gray-600">
        Connected. Closing the modal.
      </div>
    </div>
  );
}

function BigInput({
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block h-11 w-full rounded-md border border-gray-200 bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-[#0d4b3a]"
    />
  );
}
