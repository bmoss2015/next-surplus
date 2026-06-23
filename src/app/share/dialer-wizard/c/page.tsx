import {
  IconChevronDown,
  IconArrowRight,
  IconUsers,
  IconAdjustmentsHorizontal,
  IconMailForward,
} from "@tabler/icons-react";

const OUTCOMES = [
  { name: "Called", template: "Spoke Call Recap" },
  { name: "Voicemail", template: "Voicemail Followup" },
  { name: "No Answer", template: "Do Not Send" },
  { name: "Wrong Number", template: "Do Not Send" },
];

export default function VariantC() {
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Variant C &middot; Card Stack
        </div>
        <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          Start A Dialer Session
        </h1>
        <div className="mt-1 text-[13px] text-[#6b7280]">
          Three concerns, one screen. Adjust any of them inline.
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card
          step="01"
          title="Who"
          icon={<IconUsers size={16} stroke={2} />}
          adjustLabel="Change List"
        >
          <div className="rounded-[8px] border border-[#e5e7eb] bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-semibold tracking-[-0.005em] text-[#0f1729]">
                First Contact Due
              </div>
              <IconChevronDown size={14} stroke={2} className="text-[#9ca3af]" />
            </div>
            <div className="mt-1 text-[11.5px] text-[#6b7280]">
              Saved View
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-[28px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
                47
              </div>
              <div className="text-[11.5px] text-[#6b7280]">Leads</div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-semibold tabular-nums text-[#0f1729]">
                3h 45m
              </div>
              <div className="text-[11.5px] text-[#6b7280]">Est. Session</div>
            </div>
          </div>
        </Card>

        <Card
          step="02"
          title="How"
          icon={<IconAdjustmentsHorizontal size={16} stroke={2} />}
          adjustLabel="Adjust Defaults"
        >
          <Row label="Caller ID" value="Auto Map By State" />
          <Row label="Voicemail" value="Default Outreach" />
          <Row label="Wrap Up" value="30 Seconds" />
          <Row label="Skip Rules" value="DNC, Litigated, Mailed < 60d" />
        </Card>

        <Card
          step="03"
          title="After"
          icon={<IconMailForward size={16} stroke={2} />}
          adjustLabel="Edit Templates"
        >
          <div className="text-[11.5px] text-[#6b7280]">
            Auto Followup By Outcome
          </div>
          <div className="mt-2 space-y-1.5">
            {OUTCOMES.map((o) => (
              <div
                key={o.name}
                className="flex items-center justify-between rounded-[6px] border border-[#f1f2f4] bg-white px-2.5 py-1.5"
              >
                <span className="text-[12px] font-medium text-[#0f1729]">
                  {o.name}
                </span>
                <span className="text-[11.5px] text-[#6b7280]">{o.template}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-[12px] bg-[#0f1729] px-6 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#9ca3af]">
            Ready To Launch
          </div>
          <div className="mt-0.5 text-[16px] font-semibold text-white">
            47 Leads &middot; First Contact Due
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#13644e] to-[#1d8a73] px-6 text-[13.5px] font-semibold text-white shadow-[0_4px_16px_-2px_rgba(29,138,115,0.5)] transition hover:opacity-95"
        >
          Start Session
          <IconArrowRight size={15} stroke={2.25} />
        </button>
      </div>
    </div>
  );
}

function Card({
  step,
  title,
  icon,
  adjustLabel,
  children,
}: {
  step: string;
  title: string;
  icon: React.ReactNode;
  adjustLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] bg-white p-5"
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[#e5e7eb] bg-white text-[#13644e]">
            {icon}
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
              {step}
            </div>
            <div className="text-[15px] font-semibold tracking-[-0.005em] text-[#0f1729]">
              {title}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="cursor-pointer text-[11.5px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
        >
          {adjustLabel}
        </button>
      </div>
      <div className="mt-4 space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-[#f1f2f4] pb-1.5 last:border-b-0 last:pb-0">
      <span className="text-[11.5px] text-[#9ca3af]">{label}</span>
      <span className="truncate text-[12px] font-medium text-[#0f1729]">
        {value}
      </span>
    </div>
  );
}
