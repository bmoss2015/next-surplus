import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";

export default async function V6Page() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const lead = ACTIVE_LEAD;

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopRibbon leadId={lead.leadId} stageLabel={lead.stageLabel} />

      <div className="relative flex-1 overflow-hidden">
        <MapBackdrop />

        <div className="absolute inset-x-6 top-6 z-10 flex items-start justify-between gap-6">
          <PropertyCard lead={lead} />
          <SurplusBadge surplus={lead.estimatedSurplus} net={lead.estimatedNet} fee={lead.recoveryFeePercent} />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-canvas via-canvas/95 to-transparent pt-16">
          <div className="mx-auto max-w-[1180px] px-6 pb-5">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
              <CallSurface />
              <PeopleStrip lead={lead} />
            </div>
            <DispositionRow />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopRibbon({ leadId, stageLabel }: { leadId: string; stageLabel: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-surface px-7 py-3 text-[12px]">
      <div className="flex items-center gap-4">
        <Link href="/admin/dialer-mockup" className="text-gray-500 hover:text-ink">
          ← Back to mockups
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">{leadId}</span>
        <span className="text-gray-300">|</span>
        <span className="rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-[1px] text-[10.5px] font-medium text-ink">
          {stageLabel}
        </span>
      </div>
      <div className="text-gray-500">Lead 3 of 10 · Cleveland, OH</div>
    </div>
  );
}

function MapBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1400 900"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#dfe5ec" strokeWidth="0.6" />
          </pattern>
          <pattern id="parcel" width="160" height="160" patternUnits="userSpaceOnUse">
            <rect width="160" height="160" fill="transparent" />
            <path d="M 0 0 H 160 V 160 H 0 Z" fill="none" stroke="#cdd6df" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1400" height="900" fill="#e9eef2" />
        <rect width="1400" height="900" fill="url(#parcel)" />
        <rect width="1400" height="900" fill="url(#grid)" />

        <path
          d="M 0 460 Q 320 420 720 480 T 1400 510"
          stroke="#b5c0cb"
          strokeWidth="34"
          fill="none"
          opacity="0.55"
        />
        <path
          d="M 620 0 Q 680 220 700 460 T 740 900"
          stroke="#b5c0cb"
          strokeWidth="22"
          fill="none"
          opacity="0.45"
        />
        <path
          d="M 100 720 Q 480 700 900 740 T 1400 760"
          stroke="#b5c0cb"
          strokeWidth="18"
          fill="none"
          opacity="0.4"
        />

        <text x="180" y="450" fontSize="10" fill="#6b7280" letterSpacing="1">
          ERIE CROSSING
        </text>
        <text x="760" y="220" fontSize="10" fill="#6b7280" letterSpacing="1">
          STATE ROUTE 422
        </text>
        <text x="420" y="710" fontSize="10" fill="#6b7280" letterSpacing="1">
          HIGHLAND RIDGE RD
        </text>

        <g>
          <rect x="640" y="420" width="120" height="100" fill="#0d4b3a" rx="3" />
          <circle cx="700" cy="470" r="58" fill="#5db98a" opacity="0.25" />
          <circle cx="700" cy="470" r="34" fill="#5db98a" opacity="0.5" />
          <circle cx="700" cy="470" r="14" fill="#04261c" stroke="#5db98a" strokeWidth="3" />
          <text
            x="700"
            y="402"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#04261c"
            letterSpacing="0.5"
          >
            1818 ERIE CROSSING
          </text>
        </g>
      </svg>
    </div>
  );
}

function PropertyCard({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <div className="max-w-[460px] rounded-md border border-gray-200 bg-surface/95 px-5 py-4 shadow-card backdrop-blur">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Subject Property
      </div>
      <h2 className="m-0 mt-1 text-[22px] font-medium tracking-tight text-ink">
        {lead.propertyAddress}
      </h2>
      <div className="text-[13px] text-gray-700">
        {lead.city}, {lead.state} · {lead.county}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
        <Spec label="Sale Date" value={lead.saleDate} />
        <Spec label="Process" value={lead.saleProcess} />
        <Spec label="Owner" value={lead.ownerStatus} />
        <Spec label="Last Contact" value={`${lead.daysSinceContact} day ago`} />
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div className="text-[12px] text-ink">{value}</div>
    </div>
  );
}

function SurplusBadge({
  surplus,
  net,
  fee,
}: {
  surplus: number;
  net: number;
  fee: number;
}) {
  return (
    <div className="rounded-md border border-petrol-500 bg-petrol-900 px-5 py-4 text-white shadow-card">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-petrol-300">
        Estimated Net to Firm
      </div>
      <div className="mt-1 font-mono text-[30px] font-medium tabular-nums leading-none">
        {fmtMoney(net)}
      </div>
      <div className="mt-2 text-[11px] text-white/65">
        {fmtMoney(surplus)} surplus · {fee}% recovery fee
      </div>
    </div>
  );
}

function CallSurface() {
  return (
    <div className="rounded-md border border-gray-200 bg-surface px-5 py-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
            On Call · Connected
          </div>
          <div className="mt-0.5 text-[16px] font-medium text-ink">
            Cornelius J. Hayes Jr.
          </div>
          <div className="font-mono text-[13px] text-gray-700">
            (216) 555-0147 · Mobile
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[28px] font-medium tabular-nums text-ink">
            02:14
          </div>
          <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
            Talk Time
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <CtrlBtn label="Mute" />
        <CtrlBtn label="Hold" />
        <CtrlBtn label="Voicemail Drop" />
        <button className="ml-auto rounded-md bg-danger px-4 py-2 text-[12.5px] font-medium text-white">
          End Call
        </button>
      </div>
    </div>
  );
}

function PeopleStrip({ lead }: { lead: typeof ACTIVE_LEAD }) {
  return (
    <div className="rounded-md border border-gray-200 bg-surface px-5 py-4 shadow-card">
      <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        People Tied To This Property
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {lead.contacts.map((c, i) => {
          const isActive = i === 0;
          return (
            <div
              key={c.id}
              className={
                isActive
                  ? "flex items-center gap-2.5 rounded-md border border-petrol-500 bg-petrol-100 px-2.5 py-1.5"
                  : "flex items-center gap-2.5 rounded-md border border-transparent px-2.5 py-1.5"
              }
            >
              <div
                className={
                  isActive
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-petrol-700 text-[10px] font-semibold text-white"
                    : "flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700"
                }
              >
                {c.initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-ink">
                  {c.name}
                </div>
                <div className="text-[10.5px] text-gray-500">{c.role}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DispositionRow() {
  const items = [
    "Interested",
    "Not Interested",
    "Callback",
    "Voicemail",
    "Wrong Number",
    "Do Not Contact",
  ];
  return (
    <div className="mt-4 flex items-center gap-2 overflow-x-auto">
      <span className="shrink-0 text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
        Disposition
      </span>
      {items.map((it) => (
        <button
          key={it}
          className="shrink-0 rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[11.5px] text-ink hover:border-gray-300"
        >
          {it}
        </button>
      ))}
    </div>
  );
}

function CtrlBtn({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-gray-200 bg-surface px-3 py-2 text-[12px] text-ink hover:border-gray-300">
      {label}
    </button>
  );
}
