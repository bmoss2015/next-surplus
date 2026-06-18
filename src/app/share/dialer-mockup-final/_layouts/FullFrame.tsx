import Link from "next/link";
import { CANVAS_W, CANVAS_H } from "../_data";

export type Tab = { label: string; href: string; key: string };

export function FullFrame({
  label,
  tabs,
  active,
  children,
}: {
  label: string;
  tabs: Tab[];
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] px-7 py-7">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/share/dialer-mockup-final"
          className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 hover:text-ink"
        >
          ← All Variants
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400">
            {label}
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-[11px] font-semibold tracking-tight ${
                  active === t.key
                    ? "bg-petrol-700 text-white"
                    : "text-gray-500 hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div
        className="mx-auto overflow-hidden rounded-2xl shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)]"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        {children}
      </div>
    </div>
  );
}
