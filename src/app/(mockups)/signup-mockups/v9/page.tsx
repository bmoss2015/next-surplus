import Link from "next/link";
import { Wordmark } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";
import { CheckBullet } from "../../_components/FoundersRate";

const BULLETS = [
  "Unlimited leads and cases",
  "Threaded inbox for owner outreach",
  "Verified checks and letters",
  "Stage automation",
  "Team seats and shared playbooks",
  "No setup fee",
];

export default function SignupV9LinearAlt() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
      <div className="flex items-center justify-center bg-white px-8 py-14">
        <div className="w-full max-w-[380px]">
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#13644e]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#13644e]" />
              Founders Rate
            </div>
            <h1 className="m-0 text-[24px] font-semibold tracking-[-0.025em] text-[#04261c]">
              Create Your Account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              $49 a month, price held for 12 months. 14 day free trial.
            </p>
          </div>

          <GoogleButton variant="outline" size="lg" />

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
                className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
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
            <p className="text-[10.5px] text-[#9ca3af]">
              Card required at signup. Cancel anytime during the trial.
            </p>
          </form>

          <div className="mt-8 text-[12.5px] text-[#6b7280]">
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
          "linear-gradient(150deg, #02100c 0%, #04261c 50%, #0a3d2d 100%)",
      }}
    >
      <div className="flex justify-end">
        <Wordmark size="md" tone="dark" />
      </div>

      <div className="text-white">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4a9c75]">
          What You Get
        </div>
        <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.025em]">
          Everything to run a surplus recovery firm, day one.
        </h2>

        <div className="mt-9 grid max-w-[480px] grid-cols-2 gap-x-6 gap-y-3.5">
          {BULLETS.map((b) => (
            <CheckBullet key={b} tone="dark">
              {b}
            </CheckBullet>
          ))}
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
        Limited Window
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
        className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
      />
    </div>
  );
}
