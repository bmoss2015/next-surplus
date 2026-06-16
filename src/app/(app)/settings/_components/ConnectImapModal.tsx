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
  },
  {
    label: "iCloud",
    imap_host: "imap.mail.me.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.mail.me.com",
    smtp_port: 587,
    smtp_secure: false,
  },
  {
    label: "Zoho",
    imap_host: "imap.zoho.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.zoho.com",
    smtp_port: 465,
    smtp_secure: true,
  },
  {
    label: "Yahoo",
    imap_host: "imap.mail.yahoo.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.mail.yahoo.com",
    smtp_port: 465,
    smtp_secure: true,
  },
  {
    label: "ProtonMail",
    imap_host: "127.0.0.1",
    imap_port: 1143,
    imap_secure: false,
    smtp_host: "127.0.0.1",
    smtp_port: 1025,
    smtp_secure: false,
  },
  {
    label: "AOL",
    imap_host: "imap.aol.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.aol.com",
    smtp_port: 465,
    smtp_secure: true,
  },
  {
    label: "GMX",
    imap_host: "imap.gmx.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "mail.gmx.com",
    smtp_port: 465,
    smtp_secure: true,
  },
  {
    label: "Mail.com",
    imap_host: "imap.mail.com",
    imap_port: 993,
    imap_secure: true,
    smtp_host: "smtp.mail.com",
    smtp_port: 465,
    smtp_secure: true,
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
          className="flex items-center justify-between px-5 py-2.5 text-white"
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

        <div className="px-7 pt-6 pb-2">
          <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-tight text-ink">
            Sign In With {providerLabel}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
            Three short steps. The platform handles the rest.
          </p>
        </div>

        <div className="px-7 py-5">
          <Step
            n={1}
            title="Pick Your Provider"
            done
            body={`${providerLabel} selected`}
          />
          <Step
            n={2}
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
              <p className="text-[11px] leading-relaxed text-gray-500">
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
            n={3}
            title="Confirm Connection"
            body="The platform tests the connection before saving."
          />
        </div>

        <div className="border-t border-gray-100 px-7 py-5">
          <button
            type="button"
            onClick={submit}
            disabled={!ready || submitting}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md btn-primary text-[14px] font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Testing Connection" : "Continue"}
            <IconChevronRight size={16} stroke={2.4} />
          </button>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-7 py-3">
          <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
            Switch Provider
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-gray-600">
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
  return (
    <div className="pb-6 last:pb-0">
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
            done
              ? "bg-[#0d4b3a] text-white"
              : active
                ? "border-[1.5px] border-[#0d4b3a] bg-white text-[#0d4b3a]"
                : "border border-gray-300 bg-white text-gray-400"
          }`}
        >
          {done ? <IconCheck size={11} stroke={3} /> : n}
        </span>
        <div
          className={`text-[14px] font-semibold ${
            active || done ? "text-ink" : "text-gray-400"
          }`}
        >
          {title}
        </div>
      </div>
      {body && (
        <div
          className={`mt-1 text-[12px] leading-relaxed ${
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
