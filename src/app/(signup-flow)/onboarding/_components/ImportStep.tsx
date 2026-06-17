"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepShell } from "./StepShell";

export function ImportStep() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);

  function next() {
    router.push("/onboarding/inbox");
  }

  return (
    <StepShell
      step="import"
      title="Import Your Leads"
      subtitle="Upload a CSV of cases you are already tracking. We will map columns on the next screen. Or skip and add leads one by one."
      primaryLabel={file ? "Upload And Continue" : "Continue"}
      onPrimary={next}
      skipHref="/onboarding/inbox"
    >
      <label
        className="flex flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed border-[#e5e7eb] bg-[#fafbfc] px-6 py-10 text-center hover:border-[#13644e]"
      >
        <UploadIcon />
        <div className="text-[13.5px] font-medium text-[#04261c]">
          {file ? file.name : "Drop A CSV Here Or Click To Browse"}
        </div>
        <div className="text-[11.5px] text-[#6b7280]">
          Comma separated. Up to 50 megabytes. We will map columns on the next
          screen.
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Hint label="Owner Name" sub="Required" />
        <Hint label="Property Address" sub="Required" />
        <Hint label="Surplus Amount" sub="Optional" />
      </div>
    </StepShell>
  );
}

function Hint({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="rounded-[6px] border border-[#e5e7eb] bg-white p-3">
      <div className="text-[12px] font-medium text-[#04261c]">{label}</div>
      <div className="text-[10.5px] text-[#6b7280]">{sub}</div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12m0-12l-4 4m4-4l4 4M4 18v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="#04261c"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
