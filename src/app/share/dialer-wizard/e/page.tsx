import {
  IconArrowRight,
  IconCheck,
  IconPhone,
  IconMicrophone,
  IconClock,
  IconMail,
} from "@tabler/icons-react";

const SAVED_VIEWS = [
  { name: "First Contact Due", count: 47, active: true },
  { name: "Callback Today", count: 8, active: false },
  { name: "Awaiting Signature", count: 12, active: false },
  { name: "High Surplus > $50k", count: 23, active: false },
];

const REFINE_CHIPS = [
  { label: "All States", active: true },
  { label: "Surplus > $20k", active: true },
  { label: "Has Phone", active: true },
];

export default function VariantE() {
  return (
    <div className="mx-auto max-w-[920px] px-6 py-10">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Variant E &middot; Two-Step Minimal
        </div>
        <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          Start A Dialer Session
        </h1>
        <div className="mt-1 text-[13px] text-[#6b7280]">
          Both steps shown stacked below so you can compare the full flow.
        </div>
      </div>

      <StepShell stepNumber={1} stepLabel="Pick List" totalSteps={2}>
        <div>
          <label className="block text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
            Saved Views
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SAVED_VIEWS.map((v) => (
              <button
                key={v.name}
                type="button"
                className={[
                  "flex cursor-pointer items-center justify-between rounded-[10px] border px-4 py-3 text-left transition",
                  v.active
                    ? "border-[#0f1729] bg-white"
                    : "border-[#e5e7eb] bg-white hover:border-[#9ca3af]",
                ].join(" ")}
              >
                <div>
                  <div className="text-[13.5px] font-semibold text-[#0f1729]">
                    {v.name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#6b7280]">
                    Saved View
                  </div>
                </div>
                <span
                  className={[
                    "rounded-md px-2 py-0.5 text-[11.5px] font-semibold tabular-nums",
                    v.active ? "bg-[#13644e] text-white" : "bg-[#f1f2f4] text-[#6b7280]",
                  ].join(" ")}
                >
                  {v.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
            Refine This Session
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {REFINE_CHIPS.map((c) => (
              <span
                key={c.label}
                className="inline-flex cursor-pointer items-center rounded-full border border-[#0f1729] bg-[#0f1729] px-3 py-1.5 text-[12px] font-medium text-white"
              >
                {c.label}
              </span>
            ))}
            <span className="inline-flex cursor-pointer items-center rounded-full border border-dashed border-[#9ca3af] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6b7280]">
              + Add Filter
            </span>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-[#f1f2f4] pt-5">
          <div className="text-[12.5px] text-[#6b7280]">
            <span className="font-semibold text-[#0f1729]">47</span> Leads After Refine
          </div>
          <button
            type="button"
            className="flex h-10 w-[180px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] bg-[#0f1729] text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            Continue
            <IconArrowRight size={14} stroke={2.25} />
          </button>
        </div>
      </StepShell>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e5e7eb]" />
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          User Clicks Continue
        </div>
        <div className="h-px flex-1 bg-[#e5e7eb]" />
      </div>

      <StepShell stepNumber={2} stepLabel="Confirm + Start" totalSteps={2}>
        <div className="rounded-[10px] border border-[#e5e7eb] bg-white px-5 py-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-[0.10em] text-[#6b7280]">
                Dialing
              </div>
              <div className="mt-1 text-[20px] font-semibold tracking-[-0.01em] text-[#0f1729]">
                First Contact Due
              </div>
              <div className="mt-0.5 text-[12px] text-[#6b7280]">
                Surplus &gt; $20k, Has Phone, All States
              </div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-semibold tabular-nums tracking-[-0.02em] text-[#0f1729]">
                47
              </div>
              <div className="text-[11.5px] text-[#6b7280]">Leads</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <ConfirmRow icon={<IconPhone size={14} stroke={2} />} label="Caller ID" value="Auto Map By State" />
          <ConfirmRow icon={<IconMicrophone size={14} stroke={2} />} label="Voicemail" value="Default Outreach" />
          <ConfirmRow icon={<IconClock size={14} stroke={2} />} label="Wrap Up" value="30 Seconds" />
          <ConfirmRow icon={<IconMail size={14} stroke={2} />} label="Auto Followup" value="4 Templates Set" />
        </div>
        <button
          type="button"
          className="mt-3 cursor-pointer text-[12px] font-medium text-[#13644e] hover:text-[#0a3d4a]"
        >
          Change For This Session
        </button>

        <div className="mt-6 flex items-center justify-between border-t border-[#f1f2f4] pt-5">
          <button
            type="button"
            className="flex h-10 w-[120px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e7eb] bg-white text-[13px] font-semibold text-[#0f1729] transition hover:border-[#0f1729]"
          >
            Back
          </button>
          <button
            type="button"
            className="flex h-10 w-[200px] cursor-pointer items-center justify-center gap-1.5 rounded-[10px] bg-gradient-to-r from-[#0a3d4a] to-[#13644e] text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(13,75,58,0.20),0_8px_20px_-4px_rgba(13,75,58,0.30)] transition hover:opacity-95"
          >
            Start Session
            <IconArrowRight size={14} stroke={2.25} />
          </button>
        </div>
      </StepShell>
    </div>
  );
}

function StepShell({
  stepNumber,
  stepLabel,
  totalSteps,
  children,
}: {
  stepNumber: number;
  stepLabel: string;
  totalSteps: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] bg-white p-7"
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,41,0.04), 0 12px 32px -8px rgba(15,23,41,0.10)",
      }}
    >
      <div className="mb-5 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const n = i + 1;
          const done = n < stepNumber;
          const active = n === stepNumber;
          return (
            <div key={n} className="flex items-center gap-2">
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  done
                    ? "bg-[#13644e] text-white"
                    : active
                      ? "bg-[#0f1729] text-white"
                      : "bg-[#f1f2f4] text-[#9ca3af]",
                ].join(" ")}
              >
                {done ? <IconCheck size={12} stroke={3} /> : n}
              </div>
              <div
                className={[
                  "text-[12.5px] font-medium",
                  active ? "text-[#0f1729]" : done ? "text-[#374151]" : "text-[#9ca3af]",
                ].join(" ")}
              >
                {n === stepNumber ? stepLabel : n === 1 ? "Pick List" : "Confirm + Start"}
              </div>
              {n < totalSteps && <div className="ml-1 h-px w-8 bg-[#e5e7eb]" />}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}

function ConfirmRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-[#f1f2f4] bg-white px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-[#6b7280]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.06em] text-[#9ca3af]">
          {label}
        </div>
        <div className="truncate text-[12.5px] font-medium text-[#0f1729]">
          {value}
        </div>
      </div>
    </div>
  );
}
