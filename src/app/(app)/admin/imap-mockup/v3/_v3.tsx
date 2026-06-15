"use client";

import { IconX } from "@tabler/icons-react";
import { MockupShell, PRESETS } from "../_shared";

export function V3Modal() {
  return (
    <MockupShell active="v3">
      <div className="w-full max-w-[620px] overflow-hidden rounded-md border border-gray-700 bg-[#0a0a0c] text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#4dd1a5]">
              email:connect
            </span>
            <span className="font-mono text-[11px] text-white/40">
              imap + smtp
            </span>
          </div>
          <button className="text-white/40 hover:text-white">
            <IconX size={16} />
          </button>
        </div>

        <div className="px-6 py-6">
          <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-[-0.01em]">
            Connect Inbox
          </h2>
          <p
            className="mt-1.5 text-[12px] text-white/55"
            style={{ fontFamily: "monospace" }}
          >
            // Server credentials. Tested before save.
          </p>

          <div
            className="mt-6 flex flex-wrap gap-1.5 text-[11px]"
            style={{ fontFamily: "monospace" }}
          >
            <span className="text-white/40">presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className="rounded-[3px] border border-gray-700 bg-white/[0.03] px-2 py-0.5 text-white/80 hover:bg-white/[0.07]"
              >
                {p.label.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <DenseField label="address" placeholder="you@example.com" />
            <DenseField label="display_name" placeholder="Your Name" />
          </div>

          <div className="my-5 border-t border-gray-800 pt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#4dd1a5]">
            ▸ Incoming · IMAP
          </div>
          <div className="grid grid-cols-[1fr_100px_120px] gap-3">
            <DenseField label="host" placeholder="imap.fastmail.com" />
            <DenseField label="port" placeholder="993" />
            <DenseField label="security" placeholder="SSL/TLS" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <DenseField label="username" placeholder="you@example.com" />
            <DenseField label="password" placeholder="••••••" type="password" />
          </div>

          <div className="my-5 border-t border-gray-800 pt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#4dd1a5]">
            ▸ Outgoing · SMTP
          </div>
          <div className="grid grid-cols-[1fr_100px_120px] gap-3">
            <DenseField label="host" placeholder="smtp.fastmail.com" />
            <DenseField label="port" placeholder="465" />
            <DenseField label="security" placeholder="SSL/TLS" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-800 bg-black/30 px-6 py-3">
          <div
            className="text-[11px] text-white/50"
            style={{ fontFamily: "monospace" }}
          >
            ↵ test_and_connect
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-9 w-28 rounded-[4px] border border-gray-700 bg-white/[0.03] text-[12px] text-white/80 hover:bg-white/[0.07]"
              style={{ fontFamily: "monospace" }}
            >
              cancel
            </button>
            <button
              className="h-9 w-28 rounded-[4px] bg-[#4dd1a5] text-[12px] font-semibold text-[#02100c] hover:bg-[#5ce1b5]"
              style={{ fontFamily: "monospace" }}
            >
              connect →
            </button>
          </div>
        </div>
      </div>
    </MockupShell>
  );
}

function DenseField({
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
      <span
        className="mb-1 block text-[10px] uppercase tracking-[0.1em] text-white/40"
        style={{ fontFamily: "monospace" }}
      >
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="block h-9 w-full rounded-[4px] border border-gray-700 bg-black/30 px-2.5 text-[12.5px] text-white outline-none placeholder:text-white/30 focus:border-[#4dd1a5]"
        style={{ fontFamily: "monospace" }}
      />
    </label>
  );
}
