const VARIANTS: { letter: string; height: number }[] = [
  { letter: "A", height: 14 },
  { letter: "B", height: 18 },
  { letter: "C", height: 22 },
  { letter: "D", height: 26 },
  { letter: "E", height: 30 },
  { letter: "F", height: 34 },
  { letter: "G", height: 38 },
];

const LOCKUP_RATIO = 446 / 52;

function Lockup({ height }: { height: number }) {
  const width = Math.round(height * LOCKUP_RATIO);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="14 14 446 52"
      width={width}
      height={height}
      style={{
        fontFamily:
          "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <polygon points="40,26 54,40 40,54 26,40" fill="#ffffff" />
      <polygon points="40,26 54,40 40,40" fill="#13644e" />
      <polygon points="40,40 54,40 40,54" fill="#4a9c75" />
      <text
        x="90"
        y="56"
        fontSize="42"
        fontWeight="500"
        fill="#ffffff"
        letterSpacing="-0.5"
        wordSpacing="6"
      >
        Next Surplus
      </text>
    </svg>
  );
}

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
            Seven candidates rendered from the real lockup geometry (matches
            /brand/04-lockup-horizontal-dark.svg, white-square removed, white
            left facet + green right facets). Each strip is 220px wide on the
            actual sidebar gradient. Pick the letter you want and I will wire
            it in.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          {VARIANTS.map((v) => {
            const width = Math.round(v.height * LOCKUP_RATIO);
            return (
              <div key={v.letter} className="flex items-center gap-6">
                <div className="w-28 shrink-0">
                  <div className="text-[28px] font-bold tracking-tight text-ink">
                    {v.letter}
                  </div>
                  <div className="text-[12px] text-gray-500">
                    Height {v.height}px
                  </div>
                  <div className="text-[12px] text-gray-500">
                    Width {width}px
                  </div>
                </div>
                <div
                  className="relative flex h-16 shrink-0 items-center pl-[10px] pr-3"
                  style={{
                    width: 220,
                    background:
                      "linear-gradient(180deg, #04261c 0%, #0d4b3a 100%)",
                  }}
                >
                  <Lockup height={v.height} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
