import Link from "next/link";
import { CANVAS_W, CANVAS_H } from "../_data";

export function FullFrame({
  label,
  liveHref,
  wrapHref,
  active,
  children,
}: {
  label: string;
  liveHref: string;
  wrapHref: string;
  active: "live" | "wrap";
  children: React.ReactNode;
}) {
  const tabBase =
    "inline-flex h-8 items-center rounded-lg px-4 text-[11px] font-semibold tracking-tight cursor-pointer";
  return (
    <div className="min-h-screen bg-gray-50 px-7 py-7">
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
          <div className="flex items-center gap-1.5 rounded-lg bg-white p-1 ring-1 ring-inset ring-gray-200">
            <Link
              href={liveHref}
              className={`${tabBase} ${
                active === "live"
                  ? "bg-petrol-700 text-white"
                  : "text-gray-500 hover:text-ink"
              }`}
            >
              Live Call
            </Link>
            <Link
              href={wrapHref}
              className={`${tabBase} ${
                active === "wrap"
                  ? "bg-petrol-700 text-white"
                  : "text-gray-500 hover:text-ink"
              }`}
            >
              Wrap Up
            </Link>
          </div>
        </div>
      </div>
      <div
        className="mx-auto overflow-hidden rounded-2xl ring-1 ring-inset ring-gray-200 shadow-card"
        style={{ width: CANVAS_W, height: CANVAS_H }}
      >
        {children}
      </div>
    </div>
  );
}
