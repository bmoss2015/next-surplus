import Link from "next/link";

const VARIANTS = [
  {
    slug: "a",
    name: "Just Pick A List",
    anchor: "Mojo, PhoneBurner",
    layout: "Single Screen, Zero Stepper",
    rationale:
      "One screen, two clicks. Giant saved view picker is the focal element. Defaults sit quietly underneath with a Change link. Start button takes the bottom.",
    bestFor:
      "Operators who run the same list every day. Lowest possible friction.",
  },
  {
    slug: "b",
    name: "Launch Pad",
    anchor: "Linear, Affinity",
    layout: "Split, Live Filter Plus Preview",
    rationale:
      "Left column is the list selector and refine chips. Right column previews the first leads in queue with counts updating live as filters change.",
    bestFor:
      "Operators who refine the list every session and want to see what they will actually dial before launching.",
  },
  {
    slug: "c",
    name: "Card Stack",
    anchor: "Pipedrive, Folk",
    layout: "Three Cards, One Screen",
    rationale:
      "Three side by side cards (Who, How, After) make every concern visible at once with an Adjust link on each. No stepper. Start bar across the bottom.",
    bestFor:
      "Operators who want to confirm all three concerns at a glance without clicking into multiple steps.",
  },
  {
    slug: "d",
    name: "Constellation",
    anchor: "Attio, Visual Forward",
    layout: "Map First, Defaults Quiet",
    rationale:
      "US map clusters leads by state. Saved view chip swap repaints the constellation. Side panel shows state breakdown. Defaults strip and Start at the bottom.",
    bestFor:
      "Selling the visual identity of the product. Lead distribution feels tangible. Strong screenshot for the marketing site.",
  },
  {
    slug: "e",
    name: "Two-Step Minimal",
    anchor: "Salesloft, Stripe Checkout",
    layout: "Step 1 Pick, Step 2 Confirm",
    rationale:
      "Honors the wizard mental model but only two screens. Step 1 picks the list. Step 2 is a clean recap with defaults inline and a big Start button.",
    bestFor:
      "Operators who want an explicit Review Before Launch pause. Easiest to extend later without breaking the flow.",
  },
];

export default function DialerWizardGallery() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          Dialer Wizard Mockups
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#6b7280]">
          Five distinct mental models for launching a Power Dialer session.
          Same data on every variant (47 leads, First Contact Due saved view,
          four outcome templates already configured). Pick the model that fits
          how an operator actually opens the dialer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.slug}
            href={`/share/dialer-wizard/${v.slug}`}
            className="group block cursor-pointer rounded-[10px] border border-[#e5e7eb] bg-white p-5 transition hover:border-[#0f1729]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
                {v.slug.toUpperCase()}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#13644e]">
                {v.layout}
              </span>
            </div>
            <div className="mt-3 text-[17px] font-semibold tracking-[-0.01em] text-[#0f1729]">
              {v.name}
            </div>
            <div className="mt-1 text-[12px] text-[#6b7280]">
              Anchored to {v.anchor}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#374151]">
              {v.rationale}
            </p>
            <div className="mt-3 text-[11.5px] text-[#6b7280]">
              <span className="font-semibold text-[#0f1729]">Best For: </span>
              {v.bestFor}
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0f1729] group-hover:underline">
              Open Variant
              <span aria-hidden>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-[10px] border border-[#e5e7eb] bg-white p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f1729]">
          Constraints Applied To Every Variant
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] text-[#374151] md:grid-cols-2">
          <li>Account-level setup (caller IDs, voicemail, templates) lives in Settings, not the wizard.</li>
          <li>Saved CRM view is the primary lead source on every variant.</li>
          <li>Skip DNC is implicit. It is never an unchecked option.</li>
          <li>No yellow, amber, or tinted green chips anywhere.</li>
          <li>Title Case headers. No em dashes. US date format.</li>
          <li>Equal button widths when CTAs sit side by side.</li>
        </ul>
      </div>
    </div>
  );
}
