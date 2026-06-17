import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Next Surplus Mockups",
  robots: { index: false, follow: false },
};

export default function MockupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
      />
      <div
        className="min-h-screen w-full bg-white text-[#04261c]"
        style={{
          fontFamily:
            "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        <div className="border-b border-[#e5e7eb] bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link
              href="/signup-mockups"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04261c]"
            >
              Next Surplus Auth Mockups
            </Link>
            <div className="flex items-center gap-5 text-[12px] text-[#6b7280]">
              <Link href="/signup-mockups" className="hover:text-[#04261c]">
                Signup Gallery
              </Link>
              <Link href="/login-mockups" className="hover:text-[#04261c]">
                Login Gallery
              </Link>
            </div>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
