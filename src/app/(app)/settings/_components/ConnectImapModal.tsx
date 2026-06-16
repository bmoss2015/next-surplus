"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
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
];

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

  const [preset, setPreset] = useState<Preset | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customHost, setCustomHost] = useState("");
  const [customPort, setCustomPort] = useState(993);
  const [customSmtpHost, setCustomSmtpHost] = useState("");
  const [customSmtpPort, setCustomSmtpPort] = useState(465);

  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    setStep(1);
    setPreset(null);
    setCustomMode(false);
    setAddress("");
    setPassword("");
    setErr(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const providerLabel = preset?.label ?? (customMode ? "Custom Server" : "");

  function pickPreset(p: Preset) {
    setPreset(p);
    setCustomMode(false);
    setStep(2);
  }

  function pickCustom() {
    setPreset(null);
    setCustomMode(true);
    setStep(2);
  }

  function submit() {
    setErr(null);
    if (!address || !password) {
      setErr("Email address and password are required.");
      return;
    }
    const imap_host = preset?.imap_host ?? customHost;
    const imap_port = preset?.imap_port ?? customPort;
    const imap_secure = preset?.imap_secure ?? true;
    const smtp_host = preset?.smtp_host ?? customSmtpHost;
    const smtp_port = preset?.smtp_port ?? customSmtpPort;
    const smtp_secure = preset?.smtp_secure ?? true;
    if (!imap_host || !smtp_host) {
      setErr("Server hostnames are required.");
      return;
    }
    setStep(3);
    startTransition(async () => {
      const res = await connectImapAccount({
        address,
        creds: {
          imap_host,
          imap_port,
          imap_secure,
          imap_username: address,
          imap_password: password,
          smtp_host,
          smtp_port,
          smtp_secure,
          smtp_username: address,
          smtp_password: password,
        },
      });
      if (!res.ok) {
        setErr(res.error);
        setStep(2);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]"
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
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <IconX size={14} stroke={2.2} />
          </button>
        </div>

        <div className="px-7 pt-6 pb-2">
          <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-tight text-ink">
            {providerLabel
              ? `Sign In With ${providerLabel}`
              : "Connect Your Email"}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
            Three short steps. We test the connection before saving.
          </p>
        </div>

        <div className="px-7 py-5">
          <Step
            n={1}
            title="Pick Your Provider"
            done={step > 1}
            active={step === 1}
            body={
              step > 1
                ? `${providerLabel} selected`
                : "Choose your inbox provider, or enter a custom IMAP server."
            }
          >
            {step === 1 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => pickPreset(p)}
                    className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-medium text-ink hover:border-[#0d4b3a] hover:bg-[#0d4b3a]/[0.03]"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={pickCustom}
                  className="col-span-2 cursor-pointer rounded-md border border-dashed border-gray-300 bg-white px-3 py-2.5 text-[12.5px] font-medium text-gray-600 hover:border-gray-400 hover:text-ink"
                >
                  Custom IMAP Server
                </button>
              </div>
            )}
          </Step>

          <Step
            n={2}
            title="Sign In"
            done={step > 2}
            active={step === 2}
            body={
              step >= 2
                ? customMode
                  ? "Enter your server details and credentials."
                  : "Enter the email and app password for this inbox."
                : undefined
            }
          >
            {step === 2 && (
              <div className="mt-4 space-y-3">
                {customMode && (
                  <div className="grid grid-cols-[1fr_90px] gap-2">
                    <FieldInput
                      placeholder="IMAP server (e.g. imap.example.com)"
                      value={customHost}
                      onChange={setCustomHost}
                    />
                    <FieldInput
                      placeholder="993"
                      value={String(customPort)}
                      onChange={(v) => setCustomPort(Number(v) || 0)}
                    />
                    <FieldInput
                      placeholder="SMTP server (e.g. smtp.example.com)"
                      value={customSmtpHost}
                      onChange={setCustomSmtpHost}
                    />
                    <FieldInput
                      placeholder="465"
                      value={String(customSmtpPort)}
                      onChange={(v) => setCustomSmtpPort(Number(v) || 0)}
                    />
                  </div>
                )}
                <FieldInput
                  type="email"
                  placeholder="Email Address"
                  value={address}
                  onChange={setAddress}
                />
                <FieldInput
                  type="password"
                  placeholder="App Password"
                  value={password}
                  onChange={setPassword}
                />
                {err && (
                  <div className="rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
                    {err}
                  </div>
                )}
              </div>
            )}
          </Step>

          <Step
            n={3}
            title="Confirm Connection"
            done={false}
            active={step === 3}
            body={
              step === 3
                ? pending
                  ? "Testing IMAP and SMTP servers..."
                  : "Connection verified."
                : "We test both servers before saving."
            }
          />
        </div>

        <div className="border-t border-gray-100 bg-gray-50/60 px-7 py-4">
          {step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full cursor-pointer rounded-md border border-gray-200 bg-white text-[13.5px] font-medium text-ink hover:border-gray-300"
            >
              Cancel
            </button>
          )}
          {step === 2 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white text-[13.5px] font-medium text-ink hover:border-gray-300"
              >
                <IconChevronLeft size={14} stroke={2.2} />
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md btn-primary text-[13.5px] font-medium text-white disabled:opacity-50"
              >
                Test &amp; Connect
                <IconChevronRight size={14} stroke={2.4} />
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="flex h-11 items-center justify-center gap-2 text-[13px] text-gray-500">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#0d4b3a] border-r-transparent" />
              {pending ? "Verifying connection" : "Saving"}
            </div>
          )}
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
    <div className="relative pb-6 pl-10 last:pb-0">
      <div
        className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-[11.5px] font-semibold ${
          done
            ? "bg-[#0d4b3a] text-white"
            : active
              ? "border-2 border-[#0d4b3a] bg-white text-[#0d4b3a]"
              : "border border-gray-300 bg-white text-gray-400"
        }`}
      >
        {done ? <IconCheck size={14} stroke={3} /> : n}
      </div>
      {n < 3 && (
        <div className="absolute left-[13.5px] top-7 h-[calc(100%-12px)] w-px bg-gray-200" />
      )}
      <div
        className={`text-[13.5px] font-semibold ${
          active || done ? "text-ink" : "text-gray-400"
        }`}
      >
        {title}
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

function FieldInput({
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
      className="block h-11 w-full rounded-md border border-gray-200 bg-white px-3.5 text-[13.5px] text-ink outline-none focus:border-[#0d4b3a] focus:ring-2 focus:ring-[#0d4b3a]/15"
    />
  );
}
