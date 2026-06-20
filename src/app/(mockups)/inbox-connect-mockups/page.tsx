import Link from "next/link";

type Variant = {
  slug: string;
  name: string;
  layout: string;
  anchor: string;
  rationale: string;
  recommended?: boolean;
};

const VARIANTS: Variant[] = [
  {
    slug: "v6",
    name: "Progressive Column + Google Walkthrough",
    layout: "V1 Base + 2FA Pre Flight + Loom + Clipboard Pill",
    anchor: "Hybrid · v1 + v2 + Notion/Slack install pattern",
    rationale:
      "Recommended hybrid. V1 base, style C success indicator (small petrol dot, no tinted background), provider preview collapsed into a chip, and a full Google walkthrough with 2 Step Verification pre flight, Loom video placeholder, annotated screenshot strip, and a clipboard auto detect pill.",
    recommended: true,
  },
  {
    slug: "v1",
    name: "Progressive Column",
    layout: "Centered Modal, Single Growing Panel",
    anchor: "Linear · linear.app",
    rationale:
      "One panel that grows downward as you fill it. No step dots, no Next button between fields. The form is itself the progress indicator. Lowest chrome, feels magical.",
  },
  {
    slug: "v2",
    name: "Split Drawer With Live Preview",
    layout: "Right Side Drawer, Form Left, Provider Card Right",
    anchor: "Attio · attio.com",
    rationale:
      "Right-side drawer with a form on the left and a live provider preview on the right showing logo, capabilities, and what data the portal will access. Highest trust, transparency-forward.",
  },
  {
    slug: "v3",
    name: "Magic Field",
    layout: "Ultra Minimal Centered Card",
    anchor: "Superhuman · Raycast",
    rationale:
      "One input. Type your email, press Enter. Password field reveals inline. No buttons, no labels, no chrome. Power user feel. Reads as a command palette.",
  },
  {
    slug: "v4",
    name: "Provider Tile Grid",
    layout: "Centered Modal With Visual Tile Grid",
    anchor: "Notion · notion.so",
    rationale:
      "Email field at top, provider tiles below. Auto-detected tile highlights with a brand ring. Users can let the highlight guide them or pick manually. Hybrid auto and explicit.",
  },
  {
    slug: "v5",
    name: "Conversational Column",
    layout: "Narrow Column, Question By Question",
    anchor: "Stripe Atlas · stripe.com",
    rationale:
      "Narrow centered column, no modal border, questions reveal one at a time. Confirmed answers collapse above as compact rows. Highest hand holding, lowest cognitive load.",
  },
];

export default function InboxConnectGallery() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#04261c]">
          Inbox Connect Mockups
        </h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[#6b7280]">
          Five directional wizards for the new Add Inbox flow. Each variant
          shows three stages of the flow stacked vertically (initial, provider
          detected, connected) so you can scan the full flow on one screen.
          Each is anchored to a known product with strong design.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VARIANTS.map((v) => (
          <VariantCard key={v.slug} variant={v} />
        ))}
      </div>

      <div className="mt-10 rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04261c]">
          Design Constraints Applied To All Variants
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] text-[#374151] md:grid-cols-2">
          <li>Inter font throughout (matches portal interior).</li>
          <li>Petrol brand palette only. No yellow, no warm neutrals.</li>
          <li>Title Case on every label, button, and section header.</li>
          <li>No em dashes in any user facing copy.</li>
          <li>Tabler style line icons via inline SVG. No emojis.</li>
          <li>Equal button widths when buttons sit side by side.</li>
          <li>Auto detect happens server side. Provider logos are inline SVG.</li>
          <li>Three flow states stacked vertically per variant page.</li>
        </ul>
      </div>

      <div className="mt-6 rounded-[10px] border border-[#e5e7eb] bg-white p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04261c]">
          Where The Wizard Lives In The Portal
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#374151]">
          Replaces the current three button row in <code>/settings</code> &gt;
          Email Accounts (Connect Gmail, Connect Outlook, Connect Other IMAP)
          with a single <strong>+ Add Inbox</strong> primary button. The
          wizard opens as a modal or drawer (depending on the variant chosen)
          and routes the user into the correct underlying flow based on a
          server side MX lookup plus Thunderbird autoconfig database query.
        </p>
      </div>
    </div>
  );
}

function VariantCard({ variant: v }: { variant: Variant }) {
  return (
    <Link
      href={`/inbox-connect-mockups/${v.slug}`}
      className={`group block rounded-[10px] border bg-white p-5 transition ${
        v.recommended
          ? "border-[#13644e] ring-1 ring-[#13644e]/30 hover:border-[#0d4b3a]"
          : "border-[#e5e7eb] hover:border-[#04261c]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
            {v.slug.toUpperCase()}
          </span>
          {v.recommended && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#13644e]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#13644e]" />
              Recommended
            </span>
          )}
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
