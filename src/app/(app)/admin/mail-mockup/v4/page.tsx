import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 4 — Mail-client split-pane.
// Left rail = dense scannable list of pieces. Right pane = full detail
// of the selected piece (letter preview as the visual anchor, fields
// below, actions inline). Same pattern as Superhuman / Linear inbox /
// Apple Mail / Gmail. Single-key-press triage workflow: J/K to step
// through the list, enter to open. Operators with many pieces in
// flight can move through them fast.

const SAMPLE = [
  { id: "m1", recipient: "Margaret Chen", line1: "412 Oakwood Dr", city: "Austin", state: "TX", postal: "78745", lead: "L-2026-0042", surplus: "$42K", status: "Delivered", deliveredAt: "Jan 18, 2026", sentAt: "Jan 14, 2026", tracking: "9400111899223344556677", letter: "Estate Notification", mailClass: "First Class", role: "Sister, Smith estate" },
  { id: "m2", recipient: "David Rodriguez", line1: "78 Pinecrest Ave", city: "Houston", state: "TX", postal: "77019", lead: "L-2026-0044", surplus: "$28K", status: "Delivered", deliveredAt: "Jan 20, 2026", sentAt: "Jan 16, 2026", tracking: "9400111899223344556712", letter: "Surplus Claim Notice", mailClass: "Certified", role: "Court-appointed administrator" },
  { id: "m3", recipient: "Patricia Williams", line1: "1023 Heritage Ln", city: "Dallas", state: "TX", postal: "75204", lead: "L-2026-0046", surplus: "$61K", status: "In Transit", sentAt: "Jan 24, 2026", tracking: "9400111899223344556728", letter: "Initial Outreach", mailClass: "First Class", role: "Owner of record" },
  { id: "m4", recipient: "James O'Brien", line1: "245 Magnolia Ct", city: "San Antonio", state: "TX", postal: "78216", lead: "L-2026-0051", surplus: "$19K", status: "Returned", returnedAt: "Jan 22, 2026", sentAt: "Jan 09, 2026", tracking: "9400111899223344556735", letter: "Estate Notification", mailClass: "First Class", role: "Heir, listed on deed", returnReason: "Forward expired" },
  { id: "m5", recipient: "Linda Foster", line1: "5511 Westbrook Way", city: "Fort Worth", state: "TX", postal: "76107", lead: "L-2026-0048", surplus: "$33K", status: "In Transit", sentAt: "Jan 26, 2026", tracking: "9400111899223344556742", letter: "Initial Outreach", mailClass: "First Class", role: "Co-heir" },
  { id: "m6", recipient: "Susan Park", line1: "918 Cedar Springs Rd", city: "Austin", state: "TX", postal: "78704", lead: "L-2026-0050", surplus: "$14K", status: "In Transit", sentAt: "Jan 22, 2026", tracking: "9400111899223344556766", letter: "Settlement Check", mailClass: "First Class", role: "Beneficiary", check: "$4,825.00" },
  { id: "m7", recipient: "Carlos Mendez", line1: "2200 Border Ave", city: "El Paso", state: "TX", postal: "79912", lead: "L-2026-0058", surplus: "$22K", status: "Delivered", deliveredAt: "Jan 29, 2026", sentAt: "Jan 24, 2026", tracking: "9400111899223344556773", letter: "Initial Outreach", mailClass: "First Class", role: "Owner of record" },
];

const STATUS_DOT: Record<string, string> = {
  Delivered: "bg-[#0d4b3a]",
  "In Transit": "bg-gray-400",
  Returned: "bg-[#c4253c]",
};

export default async function MockupV4() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  const selected = SAMPLE[3]; // James — the returned one, to show the resend pane

  return (
    <div className="min-h-screen bg-gray-50 px-7 py-7">
      <div className="mb-7 flex items-center justify-between">
        <Link
          href="/admin/mail-mockup"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
        >
          ← All Mockups
        </Link>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
          V4 · Split-Pane Inbox
        </span>
      </div>

      {/* MAIN /mail */}
      <header className="mb-5">
        <h1 className="m-0 text-[24px] font-semibold tracking-tight text-ink">
          Sent Mail
        </h1>
      </header>

      <div className="grid grid-cols-[360px_1fr] gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Left rail */}
        <div className="border-r border-gray-200 bg-gray-50/60">
          <div className="border-b border-gray-200 p-3">
            <input
              type="text"
              placeholder="Search recipient, city, lead"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-petrol-300"
            />
            <div className="mt-2 flex gap-1">
              {["All", "In Transit", "Delivered", "Returned"].map((f, i) => (
                <button
                  key={f}
                  className={`cursor-pointer rounded-[4px] border px-[8px] py-[4px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] transition-colors ${
                    i === 0
                      ? "border-ink bg-ink text-white"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-gray-150">
            {SAMPLE.map((p, i) => (
              <li
                key={p.id}
                className={`cursor-pointer px-4 py-3 transition-colors ${
                  i === 3
                    ? "bg-white shadow-[inset_3px_0_0_#0d4b3a]"
                    : "hover:bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[p.status]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink">
                        {p.recipient}
                      </span>
                      <span className="shrink-0 text-[10px] text-gray-500">
                        {p.sentAt.split(",")[0]}
                      </span>
                    </div>
                    <div className="truncate text-[11.5px] text-gray-500">
                      {p.lead} · {p.surplus} · {p.city}, {p.state}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-gray-400">
                      {p.letter}{p.check ? ` · check ${p.check}` : ""}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right pane — detail of selected */}
        <div className="bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                  {selected.letter}
                </div>
                <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-ink">
                  {selected.recipient}
                </h2>
                <div className="mt-[1px] text-[12px] text-gray-500">
                  {selected.role} ·{" "}
                  <Link href="#" className="cursor-pointer text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2">
                    {selected.lead}
                  </Link>{" "}
                  · {selected.surplus} surplus
                </div>
              </div>
              <span
                className={`inline-flex items-center justify-center rounded-[4px] bg-[#c4253c] px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-white`}
              >
                {selected.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[280px_1fr] gap-6 p-6">
            {/* Letter thumbnail */}
            <div className="relative h-[360px] overflow-hidden rounded-sm border border-gray-200 bg-white">
              <div className="absolute inset-0 p-4 text-[8px] leading-[1.5] text-ink">
                <div className="mb-2 text-right text-gray-500">{selected.sentAt}</div>
                <div className="mb-2">{selected.recipient}</div>
                <div className="mb-2 text-gray-500">
                  {selected.line1}<br />
                  {selected.city}, {selected.state} {selected.postal}
                </div>
                <div className="mt-3 mb-1">Dear {selected.recipient.split(" ")[0]},</div>
                <div className="mb-1 text-gray-700">
                  Our records indicate you may be entitled to surplus
                  funds being held by the county following the recent
                  sale of property...
                </div>
                <div className="mb-1 text-gray-700">
                  Next Surplus specializes in helping rightful owners
                  recover these funds. If you would like to discuss...
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 border-t border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-500">
                Click to view full letter
              </div>
            </div>

            {/* Fields */}
            <div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
                <KV label="Recipient">
                  {selected.line1}, {selected.city}, {selected.state}{" "}
                  {selected.postal}
                </KV>
                <KV label="Class">{selected.mailClass}</KV>
                <KV label="Sent">{selected.sentAt}</KV>
                <KV label="Returned">
                  {selected.returnedAt}
                  {selected.returnReason && (
                    <span className="ml-1 text-[#c4253c]">({selected.returnReason})</span>
                  )}
                </KV>
                <div className="col-span-2">
                  <KV label="Tracking">
                    <a
                      href="#"
                      className="cursor-pointer whitespace-nowrap font-mono text-[11.5px] text-[#0d4b3a] underline decoration-[#0d4b3a]/30 underline-offset-2"
                    >
                      {selected.tracking}
                    </a>
                  </KV>
                </div>
              </dl>

              {/* Resend form inline */}
              <div className="mt-5 rounded-lg border border-[#0d4b3a]/15 bg-[#0d4b3a]/[0.03] p-4">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#0d4b3a]">
                  Update Address &amp; Resend
                </div>
                <div className="mt-1 text-[11.5px] text-gray-700">
                  Pick a different address on file, or type a new one.
                </div>
                <select
                  className="mt-3 w-full cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] text-ink"
                  defaultValue=""
                >
                  <option value="">Pick an address on file</option>
                  <option>James O&apos;Brien · 245 Magnolia Court (current)</option>
                  <option>Maria O&apos;Brien · 8821 Lakeview Dr, Austin TX</option>
                  <option>O&apos;Brien Estate Trust · 1500 Congress Ave, Austin TX</option>
                </select>
                <div className="mt-3 flex justify-end gap-2 text-[12px] font-medium">
                  <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50">
                    Don&apos;t Resend
                  </button>
                  <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-1.5 text-white">
                    Resend
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEAD MAIL TAB — same split pattern, scoped to one lead */}
      <section className="mt-10">
        <div className="mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
            L-2026-0042 · Smith Surplus Case
          </div>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-ink">
            Mail On This Lead
          </h2>
        </div>

        <div className="grid grid-cols-[320px_1fr] gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-r border-gray-200 bg-gray-50/60">
            <div className="border-b border-gray-200 p-3">
              <button className="w-full cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-2 text-[12px] font-semibold text-white">
                + Compose New Mail
              </button>
            </div>
            <ul className="divide-y divide-gray-150">
              {SAMPLE.slice(0, 3).map((p, i) => (
                <li
                  key={p.id}
                  className={`cursor-pointer px-4 py-3 ${i === 0 ? "bg-white shadow-[inset_3px_0_0_#0d4b3a]" : "hover:bg-white"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[p.status]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-ink">
                        {p.recipient}
                      </div>
                      <div className="truncate text-[11px] text-gray-500">
                        {p.role} · {p.sentAt.split(",")[0]}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-6 py-5">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              {SAMPLE[0].letter}
            </div>
            <h3 className="mt-1 text-[20px] font-semibold tracking-tight text-ink">
              {SAMPLE[0].recipient}
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
              <KV label="Class">{SAMPLE[0].mailClass}</KV>
              <KV label="Sent">{SAMPLE[0].sentAt}</KV>
              <KV label="Delivered">{SAMPLE[0].deliveredAt}</KV>
              <KV label="Tracking">
                <span className="whitespace-nowrap font-mono text-[11.5px] text-[#0d4b3a]">
                  {SAMPLE[0].tracking}
                </span>
              </KV>
            </dl>
            <div className="mt-4 flex gap-2 text-[12px] font-medium">
              <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-ink hover:bg-gray-50">
                View Letter
              </button>
              <button className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-ink hover:bg-gray-50">
                Track
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </dt>
      <dd className="mt-[1px] text-ink">{children}</dd>
    </div>
  );
}
