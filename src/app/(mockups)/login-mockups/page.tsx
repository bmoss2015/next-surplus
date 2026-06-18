import Link from "next/link";

const VARIANTS = [
  {
    slug: "v1",
    name: "Linear",
    layout: "Centered Single Column",
    anchor: "linear.app/login",
    rationale:
      "Bree's confirmed visual language target. Tight typographic hierarchy, generous outer whitespace, no chrome.",
  },
  {
    slug: "v2",
    name: "Attio",
    layout: "Split, Brand Left",
    anchor: "attio.com login",
    rationale:
      "Modernist CRM peer. Deep emerald panel left, form right. Same shell as signup so the post-Stripe handoff feels cohesive.",
  },
  {
    slug: "v3",
    name: "Stripe Dashboard",
    layout: "Centered Single Column",
    anchor: "dashboard.stripe.com/login",
    rationale:
      "Compact card with side brand mark. Strong reference for returning customer flows since it gets used hundreds of times per week.",
  },
  {
    slug: "v4",
    name: "Supabase",
    layout: "Split, Brand Right",
    anchor: "supabase.com/dashboard/sign-in",
    rationale:
      "Form left, brand panel right with continuity copy. Pairs naturally with the Supabase signup variant.",
  },
  {
    slug: "v5",
    name: "Folk CRM",
    layout: "Centered Single Column",
    anchor: "folk.app login",
    rationale:
      "Most design forward CRM in market. Large brand mark, typographic h1, underline-style field treatment. Highest visual confidence per pixel.",
  },
];

export default function LoginGallery() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#04261c]">
          Login Mockups
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#6b7280]">
          Five variants, anchored to real login pages researched on June 17, 2026.
          Both centered single column and split layouts are represented. Each variant
          renders as a clickable page so proportions are visible in browser.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.slug}
            href={`/login-mockups/${v.slug}`}
            className="group block rounded-[10px] border border-[#e5e7eb] bg-white p-5 transition hover:border-[#04261c]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
                {v.slug.toUpperCase()}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#13644e]">
                {v.layout}
              </span>
            </div>
            <div className="mt-3 text-[17px] font-semibold tracking-[-0.01em] text-[#04261c]">
              {v.name}
            </div>
            <div className="mt-1 text-[12px] text-[#6b7280]">
              Anchored to {v.anchor}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#374151]">
              {v.rationale}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#04261c] group-hover:underline">
              Open Variant
              <span aria-hidden>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04261c]">
          Constraints Applied To Every Variant
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] text-[#374151] md:grid-cols-2">
          <li>Headline: Welcome Back</li>
          <li>Subhead: Sign in to your Next Surplus workspace.</li>
          <li>Forgot password link inline with password label.</li>
          <li>Plus Jakarta Sans Medium per brand pack.</li>
          <li>Emerald palette: #04261c, #13644e, #4a9c75, white.</li>
          <li>Continue With Google uses lite scopes only (openid, email, profile).</li>
        </ul>
      </div>
    </div>
  );
}
