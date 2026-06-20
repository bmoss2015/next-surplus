import {
  IconChevronDown,
  IconPhone,
  IconMicrophone,
  IconClock,
  IconMail,
  IconArrowRight,
} from "@tabler/icons-react";

export default function VariantA() {
  return (
    <div className="flex min-h-[calc(100vh-49px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Variant A &middot; Just Pick A List
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-[#0f1729]">
            Start A Dialer Session
          </h1>
          <div className="mt-1.5 text-[13px] text-[#6b7280]">
            Pick a list. Hit Start.
          </div>
        </div>

        <div
          className="rounded-[14px] bg-white p-7"
          style={{
            boxShadow:
              "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.12)",
          }}
        >
          <label className="block text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
            List To Dial
          </label>
          <button
            type="button"
            className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white px-5 py-4 text-left transition hover:border-[#0f1729]"
          >
            <div className="min-w-0">
              <div className="text-[16px] font-semibold tracking-[-0.005em] text-[#0f1729]">
                First Contact Due
              </div>
              <div className="mt-0.5 text-[12px] text-[#6b7280]">
                Saved View &middot; Updated Jun 20, 2026
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-[#13644e] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-white">
                47 Leads
              </span>
              <IconChevronDown size={16} stroke={2} className="text-[#9ca3af]" />
            </div>
          </button>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
                Using Your Defaults
              </div>
              <button
                type="button"
                className="cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
              >
                Change For This Session
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
              <DefaultRow icon={<IconPhone size={14} stroke={2} />} label="Caller ID" value="Auto Map By State" />
              <DefaultRow icon={<IconMicrophone size={14} stroke={2} />} label="Voicemail" value="Default Outreach" />
              <DefaultRow icon={<IconClock size={14} stroke={2} />} label="Wrap Up" value="30 Seconds" />
              <DefaultRow icon={<IconMail size={14} stroke={2} />} label="Auto Followup" value="4 Templates Set" />
            </div>
          </div>

          <button
            type="button"
            className="mt-7 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#0a3d4a] to-[#13644e] text-[14px] font-semibold tracking-[-0.005em] text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_8px_20px_-4px_rgba(13,75,58,0.30)] transition hover:opacity-95"
          >
            Start Session
            <IconArrowRight size={15} stroke={2.25} />
          </button>
        </div>

        <div className="mt-4 text-center text-[11.5px] text-[#9ca3af]">
          Time zone gate active. Will not dial before 8am or after 9pm local to each lead.
        </div>
      </div>
    </div>
  );
}

function DefaultRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#6b7280]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.06em] text-[#9ca3af]">
          {label}
        </div>
        <div className="text-[12.5px] font-medium text-[#0f1729]">{value}</div>
      </div>
    </div>
  );
}
