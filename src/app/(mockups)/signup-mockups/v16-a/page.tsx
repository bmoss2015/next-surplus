import { V16Layout } from "../../_components/V16Shared";

export default function SignupV16A() {
  return <V16Layout foundersRate={<FoundersRate />} />;
}

function FoundersRate() {
  return (
    <div className="mt-12 grid grid-cols-[auto_1fr_auto] items-center gap-5 border-t border-white/15 pt-5">
      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-white">
          $49
        </span>
        <span className="text-[13px] text-white/65">/month</span>
      </div>
      <div className="text-[12.5px] leading-relaxed text-white/75">
        Founders Rate locks your price for 12 months.
      </div>
      <div className="rounded-full border border-white/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
        Limited Time Offer
      </div>
    </div>
  );
}
