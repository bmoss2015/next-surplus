import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus | v4 Notion",
};

export default function LandingV4() {
  return (
    <div
      className="min-h-screen text-ink"
      style={{ background: "#faf8f4" }}
    >
      <header className="border-b border-[#eee2d1]/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <div className="text-[16px] font-semibold tracking-tight">
            Next Surplus
          </div>
          <nav className="flex items-center gap-6 text-[13px] text-ink/70">
            <a className="hover:text-ink">Product</a>
            <a className="hover:text-ink">Pricing</a>
            <a className="hover:text-ink">Customers</a>
            <Link href="/login" className="hover:text-ink">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-ink px-3.5 py-1.5 text-[12.5px] font-medium text-white hover:bg-ink/90"
            >
              Get Next Surplus Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-8 pt-20 pb-28 text-center">
        <h1
          className="m-0 text-[60px] leading-[1.08] tracking-[-0.02em] text-ink"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Your recovery firm,
          <br />
          finally organized.
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-[16px] leading-relaxed text-ink/65">
          Replace the spreadsheets, the sticky notes, and the four
          separate tools you keep open. Run every case on one quiet,
          considered platform.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-md bg-ink px-6 text-[14px] font-medium text-white hover:bg-ink/90"
          >
            Try It Free
          </Link>
          <a className="text-[14px] font-medium text-ink/70 underline-offset-4 hover:text-ink hover:underline">
            Request a walkthrough →
          </a>
        </div>

        <div className="mt-20 grid grid-cols-3 gap-6 text-left">
          {[
            ["📥", "Inbox", "Gmail or Outlook, threaded to each lead automatically."],
            ["📮", "Mail", "Letters and checks. Tracked. Automatic."],
            ["📊", "Pipeline", "Customizable stages, automatic activity log."],
            ["🏦", "Bank", "Plaid linked accounts for verified check sending."],
            ["📝", "Templates", "Reusable letters with smart merge fields."],
            ["👥", "Team", "Unlimited users. Per-org workspaces. Clean roles."],
          ].map(([icon, title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-[#eee2d1] bg-white p-6"
            >
              <div className="mb-3 text-[20px]">{icon}</div>
              <div className="text-[15px] font-semibold tracking-tight">
                {title}
              </div>
              <div className="mt-1.5 text-[13px] leading-relaxed text-ink/65">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      <section className="border-t border-[#eee2d1]/60">
        <div className="mx-auto max-w-4xl px-8 py-20 text-center">
          <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/40">
            One Plan, Everything Included
          </div>
          <div
            className="mt-3 text-[44px] tracking-[-0.02em] text-ink"
            style={{ fontFamily: "Georgia, serif" }}
          >
            $69 per month
          </div>
          <p className="mx-auto mt-3 max-w-md text-[13.5px] text-ink/60">
            Unlimited users. Physical mail at cost plus 20%, billed
            monthly. No setup fees, no per seat charges.
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-flex h-11 items-center rounded-md bg-ink px-6 text-[14px] font-medium text-white hover:bg-ink/90"
          >
            Start Free
          </Link>
        </div>
      </section>
    </div>
  );
}
