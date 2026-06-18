import { V16Layout } from "../../_components/V16Shared";

export default function SignupV16E() {
  return <V16Layout foundersRate={<FoundersRate />} />;
}

function FoundersRate() {
  return (
    <div className="mt-12 flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-[64px] font-semibold leading-none tracking-[-0.03em] text-white">
          $49
        </span>
        <span className="text-[17px] text-white/65">/month</span>
      </div>
      <div className="text-[13.5px] leading-relaxed text-white/80">
        Founders Rate locks your price for 12 months.
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
        Limited Time Offer
      </div>
    </div>
  );
}
