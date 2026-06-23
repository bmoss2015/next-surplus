import Link from "next/link";

const VARIANTS = [
  {
    slug: "a",
    name: "Settings Card Standard",
    anchor: "Portal · single grouped card",
    rationale:
      "Everything inside one settings-card surface. Eyebrow group headers between sections. Matches the AttorneysSection / EmailTemplatesSection layout in the portal.",
  },
  {
    slug: "b",
    name: "Multi-Card Stack",
    anchor: "Portal · separate settings-cards per concern",
    rationale:
      "Each concern (Your Numbers, Buy A Number, Per State Rotation, SMS Setup) is its own settings-card with its own head. Most modular. Matches Notifications / Security panel layouts.",
  },
  {
    slug: "c",
    name: "Numbered Cards Grid",
    anchor: "Portal · canvas-card pattern, attorney cards",
    rationale:
      "Each phone number is its own card in a 2-up grid with capability split inside. SMS A2P registration shown as a progress strip. Most visually distinct per-number.",
  },
  {
    slug: "d",
    name: "Two-Column List + Drawer",
    anchor: "Portal · attorney/team list with right-side detail",
    rationale:
      "Left: scrollable number list. Right: 360px detail panel that updates with the selected number, or switches to Buy mode. Mirrors the AttorneysSection list + AttorneyDrawer pattern.",
  },
  {
    slug: "e",
    name: "Hero A2P Status",
    anchor: "Portal · settings-card with progress strip",
    rationale:
      "Leads with the A2P registration as a 4-step progress strip across the top so SMS readiness is always visible. Numbers list and rotation sit below. Strongest framing for the SMS gating concern.",
  },
];

export default function PhoneNumbersGallery() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#0a0d14]">
          Phone Numbers Mockups
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#5b606a]">
          Five different layouts for the Phone Numbers settings page, all anchored to the
          existing portal design tokens in <code className="text-[12px]">preview.css</code> (no monospace, 7px buttons,
          14px cards, 12px stats-strip, iOS pill toggles, dot + glow status, brand #0d4b3a).
          Same content, same functional surface, different structural treatment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.slug}
            href={`/share/phone-numbers/${v.slug}`}
            className="group block cursor-pointer rounded-[14px] border border-[#ebedf0] bg-white p-5 transition hover:border-[#d8d6cf]"
            style={{ boxShadow: "0 1px 2px rgba(12,13,16,0.02)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9298a3]">
                {v.slug.toUpperCase()}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#0d4b3a]">
                {v.anchor}
              </span>
            </div>
            <div className="mt-3 text-[16px] font-semibold tracking-[-0.018em] text-[#0a0d14]">
              {v.name}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#5b606a]">
              {v.rationale}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0a0d14] group-hover:underline">
              Open Variant
              <span aria-hidden>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
