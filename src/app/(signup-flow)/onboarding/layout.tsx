import { LockupHorizontal } from "../../(mockups)/_components/BrandMark";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <LockupHorizontal size="sm" />
          <a
            href="/login"
            className="text-[11.5px] text-[#6b7280] hover:text-[#04261c]"
          >
            Sign Out
          </a>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 py-14">
        {children}
      </main>
    </div>
  );
}
