import Link from "next/link";
import { LockupStacked } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";
import { PasswordField } from "../../_components/PasswordField";

export default function SignupV3Vercel() {
  return (
    <div className="flex min-h-[calc(100vh-49px)] flex-col items-center justify-center bg-white px-6 py-14">
      <div className="mb-10 flex justify-center">
        <LockupStacked size="lg" />
      </div>

      <div className="w-full max-w-[400px] rounded-[10px] border border-[#e5e7eb] bg-white p-7">
        <div className="mb-6 text-center">
          <h1 className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#04261c]">
            Create Your Account
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6b7280]">
            14 day free trial. $49 a month, locked for 12 months.
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
          <Field label="Firm Name" />
          <Field label="Work Email" type="email" />
          <PasswordField tone="vercel" />
          <button
            type="submit"
            className="mt-2 inline-flex h-[34px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13px] font-medium text-white hover:bg-[#0d4b3a]"
          >
            Continue To Checkout
          </button>
          <p className="mt-1 text-center text-[10.5px] leading-relaxed text-[#9ca3af]">
            Card required at signup. Cancel anytime during the trial.
          </p>
        </form>

        <div className="mt-7 text-center text-[12px] text-[#6b7280]">
          Have an account?{" "}
          <Link
            href="/login-mockups/v3"
            className="font-medium text-[#04261c] hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="mt-10 flex max-w-[400px] flex-col items-center gap-4 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
          Built For Surplus Recovery Firms In
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11.5px] font-medium text-[#374151]">
          <span>South Carolina</span>
          <span aria-hidden className="text-[#d1d5db]">|</span>
          <span>Tennessee</span>
          <span aria-hidden className="text-[#d1d5db]">|</span>
          <span>Pennsylvania</span>
          <span aria-hidden className="text-[#d1d5db]">|</span>
          <span>Ohio</span>
          <span aria-hidden className="text-[#d1d5db]">|</span>
          <span>New York</span>
        </div>
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
        className="h-[32px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#04261c]"
      />
    </div>
  );
}
