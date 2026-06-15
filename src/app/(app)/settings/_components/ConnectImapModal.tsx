"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);
  const [imapUser, setImapUser] = useState("");
  const [imapPass, setImapPass] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function applyPreset(p: Preset) {
    setImapHost(p.imap_host);
    setImapPort(p.imap_port);
    setImapSecure(p.imap_secure);
    setSmtpHost(p.smtp_host);
    setSmtpPort(p.smtp_port);
    setSmtpSecure(p.smtp_secure);
  }

  function syncSmtpUserToImap() {
    if (!smtpUser) setSmtpUser(imapUser);
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
          smtp_username: smtpUser || imapUser,
          smtp_password: smtpPass || imapPass,
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

  const labelClass =
    "mb-1 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-gray-500";
  const inputClass =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-ink outline-none focus:border-petrol-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-6"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="m-0 text-[18px] font-semibold tracking-tight text-ink">
              Connect Other Email Account
            </h2>
            <p className="mt-1 text-[12.5px] text-gray-500">
              IMAP for receiving, SMTP for sending. Pick a preset or
              enter your own server settings.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[20px] leading-none text-gray-400 hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 text-[12px]">
          <span className="text-gray-500">Preset:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="cursor-pointer rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11.5px] text-ink hover:border-petrol-300"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              required
              className={inputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Display Name (Optional)</label>
            <input
              type="text"
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
            />
          </div>
        </div>

        <div className="mt-5 border-t border-gray-200 pt-4">
          <div className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#0d4b3a]">
            IMAP (Incoming)
          </div>
          <div className="grid grid-cols-[2fr_1fr_auto] gap-3">
            <div>
              <label className={labelClass}>Server</label>
              <input
                type="text"
                required
                className={inputClass}
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
                placeholder="imap.example.com"
              />
            </div>
            <div>
              <label className={labelClass}>Port</label>
              <input
                type="number"
                required
                className={inputClass}
                value={imapPort}
                onChange={(e) => setImapPort(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={imapSecure}
                  onChange={(e) => setImapSecure(e.target.checked)}
                />
                SSL/TLS
              </label>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                required
                className={inputClass}
                value={imapUser}
                onChange={(e) => setImapUser(e.target.value)}
                onBlur={syncSmtpUserToImap}
                placeholder="usually your email address"
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                className={inputClass}
                value={imapPass}
                onChange={(e) => setImapPass(e.target.value)}
                placeholder="app password or account password"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-gray-200 pt-4">
          <div className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#0d4b3a]">
            SMTP (Outgoing)
          </div>
          <div className="grid grid-cols-[2fr_1fr_auto] gap-3">
            <div>
              <label className={labelClass}>Server</label>
              <input
                type="text"
                required
                className={inputClass}
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.example.com"
              />
            </div>
            <div>
              <label className={labelClass}>Port</label>
              <input
                type="number"
                required
                className={inputClass}
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                />
                SSL/TLS
              </label>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Username (Leave Blank To Reuse IMAP)</label>
              <input
                type="text"
                className={inputClass}
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder={imapUser || "usually your email address"}
              />
            </div>
            <div>
              <label className={labelClass}>Password (Leave Blank To Reuse IMAP)</label>
              <input
                type="password"
                className={inputClass}
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-[12px] text-danger">
            {err}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-4 py-2 text-[13px] text-ink hover:border-petrol-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer rounded-md btn-primary px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {pending ? "Testing Connection" : "Test And Connect"}
          </button>
        </div>
      </form>
    </div>
  );
}
