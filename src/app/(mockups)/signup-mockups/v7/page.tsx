import Link from "next/link";
import { Wordmark } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";
import { CheckBullet } from "../../_components/FoundersRate";

const BULLETS = [
  "Unlimited leads and cases",
  "Verified checks from your inbox",
  "Gmail, Outlook, IMAP",
  "Stage automation and audit trail",
];

export default function SignupV7Mercury() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center bg-white px-8 py-14">
        <div className="w-full max-w-[380px]">
          <div className="mb-6">
            <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#04261c]">
              Create Your Account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              14 day free trial. Card required at signup.
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <Field label="Firm Name" />
            <Field label="Work Email" type="email" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-medium text-[#374151]">
                Password
              </label>
              <input
                type="password"
                className="h-[36px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
              />
              <p className="text-[11px] text-[#9ca3af]">
                12 characters or more.
              </p>
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex h-[40px] w-full items-center justify-center rounded-[6px] bg-[#04261c] text-[13.5px] font-medium text-white hover:bg-[#0d4b3a]"
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

          <div className="mt-7 text-[12.5px] text-[#6b7280]">
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
      className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
      style={{
        background:
          "linear-gradient(220deg, #04261c 0%, #0d4b3a 65%, #13644e 100%)",
      }}
    >
      <div className="flex justify-end">
        <Wordmark size="md" tone="dark" />
      </div>

      <div className="max-w-[440px] text-white">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#4a9c75]">
          Founders Rate
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[72px] font-semibold leading-none tracking-[-0.025em] text-white">
            $49
          </span>
          <span className="text-[18px] text-white/70">a month</span>
        </div>
        <div className="mt-3 text-[14px] leading-relaxed text-white/75">
          Price held at $49 for 12 months. After the founders window
          closes, plans return to standard pricing.
        </div>

        <div className="mt-8 flex flex-col gap-3.5">
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
      <label className="text-[11.5px] font-medium text-[#374151]">{label}</label>
      <input
        type={type}
        className="h-[36px] w-full rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none focus:border-[#13644e]"
      />
    </div>
  );
}
