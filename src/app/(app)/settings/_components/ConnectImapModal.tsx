"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconMail,
  IconArrowDownLeft,
  IconArrowUpRight,
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

export function ConnectImapModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);
  const [imapUser, setImapUser] = useState("");
  const [imapPass, setImapPass] = useState("");
  const [reuseImap, setReuseImap] = useState(true);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
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

  function applyPreset(p: Preset) {
    setActivePreset(p.label);
    setImapHost(p.imap_host);
    setImapPort(p.imap_port);
    setImapSecure(p.imap_secure);
    setSmtpHost(p.smtp_host);
    setSmtpPort(p.smtp_port);
    setSmtpSecure(p.smtp_secure);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const res = await connectImapAccount({
        address,
        display_name: displayName || undefined,
        creds: {
          imap_host: imapHost,
          imap_port: imapPort,
          imap_secure: imapSecure,
          imap_username: imapUser,
          imap_password: imapPass,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_secure: smtpSecure,
          smtp_username: reuseImap ? imapUser : smtpUser,
          smtp_password: reuseImap ? imapPass : smtpPass,
        },
      });
      if (!res.ok) {
        setErr(res.error);
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
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-[640px] overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.35)]"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-8 pt-7 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0d4b3a] text-white">
              <IconMail size={22} stroke={1.6} />
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
                Email Connection
              </div>
              <h2 className="mt-1 m-0 text-[20px] font-semibold leading-tight tracking-tight text-ink">
                Connect Another Inbox
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500">
                IMAP for receiving, SMTP for sending. Pick a preset or
                paste your own server settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-ink"
            aria-label="Close"
          >
            <IconX size={18} stroke={2} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-180px)] overflow-y-auto px-8 py-6">
          <SectionLabel label="Quick Picks" />
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className={`cursor-pointer rounded-lg border px-3 py-3 text-[12.5px] font-medium transition-colors ${
                  activePreset === p.label
                    ? "border-[#0d4b3a] bg-[#0d4b3a]/[0.04] text-[#0d4b3a] shadow-[inset_0_0_0_1px_#0d4b3a]"
                    : "border-gray-200 bg-white text-ink hover:border-gray-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="my-7 h-px bg-gray-100" />

          <SectionLabel label="Account" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email Address" required>
              <input
                type="email"
                required
                className={INPUT_CLASS}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Display Name (Optional)">
              <input
                type="text"
                className={INPUT_CLASS}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
              />
            </Field>
          </div>

          <div className="my-7 h-px bg-gray-100" />

          <div className="mb-4 flex items-center gap-2">
            <IconArrowDownLeft size={14} stroke={2} className="text-[#0d4b3a]" />
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
              Incoming Mail Server (IMAP)
            </div>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Server">
              <input
                type="text"
                required
                className={INPUT_CLASS}
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
                placeholder="imap.example.com"
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                required
                className={INPUT_CLASS}
                value={imapPort}
                onChange={(e) => setImapPort(Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Username">
              <input
                type="text"
                required
                className={INPUT_CLASS}
                value={imapUser}
                onChange={(e) => setImapUser(e.target.value)}
                placeholder="Usually your email address"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                className={INPUT_CLASS}
                value={imapPass}
                onChange={(e) => setImapPass(e.target.value)}
                placeholder="App password or account password"
              />
            </Field>
          </div>
          <SegmentedToggle
            value={imapSecure ? "ssl" : "starttls"}
            onChange={(v) => setImapSecure(v === "ssl")}
            options={[
              { value: "ssl", label: "SSL / TLS (Recommended)" },
              { value: "starttls", label: "STARTTLS" },
            ]}
          />

          <div className="my-7 h-px bg-gray-100" />

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconArrowUpRight size={14} stroke={2} className="text-[#0d4b3a]" />
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
                Outgoing Mail Server (SMTP)
              </div>
            </div>
            <SwitchToggle
              checked={reuseImap}
              onChange={setReuseImap}
              label="Use IMAP Credentials"
            />
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Server">
              <input
                type="text"
                required
                className={INPUT_CLASS}
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.example.com"
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                required
                className={INPUT_CLASS}
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
              />
            </Field>
          </div>
          {!reuseImap && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Username">
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  className={INPUT_CLASS}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                />
              </Field>
            </div>
          )}
          <SegmentedToggle
            value={smtpSecure ? "ssl" : "starttls"}
            onChange={(v) => setSmtpSecure(v === "ssl")}
            options={[
              { value: "ssl", label: "SSL / TLS" },
              { value: "starttls", label: "STARTTLS (Recommended)" },
            ]}
          />

          {err && (
            <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-[12.5px] leading-relaxed text-danger">
              <strong className="block mb-0.5">Connection failed</strong>
              {err}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-8 py-4">
          <div className="text-[11px] text-gray-500">
            We test both servers before saving. Credentials are
            encrypted at rest.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="inline-flex h-10 w-32 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 w-32 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white disabled:opacity-50"
            >
              {pending ? "Testing" : "Test & Connect"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const INPUT_CLASS =
  "block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-[#0d4b3a] focus:ring-2 focus:ring-[#0d4b3a]/15";

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
      {label}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-gray-500">
        {label}
        {required && <span className="ml-0.5 text-[#0d4b3a]">*</span>}
      </span>
      {children}
    </label>
  );
}

function SegmentedToggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mt-3 inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded-[5px] px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
            value === o.value
              ? "bg-white text-ink shadow-sm"
              : "text-gray-500 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SwitchToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[11.5px] text-gray-600">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-4 w-7 rounded-full transition-colors ${
          checked ? "bg-[#0d4b3a]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
            checked ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
