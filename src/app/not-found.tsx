import Link from "next/link";

export const metadata = {
  title: "Page Not Found | Next Surplus",
};

export default function NotFound() {
  return (
    <div className="absolute inset-0 flex min-h-screen w-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-petrol-700">
          Error 404
        </div>
        <h1 className="m-0 mb-3 text-[28px] font-semibold tracking-tight text-ink">
          Page Not Found
        </h1>
        <p className="mx-auto mb-7 max-w-sm text-[13.5px] leading-relaxed text-gray-500">
          The page you are looking for has moved, been renamed, or never
          existed. Check the URL or head back to where you were.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 w-44 items-center justify-center rounded-md btn-primary text-[13px] font-medium text-white"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 w-44 items-center justify-center rounded-md border border-gray-200 bg-white text-[13px] font-medium text-ink hover:border-petrol-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
