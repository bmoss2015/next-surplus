export function FoundersRateCard({ tone = "dark" }: { tone?: "dark" | "light" }) {
  if (tone === "dark") {
    return (
      <div className="rounded-[10px] border border-white/15 bg-white/[0.06] p-5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#4a9c75]">
          Founders Rate
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[32px] font-semibold tracking-[-0.02em] text-white">
            $49
          </span>
          <span className="text-[13px] text-white/65">a month</span>
        </div>
        <div className="mt-1 text-[12px] text-white/70">
          Price held for 12 months
        </div>
        <div className="mt-3 border-t border-white/12 pt-3 text-[11px] leading-relaxed text-white/55">
          Limited window. After it closes, standard pricing applies.
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#13644e]">
        Founders Rate
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[32px] font-semibold tracking-[-0.02em] text-[#04261c]">
          $49
        </span>
        <span className="text-[13px] text-[#6b7280]">a month</span>
      </div>
      <div className="mt-1 text-[12px] text-[#6b7280]">
        Price held for 12 months
      </div>
      <div className="mt-3 border-t border-[#e5e7eb] pt-3 text-[11px] leading-relaxed text-[#9ca3af]">
        Limited window. After it closes, standard pricing applies.
      </div>
    </div>
  );
}

export function CheckBullet({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  const ring = tone === "dark" ? "#4a9c75" : "#04261c";
  const text = tone === "dark" ? "text-white" : "text-[#04261c]";
  return (
    <div className={`flex items-start gap-3 text-[13px] ${text}`}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden
        className="mt-0.5 flex-shrink-0"
      >
        <circle cx="9" cy="9" r="8" stroke={ring} strokeWidth="1.5" />
        <path
          d="M5.5 9.2L8 11.7L12.5 7"
          stroke={ring}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}
