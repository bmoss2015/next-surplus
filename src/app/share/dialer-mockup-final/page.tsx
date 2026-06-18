import Link from "next/link";
import type { Metadata } from "next";
import { CANVAS_W, CANVAS_H } from "./_data";
import { V44 } from "./_layouts/V44";
import { V45 } from "./_layouts/V45";
import { V47 } from "./_layouts/V47";

export const metadata: Metadata = {
  title: "Dialer Mockups Final | Next Surplus",
  description: "Three power dialer chassis for the Next Surplus call screen.",
};

const SCALE = 0.55;
const PREVIEW_W = Math.round(CANVAS_W * SCALE);
const PREVIEW_H = Math.round(CANVAS_H * SCALE);

const VARIANTS = [
  {
    anchor: "v44",
    title: "V44 · Three Zone Columns",
    chassis: "20 / 55 / 25",
    premise:
      "Temporal flow maps to spatial position. Left = what is next, center = current, right = lead reference.",
    liveHref: "/share/dialer-mockup-final/v44",
    wrapHref: "/share/dialer-mockup-final/v44-wrap",
    Component: V44,
  },
  {
    anchor: "v45",
    title: "V45 · Centered Cockpit + Lead Data Drawer",
    chassis: "Slim queue, centered hero, collapsed right drawer",
    premise:
      "Hide most context behind a pull tab. The AI summary inside the hero replaces any always-on context block.",
    liveHref: "/share/dialer-mockup-final/v45",
    wrapHref: "/share/dialer-mockup-final/v45-wrap",
    Component: V45,
  },
  {
    anchor: "v47",
    title: "V47 · Vertical Card Stack",
    chassis: "Three stacked rows of ~33% each",
    premise:
      "Vertical scanning. Top = current, middle = context (estate + activity + contact tree), bottom = queue.",
    liveHref: "/share/dialer-mockup-final/v47",
    wrapHref: "/share/dialer-mockup-final/v47-wrap",
    Component: V47,
  },
] as const;

export default function DialerMockupFinalIndex() {
  return (
    <div className="min-h-screen bg-gray-50 px-7 py-8">
      <div
        className="mx-auto"
        style={{ maxWidth: PREVIEW_W * 2 + 80 }}
      >
        <header className="mb-7">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
            Next Surplus · Power Dialer
          </div>
          <h1 className="m-0 mt-1 text-[28px] font-semibold tracking-tight text-ink">
            Final Three Chassis
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-gray-600">
            Three structurally distinct call screens with the locked design system applied to each.
            Same lead, same estate, same AI summary across all three so the comparison reads as
            chassis, not content. Each variant has a Live Call screen and a Wrap Up screen
            showing how the control row morphs into disposition chips while the next call counts down.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Lead · Cornelius J. Hayes Jr.
            </span>
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Son of Deceased Owner
            </span>
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Hayes Estate · $146,132 Net to Firm
            </span>
            <span className="rounded-md bg-petrol-100 px-2 py-1 font-semibold text-petrol-700">
              Cuyahoga County · Tax Sale May 6
            </span>
          </div>

          <nav className="mt-5 flex flex-wrap items-center gap-2 text-[11.5px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Jump To
            </span>
            {VARIANTS.map((v) => (
              <a
                key={v.anchor}
                href={`#${v.anchor}`}
                className="cursor-pointer rounded-md bg-white px-2.5 py-1 font-semibold text-petrol-700 ring-1 ring-inset ring-gray-200 hover:bg-petrol-100"
              >
                {v.title.split(" · ")[0]}
              </a>
            ))}
          </nav>
        </header>

        <DecisionsBlock />

        <div className="mt-7 space-y-7">
          {VARIANTS.map(({ anchor, title, chassis, premise, liveHref, wrapHref, Component }) => (
            <section
              key={anchor}
              id={anchor}
              className="scroll-mt-8 rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-[16px] font-semibold tracking-tight text-ink">
                    {title}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                    {chassis}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={liveHref}
                    className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-petrol-700 px-4 text-[12px] font-semibold text-white hover:bg-petrol-500"
                  >
                    Open Full Size
                  </Link>
                  <Link
                    href={wrapHref}
                    className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-white px-4 text-[12px] font-semibold text-petrol-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
                  >
                    Wrap Up State
                  </Link>
                </div>
              </div>

              <p className="mb-4 max-w-[680px] text-[12.5px] leading-relaxed text-gray-600">
                <span className="font-semibold text-ink">Premise:</span> {premise}
              </p>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Live Call
                  </div>
                  <Link
                    href={liveHref}
                    className="block cursor-pointer overflow-hidden rounded-xl ring-1 ring-inset ring-gray-200 transition-shadow hover:shadow-card-hover"
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
                  </Link>
                </div>
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Wrap Up · Disposition + Countdown
                  </div>
                  <Link
                    href={wrapHref}
                    className="block cursor-pointer overflow-hidden rounded-xl ring-1 ring-inset ring-gray-200 transition-shadow hover:shadow-card-hover"
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
                      <Component wrap />
                    </div>
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function DecisionsBlock() {
  const groups = [
    {
      head: "Palette + Controls",
      items: [
        "Petrol only. Gradient is luminance shift within the petrol hue. No teal drift, no second hue.",
        "8px control radius. No pill buttons. No borders on transparent surfaces.",
      ],
    },
    {
      head: "Cadence",
      items: [
        "Power dialer. 3 second default between disposition and next dial, configurable 0 to 10.",
        "Skip button always visible and active during the countdown.",
        "Disposition logs during ring time of the next call. No forced wait window.",
      ],
    },
    {
      head: "Wrap Up Morph",
      items: [
        "Control row morphs in place into the 5 disposition chips.",
        "Countdown banner appears above the hero (Next: Otis Crockett, 0:03, Dial Now).",
        "Next call fires at 0 or on Dial Now. If it connects before disposition, the prompt defers.",
      ],
    },
    {
      head: "AI Summary",
      items: [
        "What You Already Know powered by Gemini Flash 8B. Always populated.",
        "Cold lead synthesizes from estate metadata. Warm lead synthesizes from notes + dispositions.",
        "Attribution chip shows AI Summary · Gemini with a refresh icon.",
        "Fallback: Loading summary for 2s, then most recent note, then No prior contact · Lead added [date]. Never blank.",
      ],
    },
    {
      head: "Relationships + Estate",
      items: [
        "Every contact shows relationship under name. Required at import. Unknown becomes Relationship Unknown.",
        "Same Estate · Contact 2 of 4 chip during cascade. Queue position does not increment within an estate.",
        "New Estate · Hayes → Crockett flash chip for 2 seconds on estate transition.",
      ],
    },
    {
      head: "Stats + Queue",
      items: [
        "Top stats strip: Dials, Connects (pulses on new connect), Rate, Talk. Each with target indicator.",
        "Queue header: 3 of 100 Leads · 47 Dials · 9 Connects · 19% Rate. Search + jump to position on top.",
        "Case Number always labeled. Never Cause Number, never an unlabeled ID. Floor never appears in UI.",
      ],
    },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-petrol-700">
        Locked Decisions Across All Three
      </div>
      <div className="mt-4 grid grid-cols-3 gap-x-8 gap-y-5">
        {groups.map((g) => (
          <div key={g.head}>
            <div className="text-[11px] font-semibold tracking-tight text-ink">
              {g.head}
            </div>
            <ul className="mt-1.5 space-y-1">
              {g.items.map((it, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[11.5px] leading-snug text-gray-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-petrol-500" />
                  <span className="flex-1">{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
