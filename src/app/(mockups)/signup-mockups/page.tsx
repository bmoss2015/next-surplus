import Link from "next/link";

type Variant = {
  slug: string;
  name: string;
  layout: string;
  anchor: string;
  rationale: string;
  round: "Round 1" | "Round 2" | "Round 3";
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
  {
    slug: "v11",
    name: "Linear Round 3",
    layout: "Split, Brand Left (Dark)",
    anchor: "linear.app/signup, full bleed copy",
    rationale:
      "Real logo (wordmark from /brand). 48px headline 'Run every case in one place.' fills the panel. Vertical assurance checks. Founders Rate bottom strip with Limited pill.",
    round: "Round 3",
  },
  {
    slug: "v12",
    name: "Stripe Round 3",
    layout: "Split, Brand Right (Dark)",
    anchor: "stripe.com signup",
    rationale:
      "Two tone headline single line: 'Pipeline, inbox, mail. One workspace.' Vertical product features, Founders Rate pill top-right + strip bottom.",
    round: "Round 3",
  },
  {
    slug: "v13",
    name: "Mercury Round 3",
    layout: "Split, Brand Right (Dark)",
    anchor: "mercury.com signup",
    rationale:
      "Founders Rate as hero: $49 in 92px lockup, eyebrow above, lock-in copy below. Trial assurances vertical. Sells the price hardest.",
    round: "Round 3",
  },
  {
    slug: "v14",
    name: "Notion Round 3",
    layout: "Split, Brand Left (Dark)",
    anchor: "notion.so/signup",
    rationale:
      "Your favorite copy layout. Two tone single line: 'One workspace.' bold + 'Every case.' muted. 52px headline. Founders Rate as left-bar ribbon.",
    round: "Round 3",
  },
  {
    slug: "v15",
    name: "Cursor Round 3",
    layout: "Split, Brand Left (Dark)",
    anchor: "cursor.com signup",
    rationale:
      "Most minimalist. 'Now in beta' eyebrow + 56px 'Built for surplus recovery.' Three sparse assurances. Founders Rate as inline bottom row, no card.",
    round: "Round 3",
  },
];

export default function SignupGallery() {
  const round1 = VARIANTS.filter((v) => v.round === "Round 1");
  const round2 = VARIANTS.filter((v) => v.round === "Round 2");
  const round3 = VARIANTS.filter((v) => v.round === "Round 3");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#04261c]">
          Signup Mockups
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#6b7280]">
          Fifteen variants, anchored to real signup pages. Each variant renders
          as a clickable page so proportions are visible in browser.
        </p>
      </div>

      <Section
        title="Round 3 (Latest)"
        subtitle="Real logo from /brand. Headlines fill full panel width. Vertical single-column checks (no 2-column grids). Founders Rate sells harder: prominent number, lock-in copy, Limited Window pill. Trial assurances on most variants instead of 'What You Get' feature lists."
      >
        {round3.map((v) => (
          <VariantCard key={v.slug} variant={v} />
        ))}
      </Section>

      <Section
        title="Round 2"
        subtitle="Split screen, dark side opposite the form, no logo box on the dark side, check bullets and Founders Rate card."
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
          Copy Anchoring For Round 3
        </div>
        <ul className="mt-3 flex flex-col gap-2 text-[12.5px] text-[#374151]">
          <li>
            Headlines: 3 to 7 words, single line. Either verb forward
            (Linear: &ldquo;Plan and build your products.&rdquo;) or a
            positioning statement (Mercury: &ldquo;Banking built for
            startups.&rdquo; / Cursor: &ldquo;The AI Code Editor.&rdquo;).
          </li>
          <li>
            No &ldquo;What You Get&rdquo; eyebrow. Linear, Stripe, Cursor,
            Mercury, Notion all skip eyebrows on the brand side. Only
            kept for anchoring a number (Founders Rate &rarr; $49).
          </li>
          <li>
            Trial assurances beat feature lists at signup. Pipedrive does
            this. The user came from your landing knowing the features,
            now they need to know the commitment terms.
          </li>
          <li>
            Founders Rate as a number, not a card. Prominent $49 with
            lock-in copy and Limited Window pill. Mercury does this with
            their $0/month opening offer.
          </li>
          <li>
            Two-tone headline (your &ldquo;One workspace. Every case.&rdquo;
            instinct). Anchored to Vercel &ldquo;Build. Preview. Ship.&rdquo;
            and Linear &ldquo;Plan. Build. Ship.&rdquo; pattern. Bold first,
            muted second, one line.
          </li>
          <li>
            Full panel width on headlines. Removed max-width constraints
            so 26 to 28 character headlines never wrap on the dark side.
          </li>
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
