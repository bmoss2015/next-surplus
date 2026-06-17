import Link from "next/link";

type Variant = {
  slug: string;
  name: string;
  layout: string;
  anchor: string;
  rationale: string;
  round: "Round 1" | "Round 2";
};

const VARIANTS: Variant[] = [
  {
    slug: "v1",
    name: "Linear",
    layout: "Centered Single Column",
    anchor: "linear.app/signup",
    rationale:
      "Tight typographic hierarchy, generous outer whitespace, no chrome.",
    round: "Round 1",
  },
  {
    slug: "v2",
    name: "Attio",
    layout: "Split, Brand Left",
    anchor: "attio.com signup",
    rationale:
      "Modernist CRM peer. Dark left panel, form right. Brand weight without graphics.",
    round: "Round 1",
  },
  {
    slug: "v3",
    name: "Vercel",
    layout: "Centered Single Column",
    anchor: "vercel.com/signup",
    rationale:
      "Compact centered card with quiet social proof row below the form.",
    round: "Round 1",
  },
  {
    slug: "v4",
    name: "Supabase",
    layout: "Split, Brand Right",
    anchor: "supabase.com/dashboard/sign-up",
    rationale:
      "Form left, branded value props right. Conversational copy on the dark side.",
    round: "Round 1",
  },
  {
    slug: "v5",
    name: "Pipedrive",
    layout: "Split, Brand Right (Light)",
    anchor: "pipedrive.com signup",
    rationale:
      "Form left, what-you-get checklist right on a light background.",
    round: "Round 1",
  },
  {
    slug: "v6",
    name: "Notion",
    layout: "Split, Brand Left (Dark)",
    anchor: "notion.so/signup",
    rationale:
      "Dark left, no logo. Typographic hero, check bullets, Founders Rate card. No conversational copy.",
    round: "Round 2",
  },
  {
    slug: "v7",
    name: "Mercury",
    layout: "Split, Brand Right (Dark)",
    anchor: "mercury.com signup",
    rationale:
      "Founders Rate as the hero. $49 in 72px lockup. Sells the limited window hardest.",
    round: "Round 2",
  },
  {
    slug: "v8",
    name: "Cursor",
    layout: "Split, Brand Left (Dark)",
    anchor: "cursor.com signup",
    rationale:
      "Minimalist dark left. Now In Public Beta eyebrow, two-line hero, Founders Rate card. Cleanest reading.",
    round: "Round 2",
  },
  {
    slug: "v9",
    name: "Linear Alt",
    layout: "Split, Brand Right (Dark)",
    anchor: "linear.app pricing handoff",
    rationale:
      "Founders Rate badge above headline. Dark right shows six checks in a 2 column grid. Typographic.",
    round: "Round 2",
  },
  {
    slug: "v10",
    name: "Postman",
    layout: "Split, Brand Left (Dark)",
    anchor: "postman.com signup",
    rationale:
      "Dense 2 column check grid on dark, Founders Rate card pinned bottom. Operator feel, packed without being noisy.",
    round: "Round 2",
  },
];

export default function SignupGallery() {
  const round1 = VARIANTS.filter((v) => v.round === "Round 1");
  const round2 = VARIANTS.filter((v) => v.round === "Round 2");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#04261c]">
          Signup Mockups
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#6b7280]">
          Ten variants, anchored to real signup pages. Each variant renders as a
          clickable page so proportions are visible in browser.
        </p>
      </div>

      <Section
        title="Round 2 (Bree Feedback Applied)"
        subtitle="Split screen, dark side opposite the form, no logo box on the dark side, check bullets and Founders Rate card. New anchors."
      >
        {round2.map((v) => (
          <VariantCard key={v.slug} variant={v} />
        ))}
      </Section>

      <Section
        title="Round 1 (Original)"
        subtitle="Initial pass. Kept reachable for comparison."
      >
        {round1.map((v) => (
          <VariantCard key={v.slug} variant={v} />
        ))}
      </Section>

      <div className="mt-10 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04261c]">
          Constraints Applied To Round 2
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] text-[#374151] md:grid-cols-2">
          <li>Headline: Create Your Account</li>
          <li>Subhead: Founders Rate. $49 a month, price held for 12 months.</li>
          <li>Card required, no free tier, Stripe gated.</li>
          <li>Single password rule (12 or more characters). No composition bars.</li>
          <li>Wordmark only on dark sides. No square logo blob.</li>
          <li>No Workflow Minds attribution anywhere.</li>
        </ul>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="mb-4">
        <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#04261c]">
          {title}
        </h2>
        <p className="mt-1 text-[12.5px] text-[#6b7280]">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function VariantCard({ variant: v }: { variant: Variant }) {
  return (
    <Link
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
  );
}
