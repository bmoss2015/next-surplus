// Auth pages render outside the AppShell — full-page centered layout instead.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex min-h-screen w-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-[20px] font-medium tracking-tight text-petrol-700">
            Next Surplus
          </div>
        </div>
        <div className="rounded-[10px] border border-gray-200 bg-surface p-6 shadow-card">
          {children}
        </div>
      </div>
    </div>
  );
}
