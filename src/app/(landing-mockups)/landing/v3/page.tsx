import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus | v3 Vercel",
};

export default function LandingV3() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rotate-45 bg-white" />
            <div className="text-[14px] font-semibold tracking-tight">
              Next Surplus
            </div>
          </div>
          <nav className="flex items-center gap-6 text-[12.5px] text-white/60">
            <a className="hover:text-white">Features</a>
            <a className="hover:text-white">Pricing</a>
            <a className="hover:text-white">Changelog</a>
            <a className="hover:text-white">Docs</a>
            <Link href="/login" className="hover:text-white">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-white px-3 py-1.5 text-[12.5px] font-medium text-black hover:bg-white/90"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-28 pb-24">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1 text-[11px] font-medium text-white/60">
            <span className="text-[#4dd1a5]">✓</span> Now in public beta
          </div>
          <h1
            className="m-0 text-[72px] font-bold leading-[0.95] tracking-[-0.04em]"
            style={{ fontFeatureSettings: "'ss01'" }}
          >
            Recovery firms,
            <br />
            shipped.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-[15.5px] leading-relaxed text-white/55">
            Surplus funds recovery operations on one platform. Built
            for the speed and reliability your case load needs.
          </p>
          <div className="mt-9 flex items-center justify-center gap-2">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-md bg-white px-5 text-[13px] font-medium text-black hover:bg-white/90"
            >
              Start Building →
            </Link>
            <a className="inline-flex h-10 items-center rounded-md border border-white/15 bg-transparent px-5 text-[13px] font-medium text-white hover:bg-white/5">
              View Documentation
            </a>
          </div>
        </div>

        <div
          className="mt-20 rounded-xl border border-white/10 bg-[#0a0a0a] p-6"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <div className="mb-3 flex items-center gap-2 text-[11px] text-white/40">
            <span className="h-2 w-2 rounded-full bg-[#4dd1a5]" />
            terminal
          </div>
          <pre className="overflow-x-auto text-[12.5px] leading-relaxed text-white/85">
            <code>{`$ next-surplus leads list --stage prospect
LEAD_ID    OWNER              SURPLUS    STAGE        AGE
L-0042     Margaret Chen      $42,310    Prospect     6d
L-0044     David Rodriguez    $28,540    Prospect     12d
L-0046     Patricia Williams  $61,200    Outreach     3d
L-0051     James O'Brien      $19,180    Returned     22d

$ next-surplus mail send --template estate_notification --batch
Sent: 4 letters, $7.42 total. Track at /mail.`}</code>
          </pre>
        </div>
      </main>

      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-4 px-6">
          {[
            ["7k+", "Letters Sent"],
            ["18", "States Covered"],
            ["99.97%", "Uptime"],
            ["$49", "Per Month"],
          ].map(([num, label]) => (
            <div
              key={label}
              className="border-r border-white/10 px-6 py-12 last:border-r-0"
            >
              <div className="text-[40px] font-semibold tracking-tight">
                {num}
              </div>
              <div className="mt-2 text-[12px] uppercase tracking-[0.14em] text-white/40">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
