import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "A2P Wizard Variants",
  robots: { index: false, follow: false },
};

export default function A2pWizardLayout({ children }: { children: React.ReactNode }) {
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
            A2P Wizard Variants
          </span>
          <div className="flex items-center gap-4 text-[12px] text-[#5b606a]">
            <Link href="/share/a2p-wizard?v=1" className="hover:text-[#0a0d14]">V1 Dark Hero</Link>
            <Link href="/share/a2p-wizard?v=2" className="hover:text-[#0a0d14]">V2 Sidebar Rail</Link>
            <Link href="/share/a2p-wizard?v=3" className="hover:text-[#0a0d14]">V3 Card Stack</Link>
            <Link href="/share/a2p-wizard?v=4" className="hover:text-[#0a0d14]">V4 Split Preview</Link>
            <Link href="/share/a2p-wizard?v=5" className="hover:text-[#0a0d14]">V5 Branded Form</Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
