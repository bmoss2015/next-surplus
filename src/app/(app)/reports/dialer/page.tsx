import Link from "next/link";
import { Phone, ArrowLeft } from "lucide-react";

export const dynamic = "force-static";

export default function DialerReportsPage() {
  return (
    <div className="px-7 py-6">
      <Link
        href="/reports"
        className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-ink"
      >
        <ArrowLeft size={12} strokeWidth={1.75} />
        Back to Reports
      </Link>
      <div className="mb-[22px]">
        <h1 className="m-0 text-[22px] font-medium tracking-tight text-ink">
          Dialer
        </h1>
        <div className="mt-1 text-[13px] text-gray-500">
          Outbound call activity, connect rate, and disposition mix.
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[14px]">
        <Stat label="Calls Placed" value="—" hint="Last 7 days" />
        <Stat label="Connect Rate" value="—" hint="Answered ÷ Placed" />
        <Stat label="Avg Talk Time" value="—" hint="Connected calls" />
        <Stat label="Callbacks Scheduled" value="—" hint="Open as of today" />
      </div>

      <div className="mt-5 rounded-lg border border-dashed border-gray-200 bg-surface px-6 py-14 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-petrol-100 text-petrol-700">
          <Phone size={18} strokeWidth={1.75} />
        </div>
        <div className="text-[15px] font-medium text-ink">
          Dialer Reporting Coming Soon
        </div>
        <div className="mx-auto mt-1 max-w-md text-[12.5px] text-gray-500">
          Once outbound calling goes live, this page will show connect rate by
          state, top dispositions, and average attempts per recovered lead.
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-surface px-4 py-3.5">
      <div className="text-[10.5px] uppercase tracking-[0.4px] text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-[22px] font-medium tracking-tight text-ink">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-gray-500">{hint}</div>
    </div>
  );
}
