import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus | v2 Stripe",
};

export default function LandingV2() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #f0fdf9 0%, #d9f5ea 35%, #b5e8d2 100%)",
        }}
      >
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-8 py-6">
          <div className="text-[16px] font-semibold tracking-tight text-[#0d4b3a]">
            Next Surplus
          </div>
          <nav className="flex items-center gap-7 text-[13px] text-ink/75">
            <a className="hover:text-ink">Product</a>
            <a className="hover:text-ink">Solutions</a>
            <a className="hover:text-ink">Pricing</a>
            <a className="hover:text-ink">Docs</a>
            <Link href="/login" className="hover:text-ink">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#0d4b3a] px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#0a3d2f]"
            >
              Get Started →
            </Link>
          </nav>
        </header>

        <main className="relative mx-auto max-w-6xl px-8 pt-16 pb-28">
          <div className="grid grid-cols-2 items-center gap-16">
            <div>
              <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.14em] text-[#0d4b3a]">
                Operations Platform For Surplus Funds Recovery
              </div>
              <h1 className="m-0 text-[52px] font-semibold leading-[1.05] tracking-[-0.02em]">
                The infrastructure for recovery firms.
              </h1>
              <p className="mt-6 text-[16px] leading-relaxed text-ink/70">
                Move every case from sale notice to payout in one
                place. Lead pipeline, threaded email, printed letters,
                checks, and bank verification, all built for how your
                team actually works.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center rounded-full bg-[#0d4b3a] px-6 text-[13.5px] font-medium text-white hover:bg-[#0a3d2f]"
                >
                  Start Free
                </Link>
                <a className="inline-flex h-11 items-center rounded-full border border-[#0d4b3a] bg-white px-6 text-[13.5px] font-medium text-[#0d4b3a] hover:bg-[#0d4b3a]/5">
                  Contact Sales
                </a>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-2 shadow-[0_30px_80px_-20px_rgba(13,75,58,0.4)]">
              <div className="overflow-hidden rounded-xl bg-gray-50">
                <div className="flex h-7 items-center gap-1.5 border-b border-gray-200 px-3">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                </div>
                <div className="grid grid-cols-[180px_1fr] gap-0">
                  <aside className="border-r border-gray-200 bg-white p-4">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                      Workspace
                    </div>
                    {["Leads", "Inbox", "Mail", "Tasks", "Settings"].map(
                      (item, i) => (
                        <div
                          key={item}
                          className={`mb-1 rounded-md px-2 py-1.5 text-[12px] ${
                            i === 0
                              ? "bg-[#0d4b3a]/10 font-medium text-[#0d4b3a]"
                              : "text-gray-600"
                          }`}
                        >
                          {item}
                        </div>
                      )
                    )}
                  </aside>
                  <div className="p-4">
                    <div className="mb-3 text-[14px] font-semibold">
                      Leads
                    </div>
                    {[
                      ["L-0042", "Margaret Chen", "$42K"],
                      ["L-0044", "David Rodriguez", "$28K"],
                      ["L-0046", "Patricia Williams", "$61K"],
                      ["L-0051", "James O'Brien", "$19K"],
                    ].map(([id, name, amt]) => (
                      <div
                        key={id}
                        className="mb-1 flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                      >
                        <div>
                          <div className="text-[11.5px] font-medium">
                            {name}
                          </div>
                          <div className="text-[10.5px] text-gray-500">
                            {id}
                          </div>
                        </div>
                        <div className="text-[11.5px] font-semibold tabular-nums text-[#0d4b3a]">
                          {amt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="mx-auto max-w-6xl px-8 py-24">
        <div className="grid grid-cols-3 gap-12">
          {[
            [
              "Lead Pipeline",
              "Every case in one place from sale notice through payout. Custom stages, automatic stage-change activity log.",
            ],
            [
              "Inbox Integration",
              "Gmail and Outlook sync directly into the platform. Threads attach to the right lead automatically.",
            ],
            [
              "Physical Mail",
              "Letters and checks sent in one click. Verified bank accounts via Plaid. Pricing is transparent cost plus 20%.",
            ],
          ].map(([title, desc]) => (
            <div key={title}>
              <div className="mb-3 h-1 w-10 rounded-full bg-[#0d4b3a]" />
              <div className="text-[16px] font-semibold tracking-tight">
                {title}
              </div>
              <div className="mt-2 text-[13.5px] leading-relaxed text-ink/70">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
