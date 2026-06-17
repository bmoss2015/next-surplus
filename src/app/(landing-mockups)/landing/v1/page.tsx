import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus | The Operations Platform For Surplus Recovery",
};

export default function LandingV1() {
  return (
    <div className="min-h-screen bg-white text-ink">
      {/* HERO + Nav share the gradient. Single continuous teal field. */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(ellipse at top, #0d4b3a 0%, #051a14 60%, #02100c 100%)",
        }}
      >
        <Nav />
        <div className="mx-auto max-w-5xl px-8 pt-24 pb-32 text-center">
          <div className="mb-7 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
            Operations Platform For Surplus Recovery
          </div>
          <h1 className="m-0 text-[68px] font-semibold leading-[1.02] tracking-[-0.03em]">
            Run Every Case
            <br />
            <span className="text-white/55">In One Place</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-[16.5px] leading-relaxed text-white/65">
            Next Surplus replaces the spreadsheets, sticky notes, and
            five-tab workflow a surplus recovery firm runs on today.
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

      {/* SOCIAL PROOF — white band, no tan */}
      <section className="border-b border-gray-200 bg-white">
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

      {/* PROBLEM — cool gray-50, never tan */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-5xl px-8 py-24">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
                The Problem
              </div>
              <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
                Five Tools And A Spreadsheet
              </h2>
            </div>
            <div className="space-y-5 pt-8 text-[15px] leading-relaxed text-gray-700">
              <p>
                The lead list lives in one tab. The inbox lives in
                another. Mail-merge templates live in Google Docs.
                Case notes live in a different doc. The check ledger
                lives in QuickBooks.
              </p>
              <p>
                Cases fall through the cracks. Surplus claims expire.
                Recovery firms spend more time stitching tools
                together than actually recovering funds.
              </p>
              <p className="text-[#0d4b3a]">
                Next Surplus collapses the entire stack into one
                workspace, purpose-built for this case load.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-8 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
              The Platform
            </div>
            <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              Everything A Recovery Firm Runs On
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-gray-600">
              Four core surfaces. No add-ons. No upcharges.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6">
            <FeatureCard
              eyebrow="01 Lead Pipeline"
              title="Track Every Case From Sale Notice To Payout"
              body="Customizable stages. Automatic activity log. County, state, sale type, surplus amount, and estimated net all live on one row. Filters match how recovery firms actually work, not generic CRM defaults."
            />
            <FeatureCard
              eyebrow="02 Threaded Inbox"
              title="Gmail And Outlook, Sorted To The Right Lead"
              body="Connect an existing inbox. Conversations auto-link to the property owner. Reply without leaving the case. Read receipts, attachment archive, full conversation history."
            />
            <FeatureCard
              eyebrow="03 Physical Mail And Checks"
              title="USPS Letters And Printed Checks, One Click"
              body="Templates with merge fields. Tracking on every piece. Sent mail attaches to the lead automatically. Pricing on each piece is transparent on every monthly invoice."
            />
            <FeatureCard
              eyebrow="04 Verified Bank Accounts"
              title="Plaid Linked, Verified Once"
              body="Connect business checking through Plaid. Micro-deposits handled automatically. Bank numbers never sit in plain text; routing details flow directly to the print partner."
            />
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR — cool gray-50 */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-8 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
              Who It Is For
            </div>
            <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              Built For Recovery Firms At Every Stage
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6">
            <PersonaCard
              title="The Solo Operator"
              body="One person, every case. Next Surplus replaces a spreadsheet, an inbox, a mail-merge template, and a check writer with a single workspace."
            />
            <PersonaCard
              title="The Small Firm"
              body="Two or three operators. Shared pipeline, shared inbox visibility, assignable cases. Every user included, never a per-seat charge."
            />
            <PersonaCard
              title="The Growing Team"
              body="Three to ten operators. Automatic activity logs, audit-ready trails, stage rules that enforce process without slowing the team down."
            />
          </div>
        </div>
      </section>

      {/* PRICING — Founders Rate framing */}
      <section id="pricing" className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-8 py-28 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
            Founders Rate
          </div>
          <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
            One Plan, Every Feature, Every User
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-gray-600">
            Most CRM platforms charge per seat and gate features
            behind tiers. Next Surplus does not. This rate is locked
            in for every firm that joins during the launch window.
          </p>

          <div className="mx-auto mt-14 max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-left shadow-[0_24px_50px_-20px_rgba(15,23,41,0.18)]">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d4b3a]">
                Founders Rate
              </div>
              <div className="rounded-full border border-[#0d4b3a]/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#0d4b3a]">
                Limited Window
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[56px] font-semibold leading-none tracking-tight text-ink">
                $49
              </span>
              <span className="text-[14px] text-gray-500">/ Month</span>
            </div>
            <div className="mt-1 text-[13px] text-gray-500">
              Per organization, billed monthly. Annual billing available
              at signup.
            </div>
            <ul className="mt-7 space-y-2.5 text-[13.5px] text-ink">
              {[
                "Unlimited Users In Your Organization",
                "Lead Pipeline With Custom Stages",
                "Gmail Inbox Sync",
                "Templates, Activity Log, Audit Trail",
                "CSV Import And Export",
                "Locked Rate For Twelve Months",
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
              Claim Founders Rate
            </Link>
          </div>

          <div className="mt-6 text-[12.5px] text-gray-500">
            Microsoft Outlook and IMAP inbox sync are coming next.
          </div>
        </div>
      </section>

      {/* FAQ — cool gray-50 */}
      <section id="faq" className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-3xl px-8 py-24">
          <div className="text-center">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#0d4b3a]">
              FAQ
            </div>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
              Common Questions
            </h2>
          </div>
          <div className="mt-12 space-y-px overflow-hidden rounded-lg border border-gray-200 bg-white">
            <Faq
              q="How Quickly Can I Get Started?"
              a="Sign up, import your leads from a CSV, and start sending outreach the same day. Most operators have their first case loaded into the pipeline within ten minutes."
            />
            <Faq
              q="Can I Import Leads From My Current System?"
              a="Yes. CSV import is built in. Map your columns once and your existing leads load into your pipeline with statuses preserved. No data engineering required."
            />
            <Faq
              q="How Is My Data Protected?"
              a="Each company's data is fully isolated from every other account on the platform. Only users you invite to your workspace can see your leads, documents, or case notes."
            />
            <Faq
              q="Are There Per Seat Fees Or Add Ons?"
              a="No. One flat monthly price covers your entire team and every feature on the platform. No per seat fees, no module upgrades, no contract minimums. Physical mail and check printing are billed at cost plus a flat markup, shown on every monthly invoice."
            />
            <Faq
              q="Can I Cancel My Subscription?"
              a="Yes. There are no long term contracts. Cancel from your billing settings in a single click. Your account stays active through the end of your current billing period, and your data stays exportable from Settings as long as the account is open."
            />
            <Faq
              q="What Kind Of Support Do You Offer?"
              a="Email support@nextsurplus.com. The team building the product answers support directly. Response within one business day on weekdays. Priority support for urgent claim deadlines."
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
            Stop Running A Firm In Five Tabs
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[15.5px] text-white/65">
            Sign up, import a first batch of leads, send a first
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

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-8 text-[12.5px] text-gray-500">
          <div className="font-semibold text-ink">Next Surplus</div>
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
