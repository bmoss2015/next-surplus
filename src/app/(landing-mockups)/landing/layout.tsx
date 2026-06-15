import Link from "next/link";

export default function LandingMockupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
            Landing Mockups
          </div>
          <div className="flex items-center gap-4 text-[12px] text-gray-600">
            <Link href="/landing/v1" className="hover:text-ink">
              v1 Linear
            </Link>
            <Link href="/landing/v2" className="hover:text-ink">
              v2 Stripe
            </Link>
            <Link href="/landing/v3" className="hover:text-ink">
              v3 Vercel
            </Link>
            <Link href="/landing/v4" className="hover:text-ink">
              v4 Notion
            </Link>
            <Link href="/landing/v5" className="hover:text-ink">
              v5 Anthropic
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
