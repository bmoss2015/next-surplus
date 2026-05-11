"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function hrefFor(targetPage: number) {
    const sp = new URLSearchParams(params.toString());
    if (targetPage <= 1) sp.delete("page");
    else sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <div className="text-xs text-gray-500">
        {total === 0 ? "No leads" : `${start}–${end} of ${total}`}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Link
            href={hrefFor(page - 1)}
            aria-disabled={page <= 1}
            className={cn(
              "rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs",
              page <= 1
                ? "pointer-events-none text-gray-300"
                : "text-ink hover:border-petrol-500 hover:text-petrol-500"
            )}
          >
            Previous
          </Link>
          <span className="px-2 text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Link
            href={hrefFor(page + 1)}
            aria-disabled={page >= totalPages}
            className={cn(
              "rounded-md border border-gray-200 bg-surface px-3 py-[5px] text-xs",
              page >= totalPages
                ? "pointer-events-none text-gray-300"
                : "text-ink hover:border-petrol-500 hover:text-petrol-500"
            )}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
