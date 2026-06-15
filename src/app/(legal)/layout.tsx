import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <nav className="mx-auto flex max-w-3xl items-center justify-between border-b border-gray-200 px-6 py-4">
        <Link
          href="/"
          className="text-[18px] font-bold text-[#0d4b3a] no-underline"
        >
          Next Surplus
        </Link>
        <div className="flex gap-6 text-[14px] font-medium">
          <Link
            href="/privacy"
            className="text-[#13644e] hover:text-[#0d4b3a]"
          >
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-[#13644e] hover:text-[#0d4b3a]">
            Terms of Service
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-[720px] px-6 py-12 leading-[1.7] text-[16px]">
        {children}
      </main>

      <footer className="border-t border-gray-200 px-6 py-8 text-center text-[14px] text-gray-500">
        <p>Moss Equity Partners, LLC (d/b/a Next Surplus)</p>
        <p>
          <a
            href="mailto:support@nextsurplus.com"
            className="text-[#13644e] no-underline hover:text-[#4a9c75]"
          >
            support@nextsurplus.com
          </a>
        </p>
      </footer>
    </div>
  );
}
