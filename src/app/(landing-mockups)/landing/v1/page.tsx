import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus | The Operations Platform For Surplus Recovery",
};

export default function LandingV1() {
  return (
    <div className="min-h-screen bg-white text-ink">
      {/* HERO — gradient dark, type-forward, no pricing, no green-dot pill */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(ellipse at top, #0d4b3a 0%, #051a14 55%, #02100c 100%)",
        }}
      >
        <Nav />
        <div className="mx-auto max-w-5xl px-8 pt-24 pb-32 text-center">
          <div className="mb-7 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
            Operations Platform For Surplus Recovery
          </div>
          <h1 className="m-0 text-[68px] font-semibold leading-[1.02] tracking-[-0.03em]">
            Run every case
            <br />
            <span className="text-white/55">in one place.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-[16.5px] leading-relaxed text-white/65">
            Replace your spreadsheets, sticky notes, and five tabs with
            a deliberate platform built for surplus recovery firms.
            Lead pipeline, threaded inbox, physical mail, verified
            checks. One login.
          </p>
          <div className="mt-10 flex items-center justify-center gap-2">
            <Link
              href="/signup"
              className="inline-flex h-12 w-48 items-center justify-center rounded-md bg-white text-[14px] font-medium text-[#0d4b3a] hover:bg-white/90"
            >
              Start Free
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 w-48 items-center justify-center rounded-md border border-white/25 bg-white/[0.04] text-[14px] font-medium text-white hover:bg-white/[0.08]"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — quiet positioning band */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-8 py-10 text-center">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-500">
            Built For Operators Working
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[13px] text-gray-600">
            <span>Tax Sale Surpluses</span>
            <span className="text-gray-300">·</span>
            <span>Mortgage Foreclosure Surpluses</span>
            <span className="text-gray-300">·</span>
            <span>Probate Recoveries</span>
            <span className="text-gray-300">·</span>
            <span>Heir Notifications</span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-[#fafaf8]">
        <div className="mx-auto max-w-5xl px-8 py-24">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
                The Problem
              </div>
              <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
                A recovery firm runs on five tools and a spreadsheet.
              </h2>
            </div>
            <div className="space-y-5 pt-8 text-[15px] leading-relaxed text-gray-700">
              <p>
                The lead list lives in one place. The inbox lives in
                another. The mail-merge template is in Google Docs.
                The case notes are in a different doc. The check
                ledger is in QuickBooks.
              </p>
              <p>
                Cases fall through the cracks. Surplus claims expire.
                You spend more time stitching tools together than
                actually recovering funds.
              </p>
              <p className="text-[#0d4b3a]">
                Next Surplus collapses all five into one workspace,
                purpose-built for your case load.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-8 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
              The Platform
            </div>
            <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              Everything a recovery firm runs on.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-gray-600">
              Four core surfaces. No add-ons. No upcharges.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6">
            <FeatureCard
              eyebrow="01 Lead Pipeline"
              title="Track every case from sale notice to payout."
              body="Customizable stages. Automatic activity log. County, state, sale type, surplus amount, estimated net all on one row. Filters that match how you actually work."
            />
            <FeatureCard
              eyebrow="02 Threaded Inbox"
              title="Gmail and Outlook, sorted to the right lead."
              body="Connect your existing inbox. Conversations auto-link to the property owner. Send replies without leaving the case. Read receipts, attachment archive, conversation history."
            />
            <FeatureCard
              eyebrow="03 Physical Mail"
              title="Letters and checks, one click."
              body="USPS letters and printed checks from inside the platform. Templates with merge fields. Tracking on every piece. Sent mail attaches to the lead automatically."
            />
            <FeatureCard
              eyebrow="04 Verified Bank"
              title="Plaid-linked accounts for check sending."
              body="Connect your business checking once. Micro-deposits handled. We hand the routing details directly to the printer so the bank numbers never sit in plain text."
            />
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-[#fafaf8] border-t border-gray-200">
        <div className="mx-auto max-w-6xl px-8 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
              Who It Is For
            </div>
            <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              Built for the way recovery firms actually work.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6">
            <PersonaCard
              title="The Solo Operator"
              body="You run every case yourself. You need one tool that does the work of five. Next Surplus replaces your spreadsheet, your inbox, your mail merge, and your check writer."
            />
            <PersonaCard
              title="The Small Firm"
              body="You and two colleagues. You need a shared pipeline, shared inbox visibility, and assignable cases. Each user is included; no per-seat charge."
            />
            <PersonaCard
              title="The Growing Team"
              body="You are scaling from three to ten operators. You need automatic activity logs, audit-ready trails, and stage rules that enforce process without slowing you down."
            />
          </div>
        </div>
      </section>

      {/* PRICING — proper section, not in hero */}
      <section id="pricing" className="border-t border-gray-200">
        <div className="mx-auto max-w-4xl px-8 py-28 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
            Pricing
          </div>
          <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
            One plan. Every feature. Every user.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-gray-600">
            Most CRM platforms charge per seat and gate features
            behind tiers. We do not.
          </p>

          <div className="mx-auto mt-14 max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-left shadow-[0_24px_50px_-20px_rgba(15,23,41,0.18)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d4b3a]">
              Standard
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[56px] font-semibold leading-none tracking-tight text-ink">
                $69
              </span>
              <span className="text-[14px] text-gray-500">/ month</span>
            </div>
            <div className="mt-1 text-[13px] text-gray-500">
              Per organization. Billed monthly.
            </div>
            <ul className="mt-7 space-y-2.5 text-[13.5px] text-ink">
              {[
                "Unlimited users in your organization",
                "Lead pipeline with custom stages",
                "Gmail and Outlook inbox sync",
                "Physical letters and checks via USPS",
                "Plaid bank verification",
                "Templates, activity log, audit trail",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#0d4b3a]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0d4b3a] text-[14px] font-medium text-white hover:bg-[#0a3d2f]"
            >
              Start Free
            </Link>
          </div>

          <div className="mt-8 text-[12.5px] text-gray-500">
            Physical mail is billed separately at cost plus a 20%
            service fee. Transparent on every invoice.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#fafaf8] border-t border-gray-200">
        <div className="mx-auto max-w-3xl px-8 py-24">
          <div className="text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
              FAQ
            </div>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              Common questions.
            </h2>
          </div>
          <div className="mt-12 space-y-px overflow-hidden rounded-lg border border-gray-200 bg-white">
            <Faq
              q="What states does the platform support?"
              a="All fifty states. Stage logic and surplus calculations are configurable per organization, so it adapts to your jurisdiction."
            />
            <Faq
              q="Do I have to use a specific email provider?"
              a="No. Gmail and Outlook connect via OAuth, and any other inbox connects via IMAP. The platform syncs the inbox you already use."
            />
            <Faq
              q="How do you handle physical mail?"
              a="Letters and checks ship through a USPS-licensed print partner. You write the letter, click send. The recipient gets the piece in their mailbox in three to five business days, with tracking attached to the lead."
            />
            <Faq
              q="Is my data isolated from other firms?"
              a="Yes. Every organization runs in its own isolated namespace; another firm cannot view your pipeline, your mail, or your contacts."
            />
            <Faq
              q="Can I cancel anytime?"
              a="Yes. Cancel from Settings. Your account stays active through the end of the billing period, then enters a 30-day read-only window so you can export your data."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        className="border-t border-gray-200 text-white"
        style={{
          background:
            "linear-gradient(180deg, #0d4b3a 0%, #02100c 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl px-8 py-24 text-center">
          <h2 className="m-0 text-[44px] font-semibold leading-[1.1] tracking-[-0.02em]">
            Stop running your firm in five tabs.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[15.5px] text-white/65">
            Sign up, import your first batch of leads, send your first
            letter inside ten minutes.
          </p>
          <div className="mt-9 flex items-center justify-center gap-2">
            <Link
              href="/signup"
              className="inline-flex h-12 w-48 items-center justify-center rounded-md bg-white text-[14px] font-medium text-[#0d4b3a] hover:bg-white/90"
            >
              Start Free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 w-48 items-center justify-center rounded-md border border-white/25 bg-white/[0.04] text-[14px] font-medium text-white hover:bg-white/[0.08]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-8 text-[12.5px] text-gray-500">
          <div>
            <span className="font-semibold text-ink">Next Surplus</span>
            <span className="ml-2 text-gray-400">
              Moss Equity Partners, LLC
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <a
              href="mailto:support@nextsurplus.com"
              className="hover:text-ink"
            >
              support@nextsurplus.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Nav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-6">
      <div className="text-[15px] font-semibold tracking-tight">
        Next Surplus
      </div>
      <nav className="flex items-center gap-8 text-[12.5px] text-white/70">
        <a href="#features" className="hover:text-white">
          Product
        </a>
        <a href="#pricing" className="hover:text-white">
          Pricing
        </a>
        <a href="#faq" className="hover:text-white">
          FAQ
        </a>
        <Link href="/login" className="hover:text-white">
          Sign In
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-[#0d4b3a] hover:bg-white/90"
        >
          Get Started
        </Link>
      </nav>
    </header>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-[0_24px_50px_-20px_rgba(15,23,41,0.15)]">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#0d4b3a]">
        {eyebrow}
      </div>
      <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
        {body}
      </p>
    </div>
  );
}

function PersonaCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7">
      <h3 className="text-[17px] font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-3 text-[13.5px] leading-relaxed text-gray-600">
        {body}
      </p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-gray-100 last:border-b-0">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-[14px] font-medium text-ink hover:bg-gray-50">
        {q}
        <span className="text-[18px] leading-none text-gray-400 transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="px-6 pb-5 text-[13.5px] leading-relaxed text-gray-600">
        {a}
      </div>
    </details>
  );
}
