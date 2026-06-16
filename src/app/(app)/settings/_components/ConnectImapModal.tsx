"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconChevronRight,
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
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const providerLabel = customMode ? CUSTOM_LABEL : preset.label;

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
    setErr(null);
    setSubmitting(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const ready =
    address.length > 0 &&
    password.length > 0 &&
    (!customMode ||
      (customImapHost.length > 0 && customSmtpHost.length > 0));

  function submit() {
    if (!ready) return;
    setErr(null);
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
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function selectPreset(p: Preset) {
    setPreset(p);
    setCustomMode(false);
  }

  function selectCustom() {
    setCustomMode(true);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]"
      >
        <div
          className="flex items-center justify-between rounded-t-[20px] px-5 py-2.5 text-white"
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

        <div className="px-7 pt-6 pb-2 text-left">
          <h2 className="m-0 text-left text-[22px] font-semibold leading-tight tracking-tight text-ink">
            Sign In With {providerLabel}
          </h2>
        </div>

        <div className="px-7 py-5">
          <Step
            n={1}
            title={`${providerLabel} Selected`}
            done
          />
          {!customMode && (
            <Step
              n={2}
              title="Prepare Your Account"
              active
              body={`${preset.label} requires a one-time setup before the platform can sign in.`}
            >
              <div className="mt-3 rounded-md border border-[#0d4b3a]/15 bg-[#0d4b3a]/[0.04] p-4">
                <ol className="space-y-2 text-left text-[12.5px] leading-relaxed text-ink">
                  {preset.setupSteps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-[#0d4b3a]">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <a
                  href={preset.setupLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#0d4b3a] underline decoration-[#0d4b3a]/40 underline-offset-2 hover:decoration-[#0d4b3a]"
                >
                  {preset.setupLink.label} →
                </a>
              </div>
            </Step>
          )}
          <Step
            n={customMode ? 2 : 3}
            title="Sign In"
            active
            body="Enter the email and password for the inbox you want to connect."
          >
            <div className="mt-4 space-y-3">
              {customMode && (
                <>
                  <div className="grid grid-cols-[1fr_84px] gap-2">
                    <BigInput
                      placeholder="IMAP Server (e.g. mail.example.com)"
                      value={customImapHost}
                      onChange={setCustomImapHost}
                    />
                    <BigInput
                      placeholder="993"
                      value={customImapPort}
                      onChange={setCustomImapPort}
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_84px] gap-2">
                    <BigInput
                      placeholder="SMTP Server (e.g. smtp.example.com)"
                      value={customSmtpHost}
                      onChange={setCustomSmtpHost}
                    />
                    <BigInput
                      placeholder="465"
                      value={customSmtpPort}
                      onChange={setCustomSmtpPort}
                    />
                  </div>
                </>
              )}
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
              <p className="text-left text-[11px] leading-relaxed text-gray-500">
                If you have two-factor authentication on, generate an
                app password from your inbox settings and use that.
              </p>
              {err && (
                <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
                  {err}
                </div>
              )}
            </div>
          </Step>
          <Step
            n={customMode ? 3 : 4}
            title="Confirm Connection"
            body="The platform tests the connection before saving."
          />
        </div>

        <div className="border-t border-gray-100 px-7 py-5">
          <button
            type="button"
            onClick={submit}
            disabled={!ready || submitting}
            className="flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-md btn-primary px-5 text-[14px] font-medium text-white disabled:opacity-50"
          >
            <span>{submitting ? "Testing Connection" : "Continue"}</span>
            <IconChevronRight size={16} stroke={2.4} />
          </button>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-7 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
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

function Step({
  n,
  title,
  body,
  done,
  active,
  children,
}: {
  n: number;
  title: string;
  body?: string;
  done?: boolean;
  active?: boolean;
  children?: React.ReactNode;
}) {
  const eyebrowColor = done
    ? "text-[#0d4b3a]"
    : active
      ? "text-[#0d4b3a]"
      : "text-gray-400";
  const titleColor = active || done ? "text-ink" : "text-gray-400";
  return (
    <div className="pb-6 text-left last:pb-0">
      <div
        className={`mb-1 flex items-center gap-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.14em] ${eyebrowColor}`}
      >
        <span>Step {n}</span>
        {done && <IconCheck size={12} stroke={3} />}
      </div>
      <div className={`text-left text-[15px] font-semibold ${titleColor}`}>
        {title}
      </div>
      {body && (
        <div
          className={`mt-1 text-left text-[12.5px] leading-relaxed ${
            active || done ? "text-gray-600" : "text-gray-400"
          }`}
        >
          {body}
        </div>
      )}
      {children}
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
