import { V16Layout } from "../../_components/V16Shared";

export default function SignupV16B() {
  return <V16Layout foundersRate={<FoundersRate />} />;
}

function FoundersRate() {
  return (
    <div className="mt-12 rounded-[10px] border border-white/15 bg-white/[0.05] px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[40px] font-semibold leading-none tracking-[-0.025em] text-white">
            $49
          </span>
          <span className="text-[14px] text-white/65">/month</span>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0d4b3a]">
          Limited Time Offer
        </div>
      </div>
      <div className="mt-3 text-[13px] leading-relaxed text-white/80">
        Founders Rate locks your price for 12 months.
      </div>
    </div>
  );
}
