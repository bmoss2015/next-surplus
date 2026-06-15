import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";
import { aiBriefFor } from "../_brief";

export default async function V19Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;
  const brief = aiBriefFor(lead);

  return (
    <div className="flex h-screen flex-col bg-[#f4f1eb] text-[#1c1a16]">
      <TopThin />
      <main className="flex flex-1 items-center justify-center overflow-hidden px-12 py-8">
        <article className="w-full max-w-[920px]">
          <Header lead={lead} />
          <BriefLine brief={brief} />
          <ContactsLine lead={lead} />
          <CallSurface />
        </article>
      </main>
      <FootStrip />
    </div>
  );
}

function TopThin() {
  return (
    <div className="flex shrink-0 items-center justify-between px-7 py-3 text-[11px] text-[#5b5547]">
      <Link href="/admin/dialer-mockup" className="hover:text-[#1c1a16]">
        ← Back
      </Link>
      <div className="flex items-center gap-3">
        <span>Lead 3 of 10</span>
        <span className="text-[#9b9485]">·</span>
        <span>42 Dials</span>
        <span className="text-[#9b9485]">·</span>
        <span>6 Connects</span>
        <span className="text-[#9b9485]">·</span>
        <span>14% Rate</span>
        <span className="text-[#9b9485]">·</span>
        <span>3:48 Avg Talk</span>
      </div>
      <button className="rounded-full bg-danger/95 px-3 py-1 text-[11px] font-medium text-white">
        End Session
      </button>
    </div>
  );
}

function Header({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <header>
      <div className="text-[10.5px] uppercase tracking-[0.7px] text-[#7a7062]">
        On Call · Connected · {lead.stageLabel}
      </div>
      <h1 className="m-0 mt-3 text-[80px] font-light leading-[0.96] tracking-[-0.03em] text-[#1c1a16]">
        Cornelius J.
        <br />
        <span className="font-semibold">Hayes Jr.</span>
      </h1>
      <div className="mt-5 flex items-center gap-5 text-[14px] text-[#3d3729]">
        <span>Heir</span>
        <span className="h-1 w-1 rounded-full bg-[#9b9485]" />
        <span className="tabular-nums">(216) 555-0147</span>
        <span className="h-1 w-1 rounded-full bg-[#9b9485]" />
        <span>Mobile</span>
        <span className="h-1 w-1 rounded-full bg-[#9b9485]" />
        <span>Son of estate</span>
      </div>

      <div className="mt-7 flex items-end justify-between border-b border-[#d8d2c1] pb-7">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-[#7a7062]">
            Talk Time
          </div>
          <div className="mt-1 text-[72px] font-light tabular-nums tracking-[-0.03em] leading-none text-[#1c1a16]">
            02:14
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-[#7a7062]">
            Estimated Net To Firm
          </div>
          <div className="mt-1 text-[34px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-petrol-700">
            {fmtMoney(146132)}
          </div>
          <div className="mt-1 text-[11.5px] text-[#7a7062]">
            on {fmtMoney(521900)} surplus at 28% recovery
          </div>
        </div>
      </div>
    </header>
  );
}

function BriefLine({ brief }: { brief: ReturnType<typeof aiBriefFor> }) {
  return (
    <section className="mt-7">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-[#7a7062]">
        What You Already Know
      </div>
      <p className="m-0 mt-2 text-[19px] font-medium leading-[1.45] text-[#1c1a16] max-w-[44ch]">
        {brief.tldr}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-5">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-[#7a7062]">
            Worth Knowing
          </div>
          <ul className="m-0 mt-1 list-none space-y-1 pl-0 text-[13px] leading-relaxed text-[#1c1a16]">
            {brief.bullets.slice(0, 3).map((b, i) => (
              <li key={i}>· {b}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-danger">
            Watch Out
          </div>
          <ul className="m-0 mt-1 list-none space-y-1 pl-0 text-[13px] leading-relaxed text-[#1c1a16]">
            {brief.watchOuts.map((w, i) => (
              <li key={i}>· {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ContactsLine({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <section className="mt-8 border-t border-[#d8d2c1] pt-6">
      <div className="text-[10.5px] uppercase tracking-[0.6px] text-[#7a7062]">
        Other Contacts on This Lead
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-7">
        {lead.contacts.slice(1).map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8d2c1] bg-[#fbf8f1] text-[12px] font-semibold text-[#1c1a16]">
              {c.initials}
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#1c1a16]">
                {c.name}
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.4px] text-[#7a7062]">
                {c.role} · {c.numbers[0].formatted}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CallSurface() {
  return (
    <div className="mt-9 flex items-center justify-between border-t border-[#d8d2c1] pt-6">
      <div className="flex items-center gap-2.5">
        <Btn label="Mute" k="M" />
        <Btn label="Hold" k="H" />
        <Btn label="Voicemail Drop" k="V" />
        <Btn label="Add Note" k="N" />
      </div>
      <button className="rounded-full bg-danger px-5 py-2.5 text-[13px] font-medium text-white">
        End Call
        <kbd className="ml-2 rounded-sm border border-white/40 px-1 font-mono text-[9.5px] text-white/85">
          E
        </kbd>
      </button>
    </div>
  );
}

function Btn({ label, k }: { label: string; k: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full border border-[#d8d2c1] bg-[#fbf8f1] px-4 py-2 text-[12.5px] text-[#1c1a16] hover:border-[#7a7062]">
      {label}
      <kbd className="rounded-sm border border-[#9b9485] px-1 font-mono text-[9.5px] text-[#5b5547]">
        {k}
      </kbd>
    </button>
  );
}

function FootStrip() {
  const items = [
    "Interested · 1",
    "Not Interested · 2",
    "Callback · 3",
    "Voicemail · 4",
    "Wrong Number · 5",
    "Do Not Contact · 6",
  ];
  return (
    <footer className="shrink-0 border-t border-[#d8d2c1] bg-[#ece8de] px-7 py-3">
      <div className="mx-auto flex max-w-[920px] items-center justify-between text-[11.5px] text-[#1c1a16]">
        <span className="text-[10.5px] uppercase tracking-[0.6px] text-[#5b5547]">
          Disposition
        </span>
        <div className="flex items-center gap-4">
          {items.map((it) => (
            <button key={it} className="hover:underline">
              {it}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
