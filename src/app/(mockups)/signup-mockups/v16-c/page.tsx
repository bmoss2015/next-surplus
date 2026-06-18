import { V16Layout } from "../../_components/V16Shared";

export default function SignupV16C() {
  return <V16Layout foundersRate={<FoundersRate />} />;
}

function FoundersRate() {
  return (
    <div className="mt-12">
      <div className="h-px w-full bg-white/15" />
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-white/75">
        <span className="font-semibold text-white">$49/month</span>
        <span className="text-white/30" aria-hidden>
          &middot;
        </span>
        <span>Founders Rate locks your price for 12 months</span>
        <span className="text-white/30" aria-hidden>
          &middot;
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
          Limited Time Offer
        </span>
      </div>
    </div>
  );
}
