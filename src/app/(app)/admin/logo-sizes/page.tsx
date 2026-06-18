const VARIANTS: { letter: string; icon: number; gap: number }[] = [
  { letter: "A", icon: 11, gap: 8 },
  { letter: "B", icon: 13, gap: 8 },
  { letter: "C", icon: 14, gap: 8 },
  { letter: "D", icon: 16, gap: 8 },
  { letter: "E", icon: 18, gap: 8 },
  { letter: "F", icon: 22, gap: 10 },
  { letter: "G", icon: 28, gap: 12 },
];

export default function LogoSizesPage() {
  return (
    <div className="p-10">
      <div className="mb-8">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">
          Sidebar Logo Sizing
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] text-gray-600">
          Seven candidates rendered at the actual sidebar width (220px) on the
          real dark gradient. Pick the letter you want and I will wire it into
          the live sidebar brand row.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {VARIANTS.map((v) => (
          <div key={v.letter} className="flex items-center gap-6">
            <div className="w-24 shrink-0">
              <div className="text-[28px] font-bold tracking-tight text-ink">
                {v.letter}
              </div>
              <div className="text-[12px] text-gray-500">
                Icon {v.icon}px, Gap {v.gap}px
              </div>
            </div>
            <div
              className="relative flex h-16 shrink-0 items-center pr-3 text-white"
              style={{
                width: 220,
                paddingLeft: 10,
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
              <div className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight text-white">
                Next Surplus
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
