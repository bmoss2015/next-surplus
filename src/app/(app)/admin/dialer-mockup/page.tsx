import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { CANVAS_W, CANVAS_H } from "./_data";
import { V44 } from "./_layouts/V44";
import { V45 } from "./_layouts/V45";
import { V46 } from "./_layouts/V46";
import { V47 } from "./_layouts/V47";
import { V48 } from "./_layouts/V48";

const SCALE = 0.5;
const PREVIEW_W = Math.round(CANVAS_W * SCALE);
const PREVIEW_H = Math.round(CANVAS_H * SCALE);

const VARIANTS = [
  {
    slug: "v44",
    title: "V44 · Three Zone Columns",
    premise:
      "Temporal flow maps to spatial position. Left = what's next, center = current, right = lead reference.",
    chassis: "20 / 55 / 25 columns",
    Component: V44,
  },
  {
    slug: "v45",
    title: "V45 · Centered Cockpit + Drawer",
    premise:
      "Hide most context behind a pull tab. Only the one piece of context the operator cannot defer (last conversation) stays visible.",
    chassis: "Slim queue rail, centered hero, collapsed drawer",
    Component: V45,
  },
  {
    slug: "v46",
    title: "V46 · Horizontal Banner + Wide Data Strip",
    premise:
      "Invert the proportion. The operator looks at the call card briefly, then spends 95% of the call referencing context data.",
    chassis: "200px banner, full-width context strip, horizontal queue",
    Component: V46,
  },
  {
    slug: "v47",
    title: "V47 · Card Stack",
    premise:
      "Vertical scanning instead of horizontal columns. Stacks by relevance to NOW (top), background (middle), future (bottom).",
    chassis: "Three stacked rows of ~33% each",
    Component: V47,
  },
  {
    slug: "v48",
    title: "V48 · Asymmetric L Shape",
    premise:
      "Physical proximity beats column purity. The eye path goes name → context → controls in an L; reinforce with layout.",
    chassis: "Top-left 65×65 hero, bottom strip wrap, right column",
    Component: V48,
  },
] as const;

export default async function DialerMockupIndex() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const profile = await getCurrentProfile();
  if (!profile?.isAdmin) notFound();

  const rows = [
    [VARIANTS[0], VARIANTS[1]],
    [VARIANTS[2], VARIANTS[3]],
    [VARIANTS[4]],
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-7 py-7">
      <div className="mx-auto" style={{ maxWidth: PREVIEW_W * 2 + 80 }}>
        <header className="mb-7">
          <h1 className="m-0 text-[28px] font-semibold tracking-tight text-ink">
            Dialer Layout Mockups
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
            Five structurally distinct chassis for the live call screen. Each
            tests a different premise about where operator attention
            lives during a call. Same lead data across all five so you compare
            layout, not content.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] text-gray-500 ring-1 ring-inset ring-gray-200">
            Sample lead: Cornelius J. Hayes Jr. · $146,500 surplus · June 14 conversation note
          </div>
        </header>

        <div className="space-y-7">
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`grid gap-7 ${
                row.length === 2 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {row.map(({ slug, title, premise, chassis, Component }) => (
                <Link
                  key={slug}
                  href={`/admin/dialer-mockup/${slug}`}
                  className="group block cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-card-hover"
                >
                  <div className="mb-3 flex items-baseline justify-between">
                    <div>
                      <div className="text-[14.5px] font-semibold tracking-tight text-ink">
                        {title}
                      </div>
                      <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                        {chassis}
                      </div>
                    </div>
                    <div className="text-[12px] font-medium text-petrol-700 group-hover:underline">
                      Open Full Size →
                    </div>
                  </div>
                  <div
                    className="relative overflow-hidden rounded-xl ring-1 ring-inset ring-gray-200"
                    style={{ width: PREVIEW_W, height: PREVIEW_H }}
                  >
                    <div
                      style={{
                        transform: `scale(${SCALE})`,
                        transformOrigin: "top left",
                        width: CANVAS_W,
                        height: CANVAS_H,
                      }}
                    >
                      <Component />
                    </div>
                  </div>
                  <p className="mt-3 max-w-[640px] text-[12.5px] leading-relaxed text-gray-600">
                    <span className="font-semibold text-ink">Premise:</span>{" "}
                    {premise}
                  </p>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
