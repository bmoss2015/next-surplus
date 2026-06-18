import Link from "next/link";
import { CANVAS_W, CANVAS_H } from "../_data";

export function FullFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 px-7 py-7">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/dialer-mockup"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
        >
          ← All Dialer Mockups
        </Link>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
          {label}
        </span>
      </div>
      <div className="mx-auto overflow-hidden rounded-2xl ring-1 ring-inset ring-gray-200 shadow-card" style={{ width: CANVAS_W, height: CANVAS_H }}>
        {children}
      </div>
    </div>
  );
}
