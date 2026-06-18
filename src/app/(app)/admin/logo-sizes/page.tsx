const VARIANTS: { letter: string; icon: number; gap: number }[] = [
  { letter: "A", icon: 24, gap: 10 },
  { letter: "B", icon: 28, gap: 10 },
  { letter: "C", icon: 32, gap: 12 },
  { letter: "D", icon: 36, gap: 12 },
  { letter: "E", icon: 40, gap: 14 },
  { letter: "F", icon: 44, gap: 14 },
  { letter: "G", icon: 48, gap: 16 },
];

export default function LogoSizesPage() {
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
      <div className="p-10">
        <div className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">
            Sidebar Logo Sizing
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-gray-600">
            Seven candidates of the actual file at
            /brand/11-icon-dark-bg-transparent.svg rendered via &lt;img&gt;,
            paired with the Next Surplus wordmark in Plus Jakarta Sans 500
            (matches the brand wordmark spec). Each strip is 220px wide on
            the real sidebar gradient. Pick a letter and I will wire it in.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          {VARIANTS.map((v) => (
            <div key={v.letter} className="flex items-center gap-6">
              <div className="w-28 shrink-0">
                <div className="text-[28px] font-bold tracking-tight text-ink">
                  {v.letter}
                </div>
                <div className="text-[12px] text-gray-500">
                  Icon {v.icon}px
                </div>
                <div className="text-[12px] text-gray-500">
                  Gap {v.gap}px
                </div>
              </div>
              <div
                className="relative flex h-16 shrink-0 items-center pl-[14px] pr-3 text-white"
                style={{
                  width: 220,
                  gap: v.gap,
                  background:
                    "linear-gradient(180deg, #04261c 0%, #0d4b3a 100%)",
                }}
              >
                <img
                  src="/brand/11-icon-dark-bg-transparent.svg"
                  alt=""
                  aria-hidden
                  width={v.icon}
                  height={v.icon}
                  className="shrink-0"
                />
                <div
                  className="min-w-0 flex-1 truncate text-[15px] tracking-tight text-white"
                  style={{
                    fontFamily:
                      "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
                    fontWeight: 500,
                    letterSpacing: "-0.012em",
                    wordSpacing: "0.14em",
                  }}
                  title="Next Surplus"
                >
                  Next Surplus
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
