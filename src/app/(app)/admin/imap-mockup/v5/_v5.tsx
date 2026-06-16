"use client";

import { IconX, IconArrowLeft } from "@tabler/icons-react";
import { MockupShell, PRESETS } from "../_shared";

const ALL_PROVIDERS = [
  ...PRESETS,
  { label: "Google", host: "imap.gmail.com" },
  { label: "Microsoft", host: "outlook.office365.com" },
  { label: "Proton", host: "127.0.0.1" },
  { label: "Custom", host: "" },
];

export function V5Modal() {
  return (
    <MockupShell active="v5">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-[0_30px_70px_-15px_rgba(15,23,41,0.45)]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <button className="flex items-center gap-1.5 text-[12.5px] font-medium text-gray-500 hover:text-ink">
            <IconArrowLeft size={14} stroke={2} />
            Back
          </button>
          <div className="text-[13px] font-semibold text-ink">
            Add Mail Account
          </div>
          <button className="text-gray-400 hover:text-ink">
            <IconX size={18} />
          </button>
        </div>

        <div className="px-7 py-7 text-center">
          <h2 className="m-0 text-[19px] font-semibold tracking-tight text-ink">
            Pick A Provider
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed text-gray-500">
            Choose your inbox provider. We will fill in the server
            settings automatically.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 px-7 pb-7">
          {ALL_PROVIDERS.slice(0, 9).map((p) => (
            <button
              key={p.label}
              className="group flex aspect-square flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-[#0d4b3a] hover:shadow-[0_8px_24px_-6px_rgba(13,75,58,0.25)]"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-[12.5px] font-semibold text-ink">
                {p.label.slice(0, 1)}
              </div>
              <div className="text-[11.5px] font-medium text-ink">
                {p.label}
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-7 py-3 text-center text-[11px] text-gray-500">
          Other server? Pick Custom on the next row.
        </div>
      </div>
    </MockupShell>
  );
}
