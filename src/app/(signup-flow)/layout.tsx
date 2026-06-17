import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Surplus",
};

export default function SignupFlowLayout({
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
        {children}
      </div>
    </>
  );
}
