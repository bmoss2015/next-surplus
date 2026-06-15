"use client";

import {
  IconMail,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconX,
} from "@tabler/icons-react";
import { MockupShell, PRESETS } from "../_shared";

export function V1Modal() {
  return (
    <MockupShell active="v1">
      <div className="w-full max-w-[640px] overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.35)]">
        <div className="flex items-start justify-between border-b border-gray-100 px-8 pt-7 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0d4b3a] text-white">
              <IconMail size={22} stroke={1.6} />
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
                Email Connection
              </div>
              <h2 className="mt-1 text-[20px] font-semibold leading-tight tracking-tight text-ink">
                Connect Another Inbox
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500">
                IMAP for receiving, SMTP for sending.
              </p>
            </div>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100">
            <IconX size={18} />
          </button>
        </div>

        <div className="px-8 py-6">
          <SectionLabel label="Quick Picks" />
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-[12.5px] font-medium text-ink hover:border-gray-300"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="my-7 h-px bg-gray-100" />
          <SectionLabel label="Account" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email Address" required />
            <Field label="Display Name (Optional)" />
          </div>
          <div className="my-7 h-px bg-gray-100" />
          <SectionHeader icon={<IconArrowDownLeft size={14} stroke={2} />}>
            Incoming Mail Server (IMAP)
          </SectionHeader>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Server" />
            <Field label="Port" />
          </div>
          <Segmented options={["SSL / TLS (Recommended)", "STARTTLS"]} />
          <div className="my-7 h-px bg-gray-100" />
          <SectionHeader icon={<IconArrowUpRight size={14} stroke={2} />}>
            Outgoing Mail Server (SMTP)
          </SectionHeader>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Server" />
            <Field label="Port" />
          </div>
          <Segmented options={["SSL / TLS", "STARTTLS (Recommended)"]} />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-8 py-4">
          <div className="text-[11px] text-gray-500">
            We test both servers before saving.
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 w-32 rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink">
              Cancel
            </button>
            <button className="h-10 w-32 rounded-md btn-primary text-[13px] font-medium text-white">
              Test & Connect
            </button>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
      {label}
    </div>
  );
}

function SectionHeader({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 text-[#0d4b3a]">
      {icon}
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-gray-500">
        {label}
        {required && <span className="ml-0.5 text-[#0d4b3a]">*</span>}
      </span>
      <input className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-[#0d4b3a]" />
    </label>
  );
}

function Segmented({ options }: { options: string[] }) {
  return (
    <div className="mt-3 inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
      {options.map((o, i) => (
        <button
          key={o}
          className={`rounded-[5px] px-3 py-1.5 text-[11.5px] font-medium ${
            i === 0 ? "bg-white text-ink shadow-sm" : "text-gray-500"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
