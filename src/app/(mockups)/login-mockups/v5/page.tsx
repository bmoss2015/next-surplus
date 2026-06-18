import Link from "next/link";
import { LockupStacked } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";

export default function LoginV5Folk() {
  return (
    <div className="flex min-h-[calc(100vh-49px)] items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-12 flex justify-center">
          <LockupStacked size="xl" />
        </div>

        <div className="mb-9 text-center">
          <h1 className="m-0 text-[28px] font-semibold tracking-[-0.025em] text-[#04261c]">
            Welcome Back
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-[#6b7280]">
            Sign in to your Next Surplus workspace.
          </p>
        </div>

        <form className="flex flex-col gap-6">
          <Field label="Work Email" type="email" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
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
              className="h-[34px] w-full border-0 border-b border-[#d1d5db] bg-transparent px-0 text-[14px] text-[#04261c] outline-none focus:border-[#04261c]"
            />
          </div>
          <button
            type="submit"
            className="mt-4 inline-flex h-[40px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13.5px] font-medium text-white hover:bg-[#0d4b3a]"
          >
            Sign In
          </button>
        </form>

        <div className="my-8 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
            Or
          </span>
          <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <GoogleButton variant="outline" size="lg" />

        <div className="mt-12 text-center text-[12.5px] text-[#6b7280]">
          No account yet?{" "}
          <Link
            href="/signup-mockups/v5"
            className="font-medium text-[#04261c] hover:underline"
          >
            Create One
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </label>
      <input
        type={type}
        className="h-[34px] w-full border-0 border-b border-[#d1d5db] bg-transparent px-0 text-[14px] text-[#04261c] outline-none focus:border-[#04261c]"
      />
    </div>
  );
}
