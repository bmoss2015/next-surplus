import Link from "next/link";
import type { Metadata } from "next";
import { Logomark, StepProgress, DOT_BG } from "./_components/Shared";
import { Step1 } from "./_components/Step1";
import { Step2 } from "./_components/Step2";
import { Step3 } from "./_components/Step3";

export const metadata: Metadata = {
  title: "Power Dialer Setup · Wizard | Next Surplus",
};

export default function SetupAFullPage() {
  return (
    <div className={`min-h-screen ${DOT_BG} bg-[#FAFAFA]`}>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-7 py-4">
          <div className="flex items-center gap-5">
            <Link
              href="/share/dialer-mockup-final"
              className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
            >
              ← Back to Dialer
            </Link>
            <Logomark />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Pre Session Setup · Wizard
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-7 pb-10 pt-7">
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
          Power Dialer Setup
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13px] text-gray-600">
          Three steps. Pick the leads you want to call, dial in how the session
          runs, and choose what email goes out after each call outcome.
        </p>

        <StepBlock label="Step 1 of 3" title="Pick Leads" current={1}>
          <Step1 />
        </StepBlock>

        <StepBlock label="Step 2 of 3" title="Call Settings" current={2}>
          <Step2 />
        </StepBlock>

        <StepBlock label="Step 3 of 3" title="Auto Follow Up" current={3}>
          <Step3 />
        </StepBlock>
      </div>
    </div>
  );
}

function StepBlock({
  label,
  title,
  current,
  children,
}: {
  label: string;
  title: string;
  current: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first-of-type:mt-7">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            {label}
          </div>
          <h2 className="m-0 mt-1 text-[22px] font-semibold tracking-tight text-ink">
            {title}
          </h2>
        </div>
        <StepProgress current={current} />
      </div>
      {children}
    </section>
  );
}
