import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Phone Numbers Approved-State Variants",
  robots: { index: false, follow: false },
};

export default function ApprovedStateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full bg-[#fafbfc] text-[#0a0d14]"
      style={{
        fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        letterSpacing: "-0.005em",
        fontFeatureSettings: "'cv11'",
      }}
    >
      <div className="border-b border-[#ebedf0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a0d14]">
            Approved-State Variants V2
          </span>
          <div className="flex items-center gap-4 text-[12px] text-[#5b606a]">
            <Link href="/share/phone-numbers-approved?v=1" className="hover:text-[#0a0d14]">V1 Compliance</Link>
            <Link href="/share/phone-numbers-approved?v=2" className="hover:text-[#0a0d14]">V2 Sender</Link>
            <Link href="/share/phone-numbers-approved?v=3" className="hover:text-[#0a0d14]">V3 Activity</Link>
            <Link href="/share/phone-numbers-approved?v=4" className="hover:text-[#0a0d14]">V4 Two Card</Link>
            <Link href="/share/phone-numbers-approved?v=5" className="hover:text-[#0a0d14]">V5 Top Strip</Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
