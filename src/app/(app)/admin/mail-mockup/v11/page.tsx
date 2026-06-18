import { notFound } from "next/navigation";
import Link from "next/link";
import {
  IconMail,
  IconCalendar,
  IconHash,
  IconCash,
  IconClock,
  IconCircleCheck,
  IconArrowBackUp,
  IconBarcode,
} from "@tabler/icons-react";
import { getCurrentProfile } from "@/lib/auth/current-user";

// Variant 11 — V2 / V4 lead combination.
// Compose row + stats block from V2 stay on top. Below, the split-
// pane pattern from V4: compact left rail of pieces with a vertical
// green inset-shadow on the selected one, right pane showing the
// V2 editorial card content (letter thumbnail + icon-led meta +
// outlined status pill + solid View Letter / outlined Track) for
// the currently-selected piece.

const SAMPLE = [
  { id: "m1", recipient: "Margaret Chen", role: "Sister, Smith estate", line1: "412 Oakwood Drive", city: "Austin", state: "TX", postal: "78745", status: "Delivered", deliveredAt: "Jan 18, 2026", sentAt: "Jan 14, 2026", tracking: "9400111899223344556677", mailClass: "First Class" },
  { id: "m2", recipient: "David Rodriguez", role: "Court-appointed administrator", line1: "78 Pinecrest Avenue", city: "Houston", state: "TX", postal: "77019", status: "Delivered", deliveredAt: "Jan 20, 2026", sentAt: "Jan 16, 2026", tracking: "9400111899223344556712", mailClass: "Certified" },
  { id: "m4", recipient: "James O'Brien", role: "Heir, listed on deed", line1: "245 Magnolia Court", city: "San Antonio", state: "TX", postal: "78216", status: "Returned", returnedAt: "Jan 22, 2026", sentAt: "Jan 09, 2026", tracking: "9400111899223344556735", mailClass: "First Class", returnReason: "Forward expired" },
];

const STATUS_DOT: Record<string, string> = {
  Delivered: "bg-[#0d4b3a]",
  "In Transit": "bg-gray-400",
  Returned: "bg-[#c4253c]",
};

export default async function MockupV11() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  // Selected = the first row (Margaret Chen). In the real build this
  // is state driven by clicking left-rail items.
  const selected = SAMPLE[0];

  return (
    <div className="min-h-screen bg-white px-7 py-7">
      <div className="mb-7 flex items-center justify-between">
        <Link
          href="/admin/mail-mockup"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
        >
          ← All Mockups
        </Link>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
          V11 · V2 + V4 lead combo
        </span>
      </div>

      <div className="mx-auto max-w-5xl">
        {/* Header — V2 pattern */}
        <div className="mb-6 border-b border-gray-200 pb-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0d4b3a]">
                L-2026-0042 · Smith Surplus Case
              </div>
              <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-ink">
                Sent Mail
              </h2>
            </div>
            <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)]">
              Send Mail
            </button>
          </div>
          <dl className="mt-5 grid grid-cols-4 gap-x-6 gap-y-2">
            <StatPair label="Total Sent" value="3" />
            <StatPair label="In Transit" value="0" />
            <StatPair label="Delivered" value="2" />
            <StatPair label="Returned" value="1" emphasized />
          </dl>
        </div>

        {/* Split-pane: V4 pattern, V2 content */}
        <div className="grid grid-cols-[260px_1fr] gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* Left rail */}
          <div className="border-r border-gray-200 bg-gray-50/60">
            <ul className="divide-y divide-gray-150">
              {SAMPLE.map((p, i) => (
                <li
                  key={p.id}
                  className={`cursor-pointer px-4 py-3 transition-colors ${
                    i === 0
                      ? "bg-white shadow-[inset_3px_0_0_#0d4b3a]"
                      : "hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[p.status]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-ink">
                        {p.recipient}
                      </div>
                      <div className="mt-[1px] truncate text-[11px] text-gray-500">
                        {p.role}
                      </div>
                      <div className="mt-1 truncate text-[10.5px] text-gray-400">
                        {p.sentAt.split(",")[0]}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right pane — letter portrait on the left, meta + actions on
              the right. Mirrors V2's card layout inside V4's split-pane,
              so the letter reads as a real 8.5x11 sheet instead of a
              wide landscape strip. */}
          <div className="grid grid-cols-[200px_1fr] gap-5 bg-white p-6">
            {/* Letter thumbnail — 8.5x11 aspect ratio */}
            <div
              className="relative shrink-0 overflow-hidden rounded-sm border border-gray-200 bg-white shadow-card"
              style={{ width: "200px", aspectRatio: "8.5 / 11" }}
            >
              <div className="absolute inset-0 p-3 text-[6.5px] leading-[1.4] text-ink">
                <div className="mb-[3px] text-right text-gray-500">{selected.sentAt}</div>
                <div className="mb-[3px]">{selected.recipient}</div>
                <div className="mb-[3px] text-gray-500">
                  {selected.line1}<br />{selected.city}, {selected.state} {selected.postal}
                </div>
                <div className="mt-2 mb-[2px]">Dear {selected.recipient.split(" ")[0]},</div>
                <div className="mb-[2px] text-gray-700">
                  Our records indicate you may be entitled to surplus
                  funds being held by the county following the recent
                  sale of property...
                </div>
                <div className="mb-[2px] text-gray-700">
                  Next Surplus specializes in helping rightful owners
                  recover these funds. If you would like to discuss
                  your situation, please reply by mail or call us...
                </div>
                <div className="mt-2 text-gray-700">Sincerely,</div>
                <div className="text-gray-700">Bree Moss</div>
              </div>
            </div>

            {/* Meta + actions column */}
            <div className="flex min-w-0 flex-col">
              {/* Name + outlined status pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[18px] font-semibold tracking-tight text-ink">
                    {selected.recipient}
                  </div>
                  <div className="mt-[1px] text-[12px] text-gray-500">
                    {selected.role}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center rounded-[4px] border border-[#0d4b3a]/40 bg-white px-[10px] py-[5px] text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-[#0d4b3a]">
                  {selected.status}
                </span>
              </div>

              {/* Address */}
              <div className="mt-3 text-[12.5px] text-gray-600">
                {selected.line1}, {selected.city}, {selected.state} {selected.postal}
              </div>

              {/* Meta strip */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink">
                <Meta icon={IconMail}>{selected.mailClass}</Meta>
                <Meta icon={IconCalendar}>Sent {selected.sentAt}</Meta>
                {selected.status === "Delivered" && selected.deliveredAt && (
                  <Meta icon={IconCircleCheck} tone="ok">
                    Delivered {selected.deliveredAt}
                  </Meta>
                )}
                {selected.status === "Returned" && selected.returnedAt && (
                  <Meta icon={IconArrowBackUp} tone="danger">
                    Returned {selected.returnedAt} ({selected.returnReason})
                  </Meta>
                )}
                {selected.status === "In Transit" && (
                  <Meta icon={IconClock}>2 to 4 business days</Meta>
                )}
              </div>

              {/* Tracking */}
              <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-gray-600">
                <IconBarcode size={14} stroke={1.75} className="text-gray-400" />
                <span className="font-mono tabular-nums">{selected.tracking}</span>
              </div>

              {/* Actions — pinned to the bottom of the column */}
              <div className="mt-auto flex gap-2 pt-4 text-[11.5px] font-medium">
                <button className="cursor-pointer rounded-md bg-[#0d4b3a] px-3 py-1.5 text-white shadow-[0_1px_2px_rgba(13,75,58,0.25)] hover:bg-[#0d6c4d]">
                  View Letter
                </button>
                <button className="cursor-pointer rounded-md border border-[#0d4b3a]/25 bg-white px-3 py-1.5 text-[#0d4b3a] hover:bg-[#0d4b3a]/[0.04]">
                  Track
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPair({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[28px] font-semibold leading-none tracking-tight ${
          emphasized ? "text-[#c4253c]" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Meta({
  icon: Icon,
  children,
  tone,
}: {
  icon: typeof IconMail;
  children: React.ReactNode;
  tone?: "ok" | "danger";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        tone === "ok"
          ? "text-[#0d4b3a]"
          : tone === "danger"
            ? "text-[#c4253c]"
            : "text-ink"
      }`}
    >
      <Icon
        size={13}
        stroke={1.75}
        className={
          tone === "ok"
            ? "text-[#0d4b3a]/70"
            : tone === "danger"
              ? "text-[#c4253c]/70"
              : "text-gray-400"
        }
      />
      {children}
    </span>
  );
}
