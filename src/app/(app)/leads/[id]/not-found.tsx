import Link from "next/link";

export default function LeadNotFound() {
  return (
    <div className="px-7 py-6">
      <div className="mb-4 text-xs text-gray-500">
        <Link href="/leads" className="hover:text-petrol-500">
          Leads
        </Link>{" "}
        · Not found
      </div>
      <div className="rounded-lg border border-dashed border-gray-200 bg-surface p-10 text-center">
        <div className="text-[11px] tracking-[0.4px] text-gray-500">
          Lead not found
        </div>
        <div className="mt-2 text-[15px] text-ink">
          This lead either doesn't exist or has been deleted.
        </div>
        <Link
          href="/leads"
          className="mt-4 inline-block rounded-md border border-petrol-500 bg-petrol-500 px-4 py-2 text-xs font-medium text-white hover:bg-petrol-700"
        >
          Back to Leads
        </Link>
      </div>
    </div>
  );
}
