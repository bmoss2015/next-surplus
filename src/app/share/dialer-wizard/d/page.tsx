import { IconChevronDown, IconArrowRight } from "@tabler/icons-react";

const STATES = [
  { code: "TX", count: 18, cx: 360, cy: 290 },
  { code: "NC", count: 9, cx: 620, cy: 240 },
  { code: "AZ", count: 7, cx: 220, cy: 280 },
  { code: "GA", count: 6, cx: 580, cy: 290 },
  { code: "OH", count: 4, cx: 540, cy: 170 },
  { code: "FL", count: 3, cx: 620, cy: 350 },
];

function clusterDots(cx: number, cy: number, count: number) {
  const dots: { x: number; y: number; r: number }[] = [];
  const ring = Math.ceil(Math.sqrt(count));
  let i = 0;
  for (let row = 0; row < ring; row++) {
    for (let col = 0; col < ring; col++) {
      if (i >= count) break;
      const offsetX = (col - (ring - 1) / 2) * 9 + (row % 2 === 0 ? 0 : 4);
      const offsetY = (row - (ring - 1) / 2) * 9;
      dots.push({ x: cx + offsetX, y: cy + offsetY, r: 2.4 });
      i++;
    }
  }
  return dots;
}

export default function VariantD() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Variant D &middot; Constellation
          </div>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-[#0f1729]">
            Start A Dialer Session
          </h1>
        </div>
        <button
          type="button"
          className="flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[13px] font-semibold text-[#0f1729] transition hover:border-[#0f1729]"
        >
          First Contact Due &middot; 47 Leads
          <IconChevronDown size={14} stroke={2} className="text-[#9ca3af]" />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div
          className="relative overflow-hidden rounded-[14px] bg-white"
          style={{
            boxShadow:
              "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(15,23,41,0.05) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
            aria-hidden
          />
          <svg
            viewBox="0 0 800 480"
            className="relative h-[480px] w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {STATES.map((s) => {
              const dots = clusterDots(s.cx, s.cy, s.count);
              return (
                <g key={s.code}>
                  <circle
                    cx={s.cx}
                    cy={s.cy}
                    r={28 + s.count * 1.4}
                    fill="rgba(19,100,78,0.06)"
                    stroke="rgba(19,100,78,0.18)"
                    strokeDasharray="2 3"
                  />
                  {dots.map((d, idx) => (
                    <circle
                      key={idx}
                      cx={d.x}
                      cy={d.y}
                      r={d.r}
                      fill="#13644e"
                    />
                  ))}
                  <text
                    x={s.cx}
                    y={s.cy - (32 + s.count * 1.4)}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="#0f1729"
                    fontFamily="Inter, sans-serif"
                  >
                    {s.code}
                  </text>
                  <text
                    x={s.cx}
                    y={s.cy - (20 + s.count * 1.4)}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                    fontFamily="Inter, sans-serif"
                  >
                    {s.count} Leads
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white/95 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center gap-5 text-[11.5px]">
              <DefaultPill label="Caller ID" value="Auto Map" />
              <DefaultPill label="Voicemail" value="Default" />
              <DefaultPill label="Wrap Up" value="30s" />
              <DefaultPill label="Followup" value="4 Templates" />
            </div>
            <button
              type="button"
              className="cursor-pointer text-[11.5px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
            >
              Change
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-[14px] bg-white p-5"
            style={{
              boxShadow:
                "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)",
            }}
          >
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
              Distribution
            </div>
            <div className="mt-1 text-[32px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
              47
            </div>
            <div className="text-[12px] text-[#6b7280]">Leads Across 6 States</div>

            <div className="mt-5 space-y-2 border-t border-[#f1f2f4] pt-4">
              {STATES.map((s) => (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="w-6 text-[11.5px] font-semibold text-[#0f1729]">
                    {s.code}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1f2f4]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#13644e]"
                      style={{ width: `${(s.count / 18) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11.5px] tabular-nums text-[#6b7280]">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#0a3d4a] to-[#13644e] text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_8px_20px_-4px_rgba(13,75,58,0.30)] transition hover:opacity-95"
          >
            Start Session
            <IconArrowRight size={15} stroke={2.25} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DefaultPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9.5px] uppercase tracking-[0.08em] text-[#9ca3af]">
        {label}
      </span>
      <span className="text-[12px] font-medium text-[#0f1729]">{value}</span>
    </div>
  );
}
