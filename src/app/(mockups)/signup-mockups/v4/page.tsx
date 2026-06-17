import Link from "next/link";
import { DiamondMark, Wordmark } from "../../_components/BrandMark";
import { GoogleButton } from "../../_components/GoogleButton";
import { PasswordField } from "../../_components/PasswordField";

export default function SignupV4Supabase() {
  return (
    <div className="grid min-h-[calc(100vh-49px)] grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center bg-white px-8 py-14">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-3">
            <DiamondMark size="md" />
            <Wordmark size="md" />
          </div>

          <div className="mb-6">
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#04261c]">
              Create Your Account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
              14 day free trial. $49 a month, locked for 12 months.
            </p>
          </div>

          <form className="flex flex-col gap-4">
            <Field label="Firm Name" />
            <Field label="Work Email" type="email" />
            <PasswordField tone="supabase" />
            <button
              type="submit"
              className="mt-2 inline-flex h-[38px] w-full items-center justify-center rounded-[7px] bg-[#04261c] text-[13.5px] font-medium text-white hover:bg-[#0d4b3a]"
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
              href="/login-mockups/v4"
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
          "linear-gradient(220deg, #04261c 0%, #0d4b3a 70%, #13644e 100%)",
      }}
    >
      <div className="flex justify-end">
        <div className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/70">
          Founders Rate
        </div>
      </div>

      <div className="text-white">
        <h2 className="m-0 text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]">
          Everything your firm needs to recover surplus, in one workspace.
        </h2>
        <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-white/70">
          Stop juggling spreadsheets and sticky notes. Run pipeline,
          inbox, mail, and verified checks from a single place.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <FeatureRow title="Lead Pipeline" sub="Drag and drop kanban with stage automation" />
          <FeatureRow title="Threaded Inbox" sub="Gmail, Outlook, IMAP, all in one place" />
          <FeatureRow title="Mail + Checks" sub="Physical letters and verified checks without leaving the app" />
          <FeatureRow title="Audit Trail" sub="Every stage change logged automatically" />
        </div>
      </div>

      <div />

    </div>
  );
}

function FeatureRow({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#4a9c75]" />
      <div className="flex flex-col">
        <div className="text-[12.5px] font-semibold text-white">{title}</div>
        <div className="text-[11.5px] leading-relaxed text-white/65">{sub}</div>
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
        className="h-[34px] w-full rounded-[7px] border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#04261c] outline-none placeholder:text-[#9ca3af] focus:border-[#13644e]"
      />
    </div>
  );
}
