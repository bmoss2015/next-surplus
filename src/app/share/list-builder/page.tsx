import Link from "next/link";

const VARIANTS = [
  {
    slug: "a",
    name: "Stacked Side Panel",
    anchor: "Salesforce, Airtable",
    rationale:
      "All filter rows visible in a right drawer the moment you open it. Operator fills in what they care about, leaves the rest blank. Zero Add Filter clicks.",
  },
  {
    slug: "b",
    name: "Two Column With Preview",
    anchor: "HubSpot",
    rationale:
      "Filter categories on the left, live preview of matching leads on the right. Counts update as you tweak any field. Best when you want confidence before saving.",
  },
  {
    slug: "c",
    name: "Horizontal Chip Bar",
    anchor: "Linear, Notion",
    rationale:
      "Single dense bar of filter chips at the top. Click any chip for an inline edit popover. Fastest path for power users who already know what they want.",
  },
  {
    slug: "d",
    name: "Card Grid",
    anchor: "Attio",
    rationale:
      "Filters grouped into visible cards (State, Stage, Surplus, etc). All controls visible from the start. Operator scans cards and picks values across them.",
  },
  {
    slug: "e",
    name: "Form View",
    anchor: "Affinity, Pipedrive",
    rationale:
      "Single column visible form with all filter controls inline. Checkboxes, multi-select chips, ranges. Fill what is relevant like a tax return.",
  },
];

export default function ListBuilderGallery() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 max-w-2xl">
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.02em] text-[#0f1729]">
          List Builder Mockups
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#6b7280]">
          Five different ways to build a calling list. Each anchored to a real CRM
          that handles this well. Same filter taxonomy and same fake lead set across
          all five so the comparison is apples to apples.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {VARIANTS.map((v) => (
          <Link
            key={v.slug}
            href={`/share/list-builder/${v.slug}`}
            className="group block cursor-pointer rounded-[10px] border border-[#e5e7eb] bg-white p-5 transition hover:border-[#0f1729]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
                {v.slug.toUpperCase()}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#13644e]">
                {v.anchor}
              </span>
            </div>
            <div className="mt-3 text-[17px] font-semibold tracking-[-0.01em] text-[#0f1729]">
              {v.name}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#374151]">
              {v.rationale}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0f1729] group-hover:underline">
              Open Variant
              <span aria-hidden>&rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
