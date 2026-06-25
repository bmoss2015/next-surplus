import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A2P Wizard Final",
  robots: { index: false, follow: false },
};

export default function A2pWizardFinalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full bg-[#fafbfc] text-[#0a0d14]"
      style={{
        fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        letterSpacing: "-0.005em",
        fontFeatureSettings: "'cv11'",
      }}
    >
      {children}
    </div>
  );
}
