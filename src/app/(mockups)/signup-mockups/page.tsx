import Link from "next/link";

const VARIANTS = [
  {
    slug: "v1",
    name: "Linear",
    layout: "Centered Single Column",
    anchor: "linear.app/signup",
    rationale:
      "Bree's confirmed visual language target. Tight typographic hierarchy, generous outer whitespace, no chrome.",
  },
  {
    slug: "v2",
    name: "Attio",
    layout: "Split, Brand Left",
    anchor: "attio.com signup",
    rationale:
      "Modernist CRM peer. Deep emerald panel left with product preview, form right. Carries brand weight without graphics.",
  },
  {
    slug: "v3",
    name: "Vercel",
    layout: "Centered Single Column",
    anchor: "vercel.com/signup",
    rationale:
      "Reference for compact centered card with quiet social proof row below the form. Minimal label weight.",
  },
  {
    slug: "v4",
    name: "Supabase",
    layout: "Split, Brand Right",
    anchor: "supabase.com/dashboard/sign-up",
    rationale:
      "Form left, branded value props right. Mirrors the activation pattern that works for technical buyers.",
  },
  {
    slug: "v5",
    name: "Pipedrive",
    layout: "Split, Brand Right",
    anchor: "pipedrive.com signup",
    rationale:
      "Closest peer by use case. Form left, what-you-get checklist right. Proven activation funnel for sales operators.",
  },
];

export default function SignupGallery() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#04261c]">
          Signup Mockups
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#6b7280]">
          Five variants, anchored to real signup pages researched on June 17, 2026.
          Both centered single column and split layouts are represented. Each variant
          renders as a clickable page so proportions are visible in browser.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.slug}
            href={`/signup-mockups/${v.slug}`}
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
          <li>Headline: Create Your Account</li>
          <li>Subhead: 14 day free trial. $49 a month, locked for 12 months.</li>
          <li>Card required, no free tier, Stripe gated.</li>
          <li>Plus Jakarta Sans Medium per brand pack.</li>
          <li>Emerald palette: #04261c, #13644e, #4a9c75, white.</li>
          <li>Continue With Google uses lite scopes only (openid, email, profile).</li>
        </ul>
      </div>
    </div>
  );
}
