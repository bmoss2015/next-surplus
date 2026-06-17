import Link from "next/link";
import { LockupHorizontal } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";

export default function LoginV1Linear() {
  return (
    <div className="flex min-h-[calc(100vh-49px)] items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[360px]">
        <div className="mb-10 flex justify-center">
          <LockupHorizontal size="md" />
        </div>

        <div className="mb-7 text-center">
          <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Welcome Back
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#6b7280]">
            Sign in to your Next Surplus workspace.
          </p>
        </div>

        <GoogleButton variant="outline" />

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">
            Or
          </span>
          <span className="h-px flex-1 bg-[#e5e7eb]" />
        </div>

        <form className="flex flex-col gap-3.5">
          <Field label="Work Email" type="email" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[11px] font-medium text-[#6b7280]">
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
              className="h-[32px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
            />
          </div>
          <button
            type="submit"
            className="mt-2 inline-flex h-[34px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a]"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center text-[12px] text-[#6b7280]">
          No account yet?{" "}
          <Link
            href="/signup-mockups/v1"
            className="font-medium text-[#04261c] hover:underline"
          >
            Create One
          </Link>
        </div>

        <div className="mt-10 flex justify-center gap-4 text-[10.5px] text-[#9ca3af]">
          <Link href="/terms" className="hover:text-[#04261c]">
            Terms
          </Link>
          <span aria-hidden>&middot;</span>
          <Link href="/privacy" className="hover:text-[#04261c]">
            Privacy
          </Link>
        </div>
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
        className="h-[32px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
      />
    </div>
  );
}
