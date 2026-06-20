import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dialer Wizard Mockups",
  robots: { index: false, follow: false },
};

export default function DialerWizardMockupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full bg-[#f7f8f9] text-[#0f1729]"
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        letterSpacing: "-0.005em",
      }}
    >
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/share/dialer-wizard"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]"
          >
            Dialer Wizard Mockups
          </Link>
          <div className="flex items-center gap-4 text-[12px] text-[#6b7280]">
            <Link href="/share/dialer-wizard/a" className="hover:text-[#0f1729]">
              A
            </Link>
            <Link href="/share/dialer-wizard/b" className="hover:text-[#0f1729]">
              B
            </Link>
            <Link href="/share/dialer-wizard/c" className="hover:text-[#0f1729]">
              C
            </Link>
            <Link href="/share/dialer-wizard/d" className="hover:text-[#0f1729]">
              D
            </Link>
            <Link href="/share/dialer-wizard/e" className="hover:text-[#0f1729]">
              E
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
