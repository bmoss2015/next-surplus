import Link from "next/link";
import { DiamondMark, Wordmark } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";
import { PasswordField } from "../../_components/PasswordField";

export default function SignupV2Attio() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center bg-white px-8 py-14">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <DiamondMark size="md" />
          </div>

          <div className="mb-6">
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#04261c]">
              Create Your Account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              14 day free trial. $49 a month, locked for 12 months.
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

          <form className="flex flex-col gap-4">
            <Field label="Firm Name" />
            <Field label="Work Email" type="email" />
            <PasswordField tone="attio" />
            <button
              type="submit"
              className="mt-2 inline-flex h-[38px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13.5px] font-medium text-white hover:bg-[#0d4b3a]"
            >
              Continue To Checkout
            </button>
            <p className="mt-1 text-[11px] leading-relaxed text-[#9ca3af]">
              Card required at signup. Cancel anytime during the trial.
            </p>
          </form>

          <div className="mt-8 text-[12.5px] text-[#6b7280]">
            Have an account?{" "}
            <Link
              href="/login-mockups/v2"
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
      className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
      style={{
        background:
          "linear-gradient(160deg, #04261c 0%, #0d4b3a 70%, #13644e 100%)",
      }}
    >
      <div className="flex items-center gap-3 text-white">
        <DiamondMark size="md" tone="dark" />
        <Wordmark size="md" tone="dark" />
      </div>

      <div className="text-white">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
          The Operations Platform
        </div>
        <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em]">
          One workspace.
          <br />
          Every case.
        </h2>
        <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-white/70">
          Pipeline, threaded inbox, physical mail, and verified checks
          for surplus recovery firms. Replaces the spreadsheets, sticky
          notes, and five-tab workflow your team runs on today.
        </p>
      </div>

      <div className="grid max-w-md grid-cols-3 gap-3 text-white/80">
        <Feature label="Pipeline" />
        <Feature label="Inbox" />
        <Feature label="Mail + Checks" />
      </div>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <div className="rounded-[8px] border border-white/12 bg-white/[0.06] px-3 py-2.5 text-[11px] font-medium tracking-[0.04em]">
      {label}
    </div>
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
      <label className="text-[11px] font-medium text-[#04261c]">{label}</label>
      <input
        type={type}
        className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#04261c]"
      />
    </div>
  );
}
