import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Phone Numbers Mockups",
  robots: { index: false, follow: false },
};

export default function PhoneNumbersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full bg-[#fafbfc] text-[#0a0d14]"
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        letterSpacing: "-0.005em",
        fontFeatureSettings: "'cv11'",
      }}
    >
      <div className="border-b border-[#ebedf0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/share/phone-numbers"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a0d14]"
          >
            Phone Numbers Mockups
          </Link>
          <div className="flex items-center gap-4 text-[12px] text-[#5b606a]">
            <Link href="/share/phone-numbers/a" className="hover:text-[#0a0d14]">A</Link>
            <Link href="/share/phone-numbers/b" className="hover:text-[#0a0d14]">B</Link>
            <Link href="/share/phone-numbers/c" className="hover:text-[#0a0d14]">C</Link>
            <Link href="/share/phone-numbers/d" className="hover:text-[#0a0d14]">D</Link>
            <Link href="/share/phone-numbers/e" className="hover:text-[#0a0d14]">E</Link>
            <span className="text-[#ebedf0]">|</span>
            <Link href="/share/phone-numbers/f" className="font-semibold text-[#0d4b3a] hover:opacity-70">F</Link>
            <Link href="/share/phone-numbers/g" className="font-semibold text-[#0d4b3a] hover:opacity-70">G</Link>
            <Link href="/share/phone-numbers/h" className="font-semibold text-[#0d4b3a] hover:opacity-70">H</Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
