"use client";

import Link from "next/link";

const STEPS = [
  { slug: "firm", label: "Firm" },
  { slug: "import", label: "Import" },
  { slug: "inbox", label: "Inbox" },
  { slug: "team", label: "Team" },
] as const;

export type StepSlug = (typeof STEPS)[number]["slug"];

export function StepShell({
  step,
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryPending,
  skipHref,
}: {
  step: StepSlug;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryPending?: boolean;
  skipHref?: string;
}) {
  const stepIndex = STEPS.findIndex((s) => s.slug === step);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#13644e]">
        Step {stepIndex + 1} Of {STEPS.length}
      </div>
      <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#04261c]">
        {title}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
        {subtitle}
      </p>

      <div className="mt-10 flex flex-1 flex-col">{children}</div>

      <div className="mt-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s.slug}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex
                  ? "w-6 bg-[#04261c]"
                  : i < stepIndex
                  ? "w-3 bg-[#13644e]"
                  : "w-3 bg-[#e5e7eb]"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {skipHref && (
            <Link
              href={skipHref}
              className="text-[12.5px] text-[#6b7280] hover:text-[#04261c]"
            >
              Skip
            </Link>
          )}
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled || primaryPending}
            className="inline-flex h-[36px] min-w-[140px] items-center justify-center rounded-[6px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a] disabled:opacity-50"
          >
            {primaryPending ? "Saving" : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
