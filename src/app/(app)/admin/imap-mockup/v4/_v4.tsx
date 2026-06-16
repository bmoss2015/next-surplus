"use client";

import { IconX, IconCheck } from "@tabler/icons-react";
import { MockupShell, PRESETS } from "../_shared";

export function V4Modal() {
  return (
    <MockupShell active="v4">
      <div className="w-full max-w-[820px] overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,41,0.35)]">
        <div className="grid grid-cols-[280px_1fr]">
          {/* LEFT — provider list */}
          <aside className="border-r border-gray-100 bg-gray-50/60 p-4">
            <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Provider
            </div>
            <div className="space-y-1">
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-[13px] ${
                    i === 0
                      ? "bg-white text-ink shadow-[inset_3px_0_0_#0d4b3a]"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-md bg-gray-200" />
                    <span className="font-medium">{p.label}</span>
                  </div>
                  {i === 0 && <IconCheck size={14} stroke={3} className="text-[#0d4b3a]" />}
                </button>
              ))}
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] text-gray-600 hover:bg-white">
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-400">
                  +
                </div>
                <span>Custom Server</span>
              </button>
            </div>
          </aside>

          {/* RIGHT — credential form */}
          <div className="relative">
            <button className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100">
              <IconX size={18} />
            </button>
            <div className="px-8 py-7">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
                Fastmail
              </div>
              <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-ink">
                Sign In With Fastmail
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500">
                The platform connects to Fastmail&apos;s IMAP and SMTP
                servers. You stay in control of the underlying inbox.
              </p>

              <div className="mt-7 space-y-4">
                <Field label="Email Address" placeholder="you@fastmail.com" />
                <Field label="App Password" placeholder="Generated from Fastmail Settings" type="password" />
              </div>

              <div className="mt-7 rounded-md border border-gray-100 bg-gray-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Server Defaults
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-gray-600">
                  <div>IMAP imap.fastmail.com:993</div>
                  <div>SMTP smtp.fastmail.com:465</div>
                  <div>Encryption SSL/TLS</div>
                  <div>Auth Plain</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-8 py-4">
              <button className="h-10 w-32 rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink">
                Cancel
              </button>
              <button className="h-10 w-40 rounded-md btn-primary text-[13px] font-medium text-white">
                Test & Connect
              </button>
            </div>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-gray-500">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="block h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-[13px] text-ink outline-none focus:border-[#0d4b3a]"
      />
    </label>
  );
}
