import Link from "next/link";
import { LockupHorizontal } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";
import { PasswordField } from "../../_components/PasswordField";

const WHAT_YOU_GET = [
  "Unlimited leads and cases",
  "Verified checks and letters from your inbox",
  "Gmail, Outlook, and IMAP threaded inbox",
  "Stage automation and audit trail",
  "Team seats and shared playbooks",
  "Onboarding without an account manager",
];

export default function SignupV5Pipedrive() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <div className="flex items-center justify-center bg-white px-8 py-14">
        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <LockupHorizontal size="md" />
          </div>

          <div className="mb-6">
            <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#04261c]">
              Create Your Account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              14 day free trial. $49 a month, locked for 12 months.
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <Field label="Firm Name" />
            <Field label="Work Email" type="email" />
            <PasswordField tone="pipedrive" />
            <button
              type="submit"
              className="mt-2 inline-flex h-[38px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13.5px] font-medium text-white hover:bg-[#0d4b3a]"
            >
              Continue To Checkout
            </button>
            <p className="text-[11px] leading-relaxed text-[#9ca3af]">
              Card required at signup. Cancel anytime during the trial.
            </p>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e5e7eb]" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
              Or
            </span>
            <span className="h-px flex-1 bg-[#e5e7eb]" />
          </div>

          <GoogleButton variant="outline" size="lg" />

          <div className="mt-7 text-[12.5px] text-[#6b7280]">
            Have an account?{" "}
            <Link
              href="/login-mockups/v5"
              className="font-medium text-[#04261c] hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden flex-col justify-center bg-[#fafbfc] px-12 py-14 lg:flex">
        <div className="max-w-[420px]">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#13644e]">
            What You Get
          </div>
          <h2 className="mt-3 text-[26px] font-semibold leading-[1.18] tracking-[-0.02em] text-[#04261c]">
            Everything to run a surplus recovery firm, day one.
          </h2>
          <div className="mt-7 flex flex-col gap-3">
            {WHAT_YOU_GET.map((line) => (
              <div
                key={line}
                className="flex items-start gap-3 text-[13px] text-[#04261c]"
              >
                <CheckIcon />
                <span>{line}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[8px] border border-[#e5e7eb] bg-white p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04261c]">
              Founders Rate
            </div>
            <div className="mt-2 text-[15px] font-medium text-[#04261c]">
              $49 a month, locked for 12 months.
            </div>
            <div className="mt-1 text-[12px] text-[#6b7280]">
              No setup fee. 14 day free trial.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="mt-0.5 flex-shrink-0"
    >
      <circle cx="8" cy="8" r="8" fill="#04261c" />
      <path
        d="M5 8.5L7 10.5L11 6"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Field({
  label,
  type = "text",
}: {
  label: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-[#374151]">{label}</label>
      <input
        type={type}
        className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#13644e]"
      />
    </div>
  );
}
