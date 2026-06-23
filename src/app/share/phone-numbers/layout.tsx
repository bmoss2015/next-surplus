import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phone Numbers Mockup",
  robots: { index: false, follow: false },
};

export default function PhoneNumbersLayout({
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
      {children}
    </div>
  );
}
