import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 2 — Editorial.
// Magazine layout. Bold typographic lead with stats embedded in the
// sentence, then each mail piece as an editorial card stacked
// vertically: thumbnail of the letter on the left, recipient context
// + status + actions in a rich paragraph on the right. Type-first,
// data-second. Sample fixed; pulled out of any code path.

const SAMPLE = [
  { id: "m1", recipient: "Margaret Chen", role: "Sister, Smith estate", line1: "412 Oakwood Drive", city: "Austin", state: "TX", postal: "78745", lead: "L-2026-0042", surplus: "$42K", status: "Delivered", deliveredAt: "Jan 18", sentAt: "Jan 14", tracking: "9400 1118 9922 3344 5566", letter: "Estate Notification" },
  { id: "m2", recipient: "David Rodriguez", role: "Court-appointed administrator", line1: "78 Pinecrest Avenue", city: "Houston", state: "TX", postal: "77019", lead: "L-2026-0044", surplus: "$28K", status: "Delivered (Certified)", deliveredAt: "Jan 20", sentAt: "Jan 16", tracking: "9400 1118 9922 3344 5567", letter: "Surplus Claim Notice" },
  { id: "m3", recipient: "Patricia Williams", role: "Owner of record", line1: "1023 Heritage Lane", city: "Dallas", state: "TX", postal: "75204", lead: "L-2026-0046", surplus: "$61K", status: "In Transit", sentAt: "Jan 24", tracking: "9400 1118 9922 3344 5568", letter: "Initial Outreach" },
  { id: "m4", recipient: "James O'Brien", role: "Heir, listed on deed", line1: "245 Magnolia Court", city: "San Antonio", state: "TX", postal: "78216", lead: "L-2026-0051", surplus: "$19K", status: "Returned", returnedAt: "Jan 22", sentAt: "Jan 09", tracking: "9400 1118 9922 3344 5569", letter: "Estate Notification", returnReason: "Forward expired" },
];

export default async function MockupV2() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/admin/mail-mockup"
            className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
          >
            ← All Mockups
          </Link>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            V2 · Editorial
          </span>
        </div>

        {/* MAIN /mail */}
        <section className="mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d4b3a]">
            Sent Mail · Last 30 Days
          </div>
          <h1 className="mt-3 max-w-3xl text-[44px] font-semibold leading-[1.08] tracking-tight text-ink">
            Twenty-four pieces in flight to surplus claimants across{" "}
            <span className="text-[#0d4b3a]">eight states</span>. Three came back.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-600">
            Eighteen reached their recipients without intervention. Three
            returned with bad-address flags, each linked below to the lead
            and ready to fix. The remaining three are still moving through
            USPS networks.
          </p>

          <div className="mt-8 border-t border-gray-200">
            {SAMPLE.map((p, i) => (
              <article
                key={p.id}
                className="grid grid-cols-[180px_1fr_auto] gap-8 border-b border-gray-200 py-7"
              >
                {/* Letter thumbnail */}
                <div className="relative h-[220px] overflow-hidden rounded-sm border border-gray-200 bg-white shadow-card">
                  <div className="absolute inset-0 p-4 text-[7px] leading-[1.5] text-ink">
                    <div className="mb-2 text-right text-gray-500">Jan 14, 2026</div>
                    <div className="mb-2">{p.recipient}</div>
                    <div className="mb-2 text-gray-500">
                      {p.line1}<br/>{p.city}, {p.state} {p.postal}
                    </div>
                    <div className="mt-3 mb-1">Dear {p.recipient.split(" ")[0]},</div>
                    <div className="mb-1 text-gray-700">
                      Our records indicate you may be entitled to surplus
                      funds being held by the county following the
                      recent sale of property at...
                    </div>
                    <div className="mb-1 text-gray-700">
                      Moss Equity Partners specializes in helping rightful
                      owners recover these funds. If you would like to
                      discuss your situation, please reply by mail or...
                    </div>
                  </div>
                </div>

                {/* Editorial paragraph */}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Piece {String(i + 1).padStart(2, "0")} · {p.letter}
                  </div>
                  <h3 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-ink">
                    {p.recipient}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-700">
                    <span className="font-medium text-ink">{p.role}</span> on{" "}
                    <Link href="#" className="cursor-pointer font-medium text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2 hover:decoration-[#0d4b3a]">{p.lead}</Link>{" "}
                    (surplus: {p.surplus}). Letter sent {p.sentAt} to {p.line1},{" "}
                    {p.city}, {p.state} {p.postal}.{" "}
                    {p.status.startsWith("Delivered") && (
                      <>
                        <strong className="text-[#0d4b3a]">{p.status}</strong>{" "}
                        on {p.deliveredAt}.
                      </>
                    )}
                    {p.status === "In Transit" && (
                      <>
                        Still <strong className="text-ink">in transit</strong>
                        ; tracking shows the piece left the USPS facility.
                      </>
                    )}
                    {p.status === "Returned" && (
                      <>
                        <strong className="text-[#c4253c]">Returned</strong>{" "}
                        {p.returnedAt}, marked &quot;{p.returnReason}.&quot;
                        Click below to update the address and resend.
                      </>
                    )}
                  </p>
                  <div className="mt-4 flex gap-2 text-[12px] font-medium">
                    <Link href="#" className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-ink hover:bg-gray-50">
                      View Letter
                    </Link>
                    <Link href="#" className="cursor-pointer rounded-md border border-gray-200 px-3 py-1.5 text-ink hover:bg-gray-50">
                      Track
                    </Link>
                    {p.status === "Returned" && (
                      <Link href="#" className="cursor-pointer rounded-md bg-[#c4253c] px-3 py-1.5 text-white">
                        Fix Address & Resend
                      </Link>
                    )}
                  </div>
                </div>

                {/* Tracking ID as marginalia */}
                <div className="w-[160px] border-l border-gray-150 pl-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Tracking
                  </div>
                  <div className="mt-2 font-mono text-[10.5px] leading-relaxed text-gray-600">
                    {p.tracking}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* LEAD MAIL TAB */}
        <section>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d4b3a]">
            Lead · L-2026-0042 · Smith Surplus Case
          </div>
          <h2 className="mt-3 max-w-2xl text-[36px] font-semibold leading-[1.1] tracking-tight text-ink">
            Three pieces sent to the Smith family. Two delivered, one
            returned.
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-gray-600">
            Estate notification reached Margaret Chen (sister) on Jan 18.
            The certified piece to David Rodriguez (court-appointed
            administrator) confirmed receipt Jan 20. The piece to James
            O&apos;Brien came back marked &quot;forward expired&quot;.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-sm border border-[#0d4b3a]/15 bg-[#0d4b3a] p-5 text-white">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Compose
              </div>
              <div className="mt-2 text-[22px] font-semibold leading-tight">
                Send another piece
              </div>
              <div className="mt-2 text-[12px] text-white/80">
                3 mailing addresses on file. Picks a template, includes a
                check if the conversation has progressed.
              </div>
              <button className="mt-5 w-full cursor-pointer rounded-md bg-white px-4 py-2 text-[12px] font-semibold text-[#0d4b3a]">
                Start New Mail
              </button>
            </div>

            {SAMPLE.slice(0, 2).map((p, i) => (
              <article
                key={p.id}
                className="rounded-sm border border-gray-200 bg-white p-5"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Piece {String(i + 1).padStart(2, "0")} · {p.letter}
                </div>
                <h3 className="mt-2 text-[18px] font-semibold leading-tight tracking-tight text-ink">
                  {p.recipient}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-gray-700">
                  {p.role}. Letter sent {p.sentAt}. {p.status} on{" "}
                  {p.deliveredAt}.
                </p>
                <div className="mt-4 flex gap-2 text-[11.5px] font-medium">
                  <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
                    View Letter
                  </Link>
                  <span className="text-gray-300">·</span>
                  <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
                    Track
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
