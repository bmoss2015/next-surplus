import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landing Mockups | Next Surplus",
};

const VARIANTS = [
  {
    slug: "v1",
    anchor: "Linear",
    summary:
      "Dark gradient, mono-spaced accents, single huge type-forward H1, restrained chrome.",
  },
  {
    slug: "v2",
    anchor: "Stripe",
    summary:
      "Soft gradient background, two-column hero with a screenshot card, structured feature grid below.",
  },
  {
    slug: "v3",
    anchor: "Vercel",
    summary:
      "Full black, dense type, terminal block in the hero, stats row with thin dividers.",
  },
  {
    slug: "v4",
    anchor: "Notion",
    summary:
      "Cream background, serif headline, friendly emoji feature cards, single-plan pricing block.",
  },
  {
    slug: "v5",
    anchor: "Anthropic",
    summary:
      "Editorial. Serif H1, narrow column, definition-list structure for the explainer below.",
  },
];

export default function LandingIndex() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-12">
      <h1 className="m-0 mb-2 text-[28px] font-semibold tracking-tight text-ink">
        Landing Page Mockups
      </h1>
      <p className="mb-8 text-[14px] text-gray-500">
        Five distinct directions, each anchored on a praised SaaS
        landing page. Click each to compare. Pick one, mix and match,
        or tell me what to revise.
      </p>
      <div className="space-y-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.slug}
            href={`/landing/${v.slug}`}
            className="block rounded-lg border border-gray-200 bg-white p-5 hover:border-petrol-300"
          >
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-[15px] font-semibold tracking-tight text-ink">
                  v{v.slug.slice(1)} — {v.anchor} style
                </div>
                <div className="mt-1 text-[13px] leading-relaxed text-gray-600">
                  {v.summary}
                </div>
              </div>
              <div className="text-[12px] text-petrol-500">Open →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
