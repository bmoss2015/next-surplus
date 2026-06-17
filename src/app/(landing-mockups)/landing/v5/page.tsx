import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus | v5 Anthropic",
};

export default function LandingV5() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <div
            className="text-[18px] tracking-tight"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 500,
            }}
          >
            Next Surplus
          </div>
          <nav className="flex items-center gap-7 text-[13px] text-ink/70">
            <a className="hover:text-ink">Product</a>
            <a className="hover:text-ink">Pricing</a>
            <a className="hover:text-ink">Customers</a>
            <a className="hover:text-ink">Writing</a>
            <Link href="/login" className="hover:text-ink">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-ink px-3.5 py-1.5 text-[12.5px] font-medium text-ink hover:bg-ink hover:text-white"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 pt-32 pb-28">
        <div className="mb-6 text-[12px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
          Operations Platform
        </div>
        <h1
          className="m-0 text-[68px] leading-[1.04] tracking-[-0.022em] text-ink"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
          }}
        >
          A quieter way to run a surplus recovery firm.
        </h1>
        <p className="mt-8 max-w-2xl text-[17px] leading-[1.6] text-ink/65">
          We built Next Surplus for recovery operators who think
          carefully about every case. Lead pipeline, threaded inbox,
          physical mail, and verified check sending live in one
          deliberately small surface area.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-md bg-ink px-6 text-[14px] font-medium text-white hover:bg-ink/90"
          >
            Start Free
          </Link>
          <a className="inline-flex items-center gap-2 text-[14px] font-medium text-ink/70 hover:text-ink">
            Read the introduction →
          </a>
        </div>
      </main>

      <section className="border-t border-gray-200">
        <div className="mx-auto max-w-3xl px-8 py-20">
          <div className="mb-12 grid grid-cols-[200px_1fr] gap-12">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/40">
              What it is
            </div>
            <div className="text-[16px] leading-[1.7] text-ink/80">
              A complete operations platform for surplus funds recovery.
              Manage leads, sync your inbox, send physical mail and
              checks, and track every case in one place.
            </div>
          </div>
          <div className="mb-12 grid grid-cols-[200px_1fr] gap-12">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/40">
              Who it is for
            </div>
            <div className="text-[16px] leading-[1.7] text-ink/80">
              Solo operators and small firms recovering excess proceeds
              from tax sales and mortgage foreclosures across the United
              States.
            </div>
          </div>
          <div className="mb-12 grid grid-cols-[200px_1fr] gap-12">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/40">
              Pricing
            </div>
            <div className="text-[16px] leading-[1.7] text-ink/80">
              $49 per month, every user included. Mail is billed at cost
              plus 20% per piece, transparent on every invoice.
            </div>
          </div>
          <div className="grid grid-cols-[200px_1fr] gap-12">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/40">
              Where to start
            </div>
            <div className="text-[16px] leading-[1.7] text-ink/80">
              <Link
                href="/signup"
                className="text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-4 hover:decoration-[#0d4b3a]"
              >
                Sign up for an account
              </Link>{" "}
              and import your first batch of leads. Most operators are
              sending their first letter within ten minutes.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
