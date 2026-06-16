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
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

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
    setAddress("");
    setPassword("");
    setErr(null);
    setSubmitting(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const ready = address.length > 0 && password.length > 0;

  function submit() {
    if (!ready) return;
    setErr(null);
    setSubmitting(true);
    startTransition(async () => {
      const res = await connectImapAccount({
        address,
        creds: {
          imap_host: preset.imap_host,
          imap_port: preset.imap_port,
          imap_secure: preset.imap_secure,
          imap_username: address,
          imap_password: password,
          smtp_host: preset.smtp_host,
          smtp_port: preset.smtp_port,
          smtp_secure: preset.smtp_secure,
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.4)]"
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
            Sign In With {preset.label}
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
            body={`${preset.label} selected`}
          />
          <Step
            n={2}
            title="Sign In"
            active
            body="Enter the email and app password for the inbox you want to connect."
          >
            <div className="mt-4 space-y-3">
              <BigInput
                type="email"
                placeholder="Email Address"
                value={address}
                onChange={setAddress}
              />
              <BigInput
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

        <div className="border-t border-gray-100 bg-gray-50 px-7 py-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
            <span>Or pick another:</span>
            {PRESETS.filter((p) => p.label !== preset.label).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPreset(p)}
                className="cursor-pointer rounded-full border border-gray-200 bg-white px-2.5 py-0.5 hover:border-gray-300"
              >
                {p.label}
              </button>
            ))}
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
