import Link from "next/link";
import { Wordmark } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";
import { CheckBullet, FoundersRateCard } from "../../_components/FoundersRate";

const BULLETS = [
  "Pipeline, inbox, mail, checks",
  "Day one ready",
];

export default function SignupV8Cursor() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center bg-white px-8 py-14">
        <div className="w-full max-w-[360px]">
          <div className="mb-7">
            <h1 className="m-0 text-[26px] font-semibold tracking-[-0.025em] text-[#04261c]">
              Create Your Account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              Founders Rate. $49 a month, price held for 12 months.
            </p>
          </div>

          <GoogleButton variant="dark" size="lg" />

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e5e7eb]" />
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
              Or
            </span>
            <span className="h-px flex-1 bg-[#e5e7eb]" />
          </div>

          <form className="flex flex-col gap-3.5">
            <Field label="Firm Name" />
            <Field label="Work Email" type="email" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#6b7280]">
                Password
              </label>
              <input
                type="password"
                className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#04261c]"
              />
              <p className="text-[10.5px] text-[#9ca3af]">
                12 characters or more.
              </p>
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex h-[36px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a]"
            >
              Continue To Checkout
            </button>
            <p className="text-center text-[10.5px] text-[#9ca3af]">
              Card required. Cancel anytime during the trial.
            </p>
          </form>

          <div className="mt-8 text-center text-[12px] text-[#6b7280]">
            Have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#04261c] hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden p-14 lg:flex"
      style={{
        background:
          "linear-gradient(180deg, #04261c 0%, #051a14 60%, #02100c 100%)",
      }}
    >
      <div>
        <Wordmark size="md" tone="dark" />
      </div>

      <div className="max-w-[420px] text-white">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/45">
          Now In Public Beta
        </div>
        <h2 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.03em]">
          One workspace.
          <br />
          <span className="text-white/55">Every case.</span>
        </h2>

        <div className="mt-8 flex flex-col gap-3">
          {BULLETS.map((b) => (
            <CheckBullet key={b} tone="dark">
              {b}
            </CheckBullet>
          ))}
        </div>
      </div>

      <div className="max-w-[340px]">
        <FoundersRateCard tone="dark" />
      </div>
    </div>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-[#6b7280]">{label}</label>
      <input
        type={type}
        className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#04261c]"
      />
    </div>
  );
}
