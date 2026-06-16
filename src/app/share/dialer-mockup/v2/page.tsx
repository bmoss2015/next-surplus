import { notFound } from "next/navigation";
import Link from "next/link";
import { ACTIVE_LEAD, fmtMoney } from "../_sample";

export default async function V2Page() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const lead = ACTIVE_LEAD;

  const center = { x: 360, y: 220 };
  const ring = lead.contacts.length;
  const radius = 150;
  const placed = lead.contacts.map((c, i) => {
    const angle = (i / ring) * 2 * Math.PI - Math.PI / 2;
    return {
      ...c,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
      activeNumber: c.numbers.find((n) => n.state === "active") ?? c.numbers[0],
    };
  });
  const activeIdx = 0;
  const active = placed[activeIdx];

  return (
    <div className="min-h-screen bg-canvas">
      <TopRibbon
        leadId={lead.leadId}
        ownerName={lead.ownerName}
        stageLabel={lead.stageLabel}
      />

      <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_360px] gap-7 px-7 py-7">
        <main>
          <div className="rounded-lg border border-gray-200 bg-surface px-6 py-6">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
                  Calling Now · Connected
                </div>
                <h2 className="m-0 mt-1 text-[18px] font-medium tracking-tight text-ink">
                  {active.name}{" "}
                  <span className="font-mono text-[13px] text-gray-500">
                    {active.activeNumber.formatted}
                  </span>
                </h2>
              </div>
              <div className="text-right">
                <div className="font-mono text-[36px] font-medium tabular-nums leading-none text-ink">
                  02:14
                </div>
                <div className="mt-1 text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
                  Talk Time
                </div>
              </div>
            </div>

            <Constellation placed={placed} centerName={lead.ownerName} center={center} />

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ControlBtn label="Mute" />
                <ControlBtn label="Hold" />
                <ControlBtn label="Voicemail Drop" />
              </div>
              <button className="rounded-md bg-danger px-4 py-2 text-[12.5px] font-medium text-white">
                End Call
              </button>
            </div>
          </div>

          <DispositionRibbon />

          <div className="mt-5 grid grid-cols-2 gap-4">
            <SurplusCard
              surplus={lead.estimatedSurplus}
              net={lead.estimatedNet}
              feePct={lead.recoveryFeePercent}
            />
            <PropertyCard
              property={lead.propertyAddress}
              city={lead.city}
              state={lead.state}
              county={lead.county}
              saleDate={lead.saleDate}
              saleProcess={lead.saleProcess}
            />
          </div>
        </main>

        <aside className="rounded-lg border border-gray-200 bg-surface px-5 py-5">
          <div className="text-[10.5px] uppercase tracking-[0.5px] text-gray-500">
            Activity Feed
          </div>
          <div className="mt-4 space-y-4">
            {lead.activity.map((a) => (
              <div key={a.id} className="border-l-2 border-gray-200 pl-3">
                <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
                  {a.at} · {a.kind}
                </div>
                <div className="mt-0.5 text-[12.5px] font-medium text-ink">
                  {a.label}
                </div>
                {a.detail && (
                  <div className="text-[11.5px] text-gray-700">{a.detail}</div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function TopRibbon({
  leadId,
  ownerName,
  stageLabel,
}: {
  leadId: string;
  ownerName: string;
  stageLabel: string;
}) {
  return (
    <div className="border-b border-gray-200 bg-surface">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-7 py-3 text-[12px]">
        <div className="flex items-center gap-4">
          <Link href="/share/dialer-mockup" className="text-gray-500 hover:text-ink">
            ← Back to mockups
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">{leadId}</span>
          <span className="text-ink">{ownerName}</span>
          <span className="text-gray-300">|</span>
          <span className="rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-[1px] text-[10.5px] font-medium text-ink">
            {stageLabel}
          </span>
        </div>
        <div className="text-gray-500">Lead 3 of 10 · Caller ID (216) 555-0105 OH</div>
      </div>
    </div>
  );
}

function Constellation({
  placed,
  centerName,
  center,
}: {
  placed: Array<{
    x: number;
    y: number;
    initials: string;
    name: string;
    role: string;
    activeNumber: { formatted: string; state: string; label: string };
  }>;
  centerName: string;
  center: { x: number; y: number };
}) {
  return (
    <div className="mt-6 -mx-2 overflow-hidden rounded-md border border-gray-150 bg-canvas">
      <svg viewBox="0 0 720 440" className="block w-full">
        {placed.map((p, i) => (
          <line
            key={`l-${i}`}
            x1={center.x}
            y1={center.y}
            x2={p.x}
            y2={p.y}
            stroke={i === 0 ? "#13644e" : "#d1d5db"}
            strokeWidth={i === 0 ? 1.5 : 1}
            strokeDasharray={i === 0 ? undefined : "3 3"}
          />
        ))}

        <g>
          <circle cx={center.x} cy={center.y} r={42} fill="#04261c" />
          <text
            x={center.x}
            y={center.y - 2}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fill="#5db98a"
            style={{ letterSpacing: 0.5 }}
          >
            LEAD
          </text>
          <text
            x={center.x}
            y={center.y + 14}
            textAnchor="middle"
            fontSize="10"
            fill="white"
          >
            Estate of
          </text>
        </g>
        <text
          x={center.x}
          y={center.y + 70}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="#0f1729"
        >
          {centerName.replace("Cornelius J. Hayes", "C. J. Hayes Sr.")}
        </text>

        {placed.map((p, i) => {
          const isActive = i === 0;
          return (
            <g key={`n-${i}`}>
              {isActive && (
                <circle cx={p.x} cy={p.y} r={36} fill="#5db98a" opacity={0.15} />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 30 : 24}
                fill={isActive ? "#0d4b3a" : "#ffffff"}
                stroke={isActive ? "#5db98a" : "#d1d5db"}
                strokeWidth={isActive ? 2.5 : 1}
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize={isActive ? "11" : "10"}
                fontWeight="600"
                fill={isActive ? "white" : "#374151"}
              >
                {p.initials}
              </text>
              <text
                x={p.x}
                y={p.y + (isActive ? 48 : 42)}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isActive ? "600" : "500"}
                fill="#0f1729"
              >
                {p.name.split(" ").slice(0, 2).join(" ")}
              </text>
              <text
                x={p.x}
                y={p.y + (isActive ? 62 : 56)}
                textAnchor="middle"
                fontSize="9.5"
                fill="#6b7280"
                style={{ letterSpacing: 0.3, textTransform: "uppercase" }}
              >
                {p.role}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DispositionRibbon() {
  const items = [
    { label: "Interested",         tone: "good"    },
    { label: "Not Interested",     tone: "neutral" },
    { label: "Callback",           tone: "info"    },
    { label: "Voicemail",          tone: "muted"   },
    { label: "Wrong Number",       tone: "bad"     },
    { label: "Do Not Contact",     tone: "stop"    },
  ];
  return (
    <div className="mt-5 rounded-lg border border-gray-200 bg-surface px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
          Disposition Ribbon
        </span>
        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          {items.map((d) => (
            <button
              key={d.label}
              className={
                d.tone === "good"
                  ? "rounded-md border border-gray-200 bg-surface px-2.5 py-1 text-[11.5px] text-ink hover:border-petrol-500 hover:text-petrol-500"
                  : d.tone === "bad"
                  ? "rounded-md border border-gray-200 bg-surface px-2.5 py-1 text-[11.5px] text-ink hover:border-danger hover:text-danger"
                  : d.tone === "info"
                  ? "rounded-md border border-gray-200 bg-surface px-2.5 py-1 text-[11.5px] text-ink hover:border-info-violet hover:text-info-violet-deep"
                  : d.tone === "stop"
                  ? "rounded-md border border-gray-200 bg-surface px-2.5 py-1 text-[11.5px] text-ink hover:border-ink"
                  : "rounded-md border border-gray-200 bg-surface px-2.5 py-1 text-[11.5px] text-gray-700 hover:border-gray-300"
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SurplusCard({
  surplus,
  net,
  feePct,
}: {
  surplus: number;
  net: number;
  feePct: number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-surface px-5 py-4">
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
        Surplus Math
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-[12px] text-gray-700">Estimated Surplus</span>
        <span className="font-mono text-[18px] font-medium tabular-nums text-ink">
          {fmtMoney(surplus)}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-[12px] text-gray-700">
          Recovery Fee {feePct}%
        </span>
        <span className="font-mono text-[14px] tabular-nums text-gray-700">
          {fmtMoney(Math.round(surplus * (feePct / 100)))}
        </span>
      </div>
      <div className="mt-2 border-t border-gray-200 pt-2 flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-ink">
          Est. Net To You
        </span>
        <span className="font-mono text-[18px] font-medium tabular-nums text-petrol-500">
          {fmtMoney(net)}
        </span>
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  city,
  state,
  county,
  saleDate,
  saleProcess,
}: {
  property: string;
  city: string;
  state: string;
  county: string;
  saleDate: string;
  saleProcess: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-surface px-5 py-4">
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
        Property
      </div>
      <div className="mt-2 text-[14px] font-medium text-ink">{property}</div>
      <div className="text-[12px] text-gray-700">
        {city}, {state}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11.5px]">
        <div className="text-gray-500">County</div>
        <div className="text-ink">{county}</div>
        <div className="text-gray-500">Sale Date</div>
        <div className="text-ink">{saleDate}</div>
        <div className="text-gray-500">Process</div>
        <div className="text-ink">{saleProcess}</div>
      </div>
    </div>
  );
}

function ControlBtn({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-gray-200 bg-surface px-3 py-1.5 text-[12px] text-ink hover:border-gray-300">
      {label}
    </button>
  );
}
