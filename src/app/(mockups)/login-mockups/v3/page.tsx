import Link from "next/link";
import { LockupStacked } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";

export default function LoginV3Stripe() {
  return (
    <div className="flex min-h-[calc(100vh-49px)] flex-col items-center justify-center bg-[#fafbfc] px-6 py-14">
      <div className="mb-8">
        <LockupStacked size="md" />
      </div>

      <div className="w-full max-w-[360px] rounded-[10px] border border-[#e5e7eb] bg-white p-6">
        <div className="mb-5 text-center">
          <h1 className="m-0 text-[18px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b7280]">
            Sign in to your Next Surplus workspace.
          </p>
        </div>

        <GoogleButton variant="outline" size="sm" />

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
            Or
          </span>
          <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <form className="flex flex-col gap-3">
          <Field label="Work Email" type="email" />
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <label className="text-[11px] font-semibold text-[#04261c]">
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
              className="h-[32px] w-full rounded-[5px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
            />
          </div>
          <button
            type="submit"
            className="mt-2 inline-flex h-[34px] w-full items-center justify-center rounded-[5px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a]"
          >
            Sign In
          </button>
        </form>
      </div>

      <div className="mt-6 text-[12px] text-[#6b7280]">
        No account yet?{" "}
        <Link
          href="/signup-mockups/v3"
          className="font-medium text-[#04261c] hover:underline"
        >
          Create One
        </Link>
      </div>

      <div className="mt-10 flex gap-4 text-[10.5px] text-[#9ca3af]">
        <Link href="/terms" className="hover:text-[#04261c]">
          Terms
        </Link>
        <span aria-hidden>&middot;</span>
        <Link href="/privacy" className="hover:text-[#04261c]">
          Privacy
        </Link>
      </div>
    </div>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-[#04261c]">{label}</label>
      <input
        type={type}
        className="h-[32px] w-full rounded-[5px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
      />
    </div>
  );
}
