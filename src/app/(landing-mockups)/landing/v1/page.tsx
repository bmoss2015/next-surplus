import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus | v1 Linear",
};

export default function LandingV1() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(ellipse at top, #0d4b3a 0%, #051a14 55%, #02100c 100%)",
      }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-6">
        <div className="text-[15px] font-semibold tracking-tight">
          Next Surplus
        </div>
        <nav className="flex items-center gap-8 text-[12.5px] text-white/70">
          <a className="hover:text-white">Product</a>
          <a className="hover:text-white">Pricing</a>
          <a className="hover:text-white">Customers</a>
          <Link href="/login" className="hover:text-white">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#0d4b3a] hover:bg-white/90"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-8 pt-24 pb-32 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4dd1a5]" />
          New: Outlook inbox sync
        </div>
        <h1 className="m-0 text-[64px] font-semibold leading-[1.05] tracking-[-0.03em]">
          Surplus funds recovery,
          <br />
          <span className="text-white/60">run end to end.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-[16.5px] leading-relaxed text-white/65">
          Lead pipeline, inbox sync, physical mail, checks, and case
          tracking in one place. Built for recovery firms who do not have
          time for five tools and a spreadsheet.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-md bg-white px-6 text-[14px] font-medium text-[#0d4b3a] hover:bg-white/90"
          >
            Start Free
          </Link>
          <a className="inline-flex h-11 items-center rounded-md border border-white/20 bg-white/5 px-6 text-[14px] font-medium text-white hover:bg-white/10">
            Book a Demo
          </a>
        </div>
        <div className="mt-5 text-[11px] uppercase tracking-[0.16em] text-white/40">
          $69 per Month, Unlimited Users, No Per Seat Fees
        </div>
      </main>

      <section className="mx-auto max-w-6xl px-8 pb-32">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
          {[
            ["Lead Pipeline", "Track every case from sale to payout."],
            ["Inbox Sync", "Gmail and Outlook, threaded to the lead."],
            ["Physical Mail", "Letters and checks without leaving."],
            ["Bank Verification", "Plaid linked, micro deposits handled."],
            ["Templates", "Reusable letters with merge fields."],
            ["Audit Trail", "Every stage change logged automatically."],
          ].map(([title, desc]) => (
            <div key={title} className="bg-[#051a14] p-7">
              <div className="text-[13px] font-semibold tracking-tight">
                {title}
              </div>
              <div className="mt-2 text-[12.5px] leading-relaxed text-white/60">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
