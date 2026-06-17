import Link from "next/link";
import { DiamondMark, Wordmark } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";

export default function LoginV2Attio() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex items-center justify-center bg-white px-8 py-14">
        <div className="w-full max-w-[380px]">
          <div className="mb-6">
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#04261c]">
              Welcome Back
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              Sign in to your Next Surplus workspace.
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
            <Field label="Work Email" type="email" />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <label className="text-[11px] font-medium text-[#04261c]">
                  Password
                </label>
                <Link
                  href="/forgot"
                  className="text-[11px] text-[#13644e] hover:text-[#04261c]"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#04261c]"
              />
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex h-[38px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13.5px] font-medium text-white hover:bg-[#0d4b3a]"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-[12.5px] text-[#6b7280]">
            No account yet?{" "}
            <Link
              href="/signup-mockups/v2"
              className="font-medium text-[#04261c] hover:underline"
            >
              Create One
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
          Welcome Back
        </div>
        <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em]">
          Pick up exactly
          <br />
          where you left off.
        </h2>
        <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-white/70">
          Your pipeline, your inbox, and every case file are right
          where you left them.
        </p>
      </div>

      <div className="text-[11px] text-white/40">Workflow Minds LLC, 2026</div>
    </div>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-[#04261c]">{label}</label>
      <input
        type={type}
        className="h-[34px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#04261c]"
      />
    </div>
  );
}
