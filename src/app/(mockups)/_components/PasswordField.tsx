"use client";

import { useState } from "react";

type Tone = "linear" | "attio" | "supabase" | "stripe" | "folk" | "vercel" | "pipedrive";

const STYLES: Record<Tone, { input: string; label: string; ring: string; bar: string }> = {
  linear: {
    input:
      "w-full border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#13644e]",
    label: "text-[11px] font-medium text-[#6b7280]",
    ring: "h-[32px] rounded-[6px]",
    bar: "bg-[#13644e]",
  },
  attio: {
    input:
      "w-full border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#04261c]",
    label: "text-[11px] font-medium text-[#04261c]",
    ring: "h-[34px] rounded-[6px]",
    bar: "bg-[#04261c]",
  },
  supabase: {
    input:
      "w-full border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#13644e]",
    label: "text-[11.5px] font-medium text-[#374151]",
    ring: "h-[34px] rounded-[7px]",
    bar: "bg-[#13644e]",
  },
  stripe: {
    input:
      "w-full border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#13644e]",
    label: "text-[11px] font-semibold text-[#04261c]",
    ring: "h-[32px] rounded-[5px]",
    bar: "bg-[#13644e]",
  },
  folk: {
    input:
      "w-full border-0 border-b border-[#d1d5db] bg-transparent px-0 text-[14px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#04261c]",
    label: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]",
    ring: "h-[34px] rounded-none",
    bar: "bg-[#04261c]",
  },
  vercel: {
    input:
      "w-full border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#04261c]",
    label: "text-[11.5px] font-medium text-[#374151]",
    ring: "h-[32px] rounded-[6px]",
    bar: "bg-[#04261c]",
  },
  pipedrive: {
    input:
      "w-full border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#13644e]",
    label: "text-[11.5px] font-medium text-[#374151]",
    ring: "h-[34px] rounded-[6px]",
    bar: "bg-[#13644e]",
  },
};

export function PasswordField({
  tone = "linear",
  showStrength = true,
}: {
  tone?: Tone;
  showStrength?: boolean;
}) {
  const [value, setValue] = useState("");
  const s = STYLES[tone];

  const checks = [
    { ok: value.length >= 8, label: "8 characters" },
    { ok: /[A-Z]/.test(value), label: "Uppercase" },
    { ok: /[0-9]/.test(value), label: "Number" },
    { ok: /[^A-Za-z0-9]/.test(value), label: "Special" },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <label className={s.label}>Password</label>
      <input
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`${s.input} ${s.ring}`}
        placeholder=""
      />
      {showStrength && (
        <div className="mt-1 grid grid-cols-4 gap-1.5">
          {checks.map((c) => (
            <div key={c.label} className="flex flex-col gap-1">
              <div
                className={`h-[3px] rounded-full ${
                  c.ok ? s.bar : "bg-[#e5e7eb]"
                }`}
              />
              <span
                className={`text-[10px] tracking-[0.02em] ${
                  c.ok ? "text-[#04261c]" : "text-[#9ca3af]"
                }`}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
