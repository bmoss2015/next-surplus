import { V16Layout } from "../../_components/V16Shared";

export default function SignupV16D() {
  return <V16Layout foundersRate={<FoundersRate />} />;
}

function FoundersRate() {
  return (
    <div className="mt-12 flex flex-col gap-2.5">
      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#4a9c75]" />
        Limited Time Offer
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[44px] font-semibold leading-none tracking-[-0.025em] text-white">
          $49
        </span>
        <span className="text-[15px] text-white/65">/month</span>
      </div>
      <div className="text-[13px] leading-relaxed text-white/75">
        Founders Rate locks your price for 12 months.
      </div>
    </div>
  );
}
