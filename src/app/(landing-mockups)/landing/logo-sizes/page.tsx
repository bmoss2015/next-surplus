import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logo Size Mockups | Next Surplus",
};

const SIZES = [
  { px: 20, label: "A — 20px icon" },
  { px: 24, label: "B — 24px icon" },
  { px: 28, label: "C — 28px icon" },
  { px: 32, label: "D — 32px icon" },
  { px: 36, label: "E — 36px icon (current preview)" },
];

export default function LogoSizesMockup() {
  return (
    <div className="min-h-screen bg-[#02100c]">
      <div className="mx-auto max-w-6xl px-8 pt-10 pb-20">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
          Landing Hero Nav
        </div>
        <h1 className="m-0 text-[28px] font-semibold tracking-tight text-white">
          Logo Size Comparison
        </h1>
        <p className="mt-2 text-[13.5px] text-white/65">
          Each row is the full nav rendered on the same dark gradient as the
          hero. Wordmark stays at 18px Plus Jakarta 500. Only the icon size
          changes. Pick the letter you want.
        </p>

        <div className="mt-8 space-y-5">
          {SIZES.map((s) => (
            <div
              key={s.px}
              className="overflow-hidden rounded-xl border border-white/10"
            >
              <div className="border-b border-white/10 bg-black/30 px-5 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.18em] text-white/60">
                {s.label}
              </div>
              <div
                style={{
                  background:
                    "radial-gradient(ellipse at top, #0d4b3a 0%, #051a14 60%, #02100c 100%)",
                }}
              >
                <SampleNav iconPx={s.px} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-[12.5px] text-white/55">
          <Link href="/landing/v1" className="underline hover:text-white">
            ← Back to v1 landing
          </Link>
        </div>
      </div>
    </div>
  );
}

function SampleNav({ iconPx }: { iconPx: number }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-6">
      <div
        aria-label="Next Surplus"
        className="inline-flex items-center gap-2.5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/11-icon-dark-bg-transparent.svg"
          alt=""
          aria-hidden
          width={iconPx}
          height={iconPx}
          className="shrink-0"
        />
        <span
          className="text-[18px] text-white"
          style={{
            fontFamily:
              "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.012em",
            wordSpacing: "0.14em",
          }}
        >
          Next Surplus
        </span>
      </div>
      <nav className="flex items-center gap-8 text-[12.5px] text-white/70">
        <span>Product</span>
        <span>Pricing</span>
        <span>FAQ</span>
        <span>Log in</span>
        <span className="rounded-md bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-[#0d4b3a]">
          Start Free Trial
        </span>
      </nav>
    </header>
  );
}
