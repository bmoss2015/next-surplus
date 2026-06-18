import Link from "next/link";
import { BrandLogo } from "../../_components/BrandLogo";
import { GoogleButton } from "../../_components/GoogleButton";

const ASSURANCES = [
  "Full access to every feature during the trial",
  "Card required at signup, cancel anytime in the first 14 days",
  "Founders Rate locked for 12 months",
  "No setup fee, no per seat charges",
];

export default function SignupV13Mercury() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center bg-white px-10 py-16">
        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em] text-[#04261c]">
              Create your account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              The operations platform for surplus recovery firms.
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <Field label="Firm Name" />
            <Field label="Work Email" type="email" />
            <PasswordField />
            <button
              type="submit"
              className="mt-2 inline-flex h-[42px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[14px] font-medium text-white hover:bg-[#0d4b3a]"
            >
              Continue To Checkout
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e5e7eb]" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
              Or
            </span>
            <span className="h-px flex-1 bg-[#e5e7eb]" />
          </div>

          <GoogleButton variant="outline" size="lg" />

          <div className="mt-8 text-[12.5px] text-[#6b7280]">
            Have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#04261c] hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
      <BrandPanel />
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden px-14 py-14 lg:flex"
      style={{
        background:
          "linear-gradient(220deg, #02100c 0%, #04261c 55%, #0a3d2d 100%)",
      }}
    >
      <div className="flex justify-end">
        <BrandLogo size="md" tone="dark" variant="wordmark" />
      </div>

      <div className="text-white">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4a9c75]">
          Founders Rate
        </div>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-[92px] font-semibold leading-none tracking-[-0.03em] text-white">
            $49
          </span>
          <span className="text-[20px] text-white/70">/ month</span>
        </div>
        <div className="mt-4 text-[14px] leading-relaxed text-white/75">
          Price held for 12 months. Founders pricing closes when the
          public window ends.
        </div>

        <div className="mt-10 flex flex-col gap-4">
          {ASSURANCES.map((line) => (
            <Check key={line}>{line}</Check>
          ))}
        </div>
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#4a9c75]" />
        Limited Window
      </div>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-[14px] leading-relaxed text-white">
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden
        className="mt-1 flex-shrink-0"
      >
        <circle cx="9" cy="9" r="8" stroke="#4a9c75" strokeWidth="1.5" />
        <path
          d="M5.5 9.2L8 11.7L12.5 7"
          stroke="#4a9c75"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </div>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-[#374151]">{label}</label>
      <input
        type={type}
        className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
      />
    </div>
  );
}

function PasswordField() {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11.5px] font-medium text-[#374151]">Password</label>
      <input
        type="password"
        className="h-[38px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
      />
      <p className="text-[11px] text-[#9ca3af]">12 characters or more.</p>
    </div>
  );
}
