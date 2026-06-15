"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="absolute inset-0 flex min-h-screen w-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
          Error 500
        </div>
        <h1 className="m-0 mb-3 text-[28px] font-semibold tracking-tight text-ink">
          Something Went Wrong
        </h1>
        <p className="mx-auto mb-5 max-w-sm text-[13.5px] leading-relaxed text-gray-500">
          We hit an unexpected error while loading this page. The issue
          has been logged. You can try again, head back to the
          dashboard, or contact support if it persists.
        </p>
        {error.digest && (
          <p className="mb-7 text-[11px] text-gray-400">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 w-44 cursor-pointer items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 w-44 items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-petrol-300"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="mt-6 text-[11px] text-gray-400">
          Need help?{" "}
          <a
            href="mailto:support@nextsurplus.com"
            className="text-petrol-500 hover:text-petrol-700"
          >
            support@nextsurplus.com
          </a>
        </div>
      </div>
    </div>
  );
}
